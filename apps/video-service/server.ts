import express from 'express'
import { errorHandler } from './app/middlewares/error.handler'
import {connectDB} from '@shared/database'
import envConfig from './app/config/env.config'


const app = express()

app.use(express.json())
app.use(express.urlencoded())



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
