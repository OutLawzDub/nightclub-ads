import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import scrapePlaceminute from './scraper/placeminute-scraper.js';
import { processCsvData } from './utils/process-csv-data.js';
import { logger } from './utils/logger.js';

dotenv.config();

const main = async () => {
  try {
    logger.info('Starting Placeminute scraper...');
    
    logger.info('Connecting to database...');
    await connectDatabase();
    logger.success('Database connected');
    
    const events = await scrapePlaceminute();
    
    if (events && events.length > 0) {
      logger.info('Starting CSV data processing...');
      await processCsvData();
      logger.success('CSV data processing completed');
    }
    
    logger.success('Process completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Main process error', error);
    process.exit(1);
  }
};

main();

