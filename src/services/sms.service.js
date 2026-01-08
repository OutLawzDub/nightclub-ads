import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const normalizePhoneForTwilio = (phoneNumber) => {
  if (!phoneNumber) {
    return null;
  }
  
  let cleaned = phoneNumber.replace(/\s+/g, '').replace(/\.|-|_|\(|\)/g, '');
  
  if (cleaned.startsWith('+33')) {
    return cleaned;
  } else if (cleaned.startsWith('0033')) {
    return '+33' + cleaned.substring(4);
  } else if (cleaned.startsWith('33') && cleaned.length === 11) {
    return '+33' + cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    return '+33' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('+')) {
    return '+33' + cleaned;
  }
  
  return cleaned;
};

export const sendSms = async (to, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Configuration Twilio manquante. Vérifiez vos variables d\'environnement.');
    }

    const normalizedPhone = normalizePhoneForTwilio(to);
    
    if (!normalizedPhone) {
      throw new Error(`Numéro de téléphone invalide: ${to}`);
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizedPhone,
    });
    
    console.log(`SMS envoyé à ${normalizedPhone}: ${result.sid}`);
    return {
      success: true,
      messageSid: result.sid,
      status: result.status,
      phoneNumber: normalizedPhone,
    };
  } catch (error) {
    console.error(`Erreur envoi SMS à ${to}:`, error.message);
    throw error;
  }
};

export const sendBulkSms = async (phoneNumbers, message) => {
  const results = [];
  const errors = [];
  
  for (const phoneNumber of phoneNumbers) {
    try {
      const result = await sendSms(phoneNumber, message);
      results.push({ phoneNumber, ...result });
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errors.push({ 
        phoneNumber, 
        error: error.message,
        code: error.code,
      });
    }
  }
  
  return {
    success: results.length,
    failed: errors.length,
    total: phoneNumbers.length,
    results,
    errors,
  };
};





