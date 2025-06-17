// models/DayLog.js
import { DataTypes } from 'sequelize';
import sequelize from '../utilities/db.js';
import User from './user.js';

const DayLog = sequelize.define('DayLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true,
    defaultValue: DataTypes.NOW,
    unique: true
  },
});

User.hasMany(DayLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
DayLog.belongsTo(User, { foreignKey: 'userId' });

export default DayLog;
