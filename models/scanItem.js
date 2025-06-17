import { DataTypes } from 'sequelize';
import sequelize from '../utilities/db.js';
import Scan from './scan.js';

const ScanItem = sequelize.define('ScanItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  foodName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  boxX: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  boxY: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  boxW: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  boxH: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

Scan.hasMany(ScanItem, { foreignKey: 'scanId', as: 'items', onDelete: 'CASCADE' });
ScanItem.belongsTo(Scan, { foreignKey: 'scanId', as: 'scan' });

export default ScanItem;
