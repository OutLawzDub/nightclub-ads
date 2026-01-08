import prompts from 'prompts';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database.js';
import UserAuth from '../models/user-auth.model.js';

const generatePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const createAdmin = async () => {
  try {
    await connectDatabase();

    const response = await prompts([
      {
        type: 'text',
        name: 'email',
        message: 'Enter email address:',
        validate: (value) => {
          if (!value) return 'Email is required';
          if (!value.includes('@')) return 'Invalid email format';
          return true;
        },
      },
      {
        type: 'select',
        name: 'passwordOption',
        message: 'How do you want to set the password?',
        choices: [
          { title: 'Enter manually', value: 'manual' },
          { title: 'Generate automatically', value: 'auto' },
        ],
      },
      {
        type: (prev) => (prev === 'manual' ? 'password' : null),
        name: 'password',
        message: 'Enter password:',
        validate: (value) => {
          if (!value) return 'Password is required';
          if (value.length < 6) return 'Password must be at least 6 characters';
          return true;
        },
      },
    ]);

    let password = response.password;

    if (response.passwordOption === 'auto') {
      password = generatePassword();
      console.log('\nGenerated password:', password);
    }

    const existingUser = await UserAuth.findOne({ where: { email: response.email } });

    if (existingUser) {
      console.log('User with this email already exists');
      process.exit(1);
    }

    const user = await UserAuth.create({
      email: response.email,
      password: password,
    });

    console.log('\nUser created successfully!');
    console.log('Email:', user.email);
    console.log('Password:', password);

    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
};

createAdmin();

