import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import signupRoute from './routes/signup';
import vehicleRoute from './routes/vehicle';
import userRoute from './routes/user';
import rentalRoute from './routes/rental';
import paymentRoute from './routes/payment';
import reviewRoute from './routes/review';
import weatherRoute from './routes/weather';
import https from 'https';
import fs from 'fs';
import { AppDataSource } from './db';
import {configDotenv} from 'dotenv';
const app = express();

const allowedOrigins = ['http://localhost:5173', 'https://production-domain.com'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(morgan('tiny'));
app.use(express.json()); 
app.use('/api', vehicleRoute); 
// Routes
app.use('/api', signupRoute);
app.use('/api/user/', userRoute); 
app.use('/api', rentalRoute); 
app.use('/api', paymentRoute); 
app.use('/api', reviewRoute);
app.use('/api', weatherRoute);
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

const sslOptions = {
  key: fs.readFileSync('./src/crypto/key.pem'),
  cert: fs.readFileSync('./src./crypto/cert.pem'),
};

configDotenv()
AppDataSource.initialize()
.then(() => {
  console.log('Database connection established successfully!');
  const port = process.env.SERVER_PORT || 3000;

  https.createServer(sslOptions, app)
    .listen(port, () =>
     console.log(`Server running on http://localhost:${port}`)
  )

}).catch((error) => {
  console.error('Error during Data Source initialization:', error);
})
