import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOAD_PATH = path.resolve(__dirname, '../../downloads');

export const parseExcelFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    return data;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw error;
  }
};

export const parseCsvFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 3) {
      console.log('Not enough lines in CSV file');
      return [];
    }

    const separator = lines[1].includes(';') ? ';' : ',';
    
    const parseLine = (line) => {
      const values = [];
      let currentValue = '';
      let insideQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === separator && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      
      return values;
    };

    const headers = parseLine(lines[1]).map(h => h.trim().replace(/^"|"$/g, '').replace(/\s+/g, ' '));
    
    console.log('\n=== CSV PARSING DEBUG ===');
    console.log('Total headers:', headers.length);
    console.log('All headers:');
    headers.forEach((header, idx) => {
      console.log(`  [${idx}] "${header}"`);
    });
    console.log('=== END HEADERS DEBUG ===\n');
    
    const data = [];

    for (let i = 2; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      
      const row = {};
      headers.forEach((header, index) => {
        if (header && header.trim() !== '') {
          row[header] = (values[index] || '').replace(/^"|"$/g, '').trim();
        }
      });
      
      data.push(row);
    }

    return data;
  } catch (error) {
    console.error('Error parsing CSV file:', error);
    throw error;
  }
};

export const findLatestExcelFile = (dirPath = DOWNLOAD_PATH) => {
  try {
    if (!fs.existsSync(dirPath)) {
      return null;
    }

    const files = fs.readdirSync(dirPath);
    const excelFiles = files.filter(file => 
      file.endsWith('.xlsx') || file.endsWith('.xls')
    );

    if (excelFiles.length === 0) {
      return null;
    }

    excelFiles.sort((a, b) => {
      const statA = fs.statSync(path.join(dirPath, a));
      const statB = fs.statSync(path.join(dirPath, b));
      return statB.mtime.getTime() - statA.mtime.getTime();
    });

    return path.join(dirPath, excelFiles[0]);
  } catch (error) {
    console.error('Error finding Excel file:', error);
    throw error;
  }
};

export const findLatestCsvFile = (dirPath = DOWNLOAD_PATH) => {
  try {
    if (!fs.existsSync(dirPath)) {
      return null;
    }

    const files = fs.readdirSync(dirPath);
    const csvFiles = files.filter(file => file.endsWith('.csv'));

    if (csvFiles.length === 0) {
      return null;
    }

    csvFiles.sort((a, b) => {
      const statA = fs.statSync(path.join(dirPath, a));
      const statB = fs.statSync(path.join(dirPath, b));
      return statB.mtime.getTime() - statA.mtime.getTime();
    });

    return path.join(dirPath, csvFiles[0]);
  } catch (error) {
    console.error('Error finding CSV file:', error);
    throw error;
  }
};

export const findAllCsvFiles = (dirPath = DOWNLOAD_PATH) => {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }

    const files = fs.readdirSync(dirPath);
    const csvFiles = files.filter(file => file.endsWith('.csv'));

    return csvFiles.map(file => path.join(dirPath, file));
  } catch (error) {
    console.error('Error finding CSV files:', error);
    throw error;
  }
};

