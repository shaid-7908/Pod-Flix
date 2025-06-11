import envConfig from "./config";
import express from 'express'
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  QueueAttributeName,
} from "@aws-sdk/client-sqs";


const sqsClient = new SQSClient({
  region: envConfig.AWS_REGION,
  credentials: {
    accessKeyId: envConfig.AWS_ACCESS_KEY!,
    secretAccessKey: envConfig.AWS_SECRET_KEY!,
  },
});


const app = express()
app.use(express.json())

app.get('/',async (req,res)=>{
    const params = {
      QueueUrl: envConfig.AWS_SQS_QUEUE_URL!,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20,
      AttributeNames: [QueueAttributeName.All],
      MessageAttributeNames: ["All"],
    };
   try{
    const command = new ReceiveMessageCommand(params);
    const data = await sqsClient.send(command);
    if(data.Messages && data.Messages.length > 0){
      if(data.Messages[0].Body){
        const message = JSON.parse(data.Messages[0].Body);
        res.status(200).json(message);
      }
      
    }else{

      res.status(200).json(data)
    }

   }catch(err){
    console.log(err)
    res.status(500).json(err)
   }
})


const startServer = async () => {
  try {
    // await connectDB(envConfig.MONGODB_URL, envConfig.MONGODB_DB_NAME); // Connect to MongoDB
    app.listen(envConfig.PORT, () => {
      console.log(
        `✅ upload-service running on http://localhost:${envConfig.PORT}`
      );
    });
  } catch (err) {
    console.error("❌ Failed to connect to DB. Server not started.", err);
    process.exit(1); // Exit if DB fails
  }
};

startServer();

