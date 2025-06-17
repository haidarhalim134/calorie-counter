import pg from "pg"
import { Sequelize } from "sequelize";
import dotenv from 'dotenv'

dotenv.config();

let sequelize = new Sequelize({
  dialect: "mysql", //process.env.DB_DIALECT,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
    logging: false 
});


export default sequelize;
