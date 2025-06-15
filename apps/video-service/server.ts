import express from 'express'
import { errorHandler } from './app/middlewares/error.handler'
import {connectDB} from '@shared/database'
import envConfig from './app/config/env.config'
import streaminRouter from './app/routes/streaming.route'
import cookieParser from 'cookie-parser'

const app = express()

app.use(express.json())
app.use(express.urlencoded())
app.use(cookieParser())

app.use('/api/v1/',streaminRouter)

app.use(errorHandler)


const startServer = async ()=>{
  try{
     await connectDB(envConfig.MONGODB_URL,envConfig.MONGODB_DB_NAME)

     app.listen(envConfig.PORT, () => {
       console.log(
         `✅ video-service running on http://localhost:${envConfig.PORT}`
       );
     });
  }catch(err){
     console.log(err)
     process.exit(1)
  }
}
startServer()
