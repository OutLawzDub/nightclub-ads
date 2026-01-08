import { connectDatabase } from '../../config/database.js';

let isConnected = false;

export async function ensureDatabaseConnection() {
  if (!isConnected) {
    await connectDatabase();
    isConnected = true;
  }
}

