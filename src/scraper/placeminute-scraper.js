import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDatabase } from '../config/database.js';
import { processCsvData } from '../utils/process-csv-data.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOAD_PATH = path.resolve(__dirname, '../../downloads');

if (!fs.existsSync(DOWNLOAD_PATH)) {
  fs.mkdirSync(DOWNLOAD_PATH, { recursive: true });
}

const launchBrowser = async () => {
  return await puppeteer.launch({
    headless: true,
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
    logger.info('Checking for cookie consent...');
    await waitForTimeout(2000);
    
    const acceptButton = await page.$('button[data-cky-tag="accept-button"]');
    if (acceptButton) {
      logger.info('Cookie consent found, accepting...');
      await acceptButton.click();
      await waitForTimeout(1000);
    } else {
      logger.debug('No cookie consent found');
    }
  } catch (error) {
    logger.warn('Cookie consent not found or already handled', error);
  }
};

const login = async (page, email, password) => {
  logger.info('Logging in to Placeminute...');
  
  try {
    await page.goto('https://pro.placeminute.com/connexion.html', {
      waitUntil: 'networkidle2',
    });

    await handleCookieConsent(page);

    await page.waitForSelector('#_username', { timeout: 10000 });
    logger.info('Login form found');
    
    await page.click('#_username', { clickCount: 3 });
    await page.type('#_username', email);
    
    await page.waitForSelector('#_password');
    await page.click('#_password', { clickCount: 3 });
    await page.type('#_password', password);

    await page.click('button[type="submit"]');
    logger.info('Submit button clicked, waiting for navigation...');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    const currentUrl = page.url();
    if (currentUrl.includes('connexion') || currentUrl.includes('login') || currentUrl.includes('error')) {
      throw new Error('Login failed - still on login page or error page');
    }
    
    logger.success('Login successful');
  } catch (error) {
    logger.error('Login error', error);
    throw error;
  }
};

const getEventList = async (page) => {
  logger.info('Navigating to events page...');
  
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

    logger.success(`Found ${events.length} event(s)`, { eventsCount: events.length, eventIds: events.map(e => e.eventId) });
    return events;
  } catch (error) {
    logger.error('Error getting event list', error);
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
      logger.success(`Renamed file to: ${newName}`, { eventId, oldName: latestFile, newName });
      return newName;
    }
  } catch (error) {
    logger.error('Error renaming CSV file', error);
  }
};

const downloadEventCsv = async (page, eventGroupId, eventId) => {
  try {
    logger.info(`Downloading CSV for event ${eventId}...`, { eventId, eventGroupId });
    
    const exportUrl = `https://pro.placeminute.com/event/${eventGroupId}/${eventId}/ticket/export-database.html`;
    
    await page.goto(exportUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    await waitForTimeout(2000);
    
    const renamedFile = await renameLatestCsvFile(eventId);
    if (renamedFile) {
      logger.success(`CSV downloaded and renamed: ${renamedFile}`, { eventId, fileName: renamedFile });
    } else {
      logger.warn(`CSV downloaded for event ${eventId} but file not renamed`, { eventId });
    }
  } catch (error) {
    if (error.message.includes('ERR_ABORTED')) {
      logger.info(`CSV download initiated for event ${eventId} (ERR_ABORTED is normal for downloads)`, { eventId });
      await waitForTimeout(2000);
      await renameLatestCsvFile(eventId);
    } else {
      logger.error(`Error downloading CSV for event ${eventId}`, error);
    }
  }
};

const setupDownloadBehavior = async (page) => {
  const client = await page.target().createCDPSession();
  logger.info(`Setting download path to: ${DOWNLOAD_PATH}`, { downloadPath: DOWNLOAD_PATH });
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOAD_PATH,
  });
};

const scrapePlaceminute = async () => {
  logger.info('Starting Placeminute scraper...');
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
      logger.warn('No events found');
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

    logger.success(`Successfully downloaded ${downloadedFiles.length} CSV file(s)`, { 
      downloadedCount: downloadedFiles.length,
      events: downloadedFiles 
    });
    return downloadedFiles;
  } catch (error) {
    logger.error('Scraping error', error);
    throw error;
  } finally {
    logger.info('Closing browser...');
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
      logger.info('Connecting to database...');
      await connectDatabase();
      logger.success('Database connected');
      
      const events = await scrapePlaceminute();
      
      if (events && events.length > 0) {
        logger.info('Starting CSV data processing...');
        await processCsvData();
        logger.success('CSV data processing completed');
      }
      
      logger.success('Scraping and processing completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Scraping failed', error);
      process.exit(1);
    }
  })();
}
