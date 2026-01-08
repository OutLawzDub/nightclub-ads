import User from '../models/user.model.js';

export const createUser = async (userData) => {
  try {
    const user = await User.create({
      phoneNumber: userData.phoneNumber,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      postalCode: userData.postalCode,
      birthDate: userData.birthDate,
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const findUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });
    return user;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

export const findUserByPhoneNumber = async (phoneNumber) => {
  try {
    const user = await User.findOne({ where: { phoneNumber } });
    return user;
  } catch (error) {
    console.error('Error finding user by phone number:', error);
    throw error;
  }
};

export const findAllUsers = async () => {
  try {
    const users = await User.findAll();
    return users;
  } catch (error) {
    console.error('Error finding all users:', error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    await user.update(userData);
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const getUserByIds = async (ids) => {
  try {
    const users = await User.findAll({ where: { id: ids } });
    return users;
  } catch (error) {
    console.error('Error finding users by ids:', error);
    throw error;
  }
};

