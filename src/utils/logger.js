import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.resolve(__dirname, '../../logs');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const getLogFileName = () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  return path.join(LOGS_DIR, `scraper-${dateStr}.log`);
};

const formatTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

const formatLogMessage = (level, message, data = null) => {
  const timestamp = formatTimestamp();
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    if (data instanceof Error) {
      logMessage += `\n  Error: ${data.message}`;
      if (data.stack) {
        logMessage += `\n  Stack: ${data.stack}`;
      }
    } else if (typeof data === 'object') {
      logMessage += `\n  Data: ${JSON.stringify(data, null, 2)}`;
    } else {
      logMessage += `\n  Data: ${data}`;
    }
  }
  
  return logMessage + '\n';
};

const writeToFile = (message) => {
  try {
    const logFile = getLogFileName();
    fs.appendFileSync(logFile, message, 'utf8');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};

export const logger = {
  info: (message, data = null) => {
    const logMessage = formatLogMessage('INFO', message, data);
    console.log(message, data || '');
    writeToFile(logMessage);
  },
  
  success: (message, data = null) => {
    const logMessage = formatLogMessage('SUCCESS', message, data);
    console.log(`✓ ${message}`, data || '');
    writeToFile(logMessage);
  },
  
  warn: (message, data = null) => {
    const logMessage = formatLogMessage('WARN', message, data);
    console.warn(`⚠ ${message}`, data || '');
    writeToFile(logMessage);
  },
  
  error: (message, error = null) => {
    const logMessage = formatLogMessage('ERROR', message, error);
    console.error(`✗ ${message}`, error || '');
    writeToFile(logMessage);
  },
  
  debug: (message, data = null) => {
    const logMessage = formatLogMessage('DEBUG', message, data);
    console.debug(`🔍 ${message}`, data || '');
    writeToFile(logMessage);
  },
};
