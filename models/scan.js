// models/Scan.js
import { DataTypes } from 'sequelize';
import sequelize from '../utilities/db.js';
import DayLog from './dayLog.js';

const Scan = sequelize.define('Scan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  foodName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  calories: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  timeEaten: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: DataTypes.NOW 
  },
  imageId: {
    type: DataTypes.STRING, 
    allowNull: false
  }
}); 

DayLog.hasMany(Scan, { foreignKey: 'dayLogId', onDelete: 'CASCADE' });
Scan.belongsTo(DayLog, { foreignKey: 'dayLogId' });

export default Scan;
