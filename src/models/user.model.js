import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'phone_number',
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'first_name',
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'last_name',
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'postal_code',
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'birth_date',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

export default User;

