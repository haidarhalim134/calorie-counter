
import { DataTypes } from 'sequelize';
import sequelize from '../utilities/db.js';

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data: {
    type: DataTypes.BLOB('long'), 
    allowNull: false,
  },
}, {
  tableName: 'Images',
  timestamps: true, 
});

export default Image;
