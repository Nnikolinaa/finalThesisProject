import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as configDotenv } from 'dotenv';
import { Vehicle } from './entities/Vehicle';
import { User } from './entities/User';
import { Rental } from './entities/Rental'; 
import { Payment } from './entities/Payment'; 
import { Review } from './entities/Review';
configDotenv();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined, 
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, 
  logging: false,
  entities: [
    User, 
    Vehicle,
    Rental, 
    Payment,
    Review, 
  ],
});

AppDataSource.initialize()
  .then(() => {
    console.log(`Connected to MySQL database (${process.env.DB_NAME}) on port ${process.env.DB_PORT}.`);
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });
