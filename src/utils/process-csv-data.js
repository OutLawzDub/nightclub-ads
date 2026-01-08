import { findAllCsvFiles, parseCsvFile } from './parse-excel.js';
import { createUser, findUserByPhoneNumber } from '../services/user.service.js';

const validateAndFormatDate = (dateString) => {
  if (!dateString || dateString.trim() === '') {
    console.log('validateAndFormatDate: Empty date string');
    return null;
  }
  
  const cleanedDate = dateString.trim();
  
  const datePatterns = [
    { pattern: /^(\d{4})-(\d{2})-(\d{2})$/, type: 'YYYY-MM-DD' },
    { pattern: /^(\d{2})\/(\d{2})\/(\d{4})$/, type: 'DD/MM/YYYY' },
    { pattern: /^(\d{2})\/(\d{2})\/(\d{2})$/, type: 'DD/MM/YY' },
  ];
  
  console.log(`validateAndFormatDate: Input "${cleanedDate}"`);
  
  for (const { pattern, type } of datePatterns) {
    const match = cleanedDate.match(pattern);
    if (match) {
      console.log(`validateAndFormatDate: Matched pattern ${type}`);
      if (type === 'YYYY-MM-DD') {
        const date = new Date(cleanedDate);
        console.log(`validateAndFormatDate: Created date object: ${date}, isValid: ${!isNaN(date.getTime())}`);
        if (!isNaN(date.getTime())) {
          console.log(`validateAndFormatDate: Returning "${cleanedDate}"`);
          return cleanedDate;
        }
      } else if (type === 'DD/MM/YYYY' || type === 'DD/MM/YY') {
        const [, day, month, year] = match;
        const fullYear = year.length === 2 ? `20${year}` : year;
        const formattedDate = `${fullYear}-${month}-${day}`;
        const date = new Date(formattedDate);
        if (!isNaN(date.getTime())) {
          return formattedDate;
        }
      }
    }
  }
  
  console.log(`validateAndFormatDate: No pattern matched, returning null`);
  return null;
};

const extractPostalCode = (postalCodeString) => {
  if (!postalCodeString || postalCodeString.trim() === '') {
    return '';
  }
  
  const cleaned = postalCodeString.trim();
  
  const matchInParentheses = cleaned.match(/\((\d{5})\)/);
  if (matchInParentheses) {
    return matchInParentheses[1];
  }
  
  const matchFiveDigits = cleaned.match(/^(\d{5})/);
  if (matchFiveDigits) {
    return matchFiveDigits[1];
  }
  
  return cleaned;
};

const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return null;
  }
  
  let cleaned = phoneNumber.replace(/\s+/g, '').replace(/\.|-|_|\(|\)/g, '');
  
  if (cleaned.startsWith('+33')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.startsWith('0033')) {
    cleaned = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('33') && cleaned.length === 11) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  if (!cleaned.startsWith('0')) {
    return null;
  }
  
  const phoneRegex = /^0[1-9]\d{8}$/;
  if (phoneRegex.test(cleaned)) {
    return cleaned;
  }
  
  return null;
};

export const processCsvData = async () => {
  try {
    const csvFiles = findAllCsvFiles();
    
    if (csvFiles.length === 0) {
      console.log('No CSV files found in downloads folder');
      return;
    }

    console.log(`Processing ${csvFiles.length} CSV file(s)...`);

    for (const filePath of csvFiles) {
      console.log(`Processing CSV file: ${filePath}`);
      const data = parseCsvFile(filePath);

      let processedCount = 0;
      let skippedCount = 0;

      for (let idx = 0; idx < data.length; idx++) {
        const row = data[idx];
        
        if (idx === 0) {
          console.log('\n=== CSV DEBUG ===');
          console.log('Sample row keys:', Object.keys(row).slice(0, 20));
          console.log('\nLooking for birth date column...');
          Object.keys(row).forEach(key => {
            if (key.toLowerCase().includes('naissance') || key.toLowerCase().includes('birth') || key.toLowerCase().includes('date')) {
              console.log(`Found date-related column: "${key}" = "${row[key]}"`);
            }
          });
          console.log('\nFull row data (first 30 chars of each key):');
          Object.entries(row).slice(0, 30).forEach(([key, value]) => {
            console.log(`  "${key}": "${String(value).substring(0, 30)}"`);
          });
          console.log('=== END DEBUG ===\n');
        }
        
        const phoneNumberRaw = row.Téléphone || row['Téléphone'] || row.phoneNumber || row.Phone || row['Numéro de téléphone'] || '';
        const phoneNumber = normalizePhoneNumber(phoneNumberRaw);
        const email = row['Adresse e-mail'] || row['Adresse email'] || row.email || row.Email || '';
        const firstName = row.Prénom || row['Prénom'] || row.firstName || row.FirstName || '';
        const lastName = row.Nom || row['Nom'] || row.lastName || row.LastName || '';
        const postalCodeRaw = row['Code postal'] || row['Code Postal'] || row.PostalCode || row.postalCode || '';
        const postalCode = extractPostalCode(postalCodeRaw);
        
        const birthDateRaw = row['Date de naissance'] || row['Date de Naissance'] || row['Date de Naissance '] || row['Date de naissance '] || row.BirthDate || row.birthDate || '';
        
        if (idx < 3) {
          console.log(`\nRow ${idx} - Extracted birthDate raw value: "${birthDateRaw}"`);
          if (birthDateRaw) {
            const formatted = validateAndFormatDate(birthDateRaw);
            console.log(`  -> Validated date: "${formatted}"`);
          } else {
            console.log(`  -> No birthDate found for this row`);
            console.log(`  -> Available keys containing 'date':`, Object.keys(row).filter(k => k.toLowerCase().includes('date')));
          }
        }
        
        const birthDate = validateAndFormatDate(birthDateRaw);
        
        if (!phoneNumber) {
          skippedCount++;
          continue;
        }

        const existingUser = await findUserByPhoneNumber(phoneNumber);
        
        if (existingUser) {
          console.log(`User already exists: ${phoneNumber}`);
          skippedCount++;
          continue;
        }

        await createUser({
          phoneNumber: phoneNumber,
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          postalCode: postalCode.trim(),
          birthDate: birthDate,
        });

        console.log(`User created: ${phoneNumber}`);
        processedCount++;
      }

      console.log(`File processed: ${processedCount} created, ${skippedCount} skipped`);
    }

    console.log('CSV data processed successfully');
  } catch (error) {
    console.error('Error processing CSV data:', error);
    throw error;
  }
};

