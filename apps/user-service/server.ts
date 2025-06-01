import express from 'express'
import {connectDB} from '@shared/database'
import envConfig from './app/config/env.config'
import cookieParser from 'cookie-parser'

const app = express()
app.use(express.json())
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));



const startServer = async () => {
  try {
    await connectDB(envConfig.MONGODB_URL,envConfig.MONGODB_DB_NAME); // Connect to MongoDB
    app.listen(envConfig.PORT, () => {
      console.log(`✅ Server running on http://localhost:${envConfig.PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to DB. Server not started.", err);
    process.exit(1); // Exit if DB fails
  }
};

startServer();