import express from 'express'
import cookieParser from 'cookie-parser'
import {connectDB} from '@shared/database'
import envConfig from './app/config/env.config'
import { errorHandler } from './app/middleware/error.handler'
import videoRouter from './app/routes/video.routes'
import {connectRabbitMQ} from '@shared/rabbitmq'

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded())
app.use('/api/v1/',videoRouter)



app.use(errorHandler)

const startServer = async () => {
  try {
    await connectDB(envConfig.MONGODB_URL, envConfig.MONGODB_DB_NAME); // Connect to MongoDB
    await connectRabbitMQ()
    app.listen(envConfig.PORT, () => {
      console.log(`✅ upload-service running on http://localhost:${envConfig.PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to DB. Server not started.", err);
    process.exit(1); // Exit if DB fails
  }
};

startServer();