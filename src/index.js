import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import scrapePlaceminute from './scraper/placeminute-scraper.js';
import { processCsvData } from './utils/process-csv-data.js';

dotenv.config();

const main = async () => {
  try {
    console.log('Starting Placeminute scraper...');
    
    await connectDatabase();
    const events = await scrapePlaceminute();
    
    if (events && events.length > 0) {
      await processCsvData();
    }
    
    console.log('Process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Main process error:', error);
    process.exit(1);
  }
};

main();

