import express from 'express'
import {connectDB} from '@shared/database'
import envConfig from './app/config/env.config'
import cookieParser from 'cookie-parser'
import {errorHandler} from './app/middleware/error.handler'
import authRouter from './app/router/authentaction.routes'
import channelRouter from './app/router/channel.routes'
import morgan from 'morgan'

const app = express()
app.use(express.json())
app.use(morgan('dev'))
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/',authRouter)
app.use('/api/v1/',channelRouter)

app.use(errorHandler)
const startServer = async () => {
  try {
    await connectDB(envConfig.MONGODB_URL,envConfig.MONGODB_DB_NAME); // Connect to MongoDB
    app.listen(envConfig.PORT, () => {
      console.log(`✅ user-service running on http://localhost:${envConfig.PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to DB. Server not started.", err);
    process.exit(1); // Exit if DB fails
  }
};

startServer();