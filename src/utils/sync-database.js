import { connectDatabase } from '../config/database.js';
import User from '../models/user.model.js';
import UserAuth from '../models/user-auth.model.js';

const syncDatabase = async () => {
  try {
    await connectDatabase();
    await User.sync({ alter: true });
    await UserAuth.sync({ alter: true });
    console.log('Database synchronized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database sync error:', error);
    process.exit(1);
  }
};

syncDatabase();
