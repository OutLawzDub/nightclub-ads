import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDatabase } from '../config/database.js';
import { processCsvData } from '../utils/process-csv-data.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOAD_PATH = path.resolve(__dirname, '../../downloads');

if (!fs.existsSync(DOWNLOAD_PATH)) {
  fs.mkdirSync(DOWNLOAD_PATH, { recursive: true });
}

const launchBrowser = async () => {
  return await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });
};

const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handleCookieConsent = async (page) => {
  try {
    console.log('Checking for cookie consent...');
    await waitForTimeout(2000);
    
    const acceptButton = await page.$('button[data-cky-tag="accept-button"]');
    if (acceptButton) {
      console.log('Cookie consent found, accepting...');
      await acceptButton.click();
      await waitForTimeout(1000);
    } else {
      console.log('No cookie consent found');
    }
  } catch (error) {
    console.log('Cookie consent not found or already handled');
  }
};

const login = async (page, email, password) => {
  console.log('Logging in to Placeminute...');
  
  try {
    await page.goto('https://pro.placeminute.com/connexion.html', {
      waitUntil: 'networkidle2',
    });

    await handleCookieConsent(page);

    await page.waitForSelector('#_username', { timeout: 10000 });
    console.log('Login form found');
    
    await page.click('#_username', { clickCount: 3 });
    await page.type('#_username', email);
    
    await page.waitForSelector('#_password');
    await page.click('#_password', { clickCount: 3 });
    await page.type('#_password', password);

    await page.click('button[type="submit"]');
    console.log('Submit button clicked, waiting for navigation...');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    const currentUrl = page.url();
    if (currentUrl.includes('connexion') || currentUrl.includes('login') || currentUrl.includes('error')) {
      throw new Error('Login failed - still on login page or error page');
    }
    
    console.log('Login successful');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

const getEventList = async (page) => {
  console.log('Navigating to events page...');
  
  try {
    await page.goto('https://pro.placeminute.com/event/event.html', {
      waitUntil: 'networkidle2',
    });

    await waitForTimeout(2000);

    const events = await page.evaluate(() => {
      const eventLinks = document.querySelectorAll('a.event_image[href]');
      const eventData = [];
      
      eventLinks.forEach(link => {
        const href = link.getAttribute('href');
        const match = href.match(/\/event\/event\/(\d+)\/(\d+)\/show\.html/);
        if (match) {
          eventData.push({
            eventGroupId: match[1],
            eventId: match[2],
            href: href
          });
        }
      });
      
      return eventData;
    });

    console.log(`Found ${events.length} event(s)`);
    return events;
  } catch (error) {
    console.error('Error getting event list:', error);
    throw error;
  }
};

const renameLatestCsvFile = async (eventId) => {
  try {
    const files = fs.readdirSync(DOWNLOAD_PATH);
    const csvFiles = files.filter(f => f.endsWith('.csv') && !f.startsWith('event_'));
    
    if (csvFiles.length > 0) {
      const latestFile = csvFiles.sort((a, b) => {
        const statA = fs.statSync(path.join(DOWNLOAD_PATH, a));
        const statB = fs.statSync(path.join(DOWNLOAD_PATH, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
      })[0];

      const randomId = Math.random().toString(36).substring(2, 9);
      const timestamp = Date.now();
      const fileExtension = path.extname(latestFile);
      const baseFileName = path.basename(latestFile, fileExtension);
      const newName = `event_${eventId}_${randomId}_${timestamp}_${baseFileName}${fileExtension}`;
      const oldPath = path.join(DOWNLOAD_PATH, latestFile);
      const newPath = path.join(DOWNLOAD_PATH, newName);
      
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed file to: ${newName}`);
      return newName;
    }
  } catch (error) {
    console.error('Error renaming CSV file:', error);
  }
};

const downloadEventCsv = async (page, eventGroupId, eventId) => {
  try {
    console.log(`Downloading CSV for event ${eventId}...`);
    
    const exportUrl = `https://pro.placeminute.com/event/${eventGroupId}/${eventId}/ticket/export-database.html`;
    
    await page.goto(exportUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    await waitForTimeout(2000);
    
    const renamedFile = await renameLatestCsvFile(eventId);
    if (renamedFile) {
      console.log(`CSV downloaded and renamed: ${renamedFile}`);
    } else {
      console.log(`CSV downloaded for event ${eventId}`);
    }
  } catch (error) {
    if (error.message.includes('ERR_ABORTED')) {
      console.log(`CSV download initiated for event ${eventId} (ERR_ABORTED is normal for downloads)`);
      await waitForTimeout(2000);
      await renameLatestCsvFile(eventId);
    } else {
      console.error(`Error downloading CSV for event ${eventId}:`, error.message);
    }
  }
};

const setupDownloadBehavior = async (page) => {
  const client = await page.target().createCDPSession();
  console.log(`Setting download path to: ${DOWNLOAD_PATH}`);
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOAD_PATH,
  });
};

const scrapePlaceminute = async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    const email = process.env.PLACEMINUTE_EMAIL;
    const password = process.env.PLACEMINUTE_PASSWORD;

    if (!email || !password) {
      throw new Error('PLACEMINUTE_EMAIL and PLACEMINUTE_PASSWORD must be set in .env');
    }

    await setupDownloadBehavior(page);
    await login(page, email, password);
    
    const events = await getEventList(page);
    
    if (events.length === 0) {
      console.log('No events found');
      return [];
    }

    const downloadedFiles = [];
    
    for (const event of events) {
      await downloadEventCsv(page, event.eventGroupId, event.eventId);
      downloadedFiles.push({
        eventId: event.eventId,
        eventGroupId: event.eventGroupId
      });
    }

    console.log(`Successfully downloaded ${downloadedFiles.length} CSV file(s)`);
    return downloadedFiles;
  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  } finally {
    await browser.close();
  }
};

export default scrapePlaceminute;

const isMainModule = process.argv[1] && (
  process.argv[1].includes('placeminute-scraper.js') ||
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
);

if (isMainModule) {
  (async () => {
    try {
      await connectDatabase();
      const events = await scrapePlaceminute();
      
      if (events && events.length > 0) {
        console.log('\nStarting CSV data processing...');
        await processCsvData();
      }
      
      console.log('Scraping and processing completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Scraping failed:', error);
      process.exit(1);
    }
  })();
}
