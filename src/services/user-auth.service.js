import UserAuth from '../models/user-auth.model.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';

export const createUserAuth = async (email, password) => {
  try {
    const existingUser = await UserAuth.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await UserAuth.create({
      email,
      password,
    });

    return user;
  } catch (error) {
    console.error('Error creating user auth:', error);
    throw error;
  }
};

export const findUserAuthByEmail = async (email) => {
  try {
    const user = await UserAuth.findOne({ where: { email } });
    return user;
  } catch (error) {
    console.error('Error finding user auth by email:', error);
    throw error;
  }
};

export const findUserAuthByResetToken = async (token) => {
  try {
    const user = await UserAuth.findOne({ 
      where: { 
        resetPasswordToken: token,
        resetPasswordExpires: {
          [sequelize.Op.gt]: Date.now(),
        },
      },
    });
    return user;
  } catch (error) {
    console.error('Error finding user auth by reset token:', error);
    throw error;
  }
};

export const setResetPasswordToken = async (email) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000;

    await UserAuth.update(
      {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(expires),
      },
      {
        where: { email },
      }
    );

    return token;
  } catch (error) {
    console.error('Error setting reset password token:', error);
    throw error;
  }
};

export const updatePassword = async (userId, newPassword) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await UserAuth.update(
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
      {
        where: { id: userId },
      }
    );
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

export const updatePasswordByToken = async (token, newPassword) => {
  try {
    const user = await findUserAuthByResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired token');
    }

    await updatePassword(user.id, newPassword);
  } catch (error) {
    console.error('Error updating password by token:', error);
    throw error;
  }
};

