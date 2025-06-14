import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  QueueAttributeName,
} from "@aws-sdk/client-sqs";
import { publishToVideoQueue, connectRabbitMQ } from "@shared/rabbitmq";
import envConfig from "./config";

// Initialize SQS Client
const sqsClient = new SQSClient({
  region: envConfig.AWS_REGION,
  credentials: {
    accessKeyId: envConfig.AWS_ACCESS_KEY!,
    secretAccessKey: envConfig.AWS_SECRET_KEY!,
  },
});

// Polling function
const pollSQS = async () => {
  console.log('pollig here')
  const params = {
    QueueUrl: envConfig.AWS_SQS_QUEUE_URL!,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
    AttributeNames: [QueueAttributeName.All],
    MessageAttributeNames: ["All"],
  };

  try {
    const command = new ReceiveMessageCommand(params);
    const data = await sqsClient.send(command);
    console.log('try to get message')
    if (data.Messages && data.Messages.length > 0) {
      console.log('got message')
      const message = data.Messages[0];
      console.log("📥 Message received from SQS");

      if (message.Body) {
        const parsed = JSON.parse(message.Body);
        const s3Record = parsed.Records?.[0]?.s3;

        if (s3Record) {
          const dataToSend = {
            "bucket-name": s3Record.bucket.name,
            "object-key": s3Record.object.key,
            "object-size": s3Record.object.size,
          };

          await publishToVideoQueue(dataToSend);
          console.log("📤 Published to RabbitMQ:", dataToSend);

          // Delete message from SQS
          if (message.ReceiptHandle) {
            const deleteCommand = new DeleteMessageCommand({
              QueueUrl: envConfig.AWS_SQS_QUEUE_URL!,
              ReceiptHandle: message.ReceiptHandle,
            });
            await sqsClient.send(deleteCommand);
            console.log("✅ Deleted message from SQS");
          }
        }
      }
    } else {
      console.log("ℹ️ No messages in SQS at the moment.");
    }
  } catch (err) {
    console.error("❌ Error polling SQS:", err);
  }
};

//for safe polling
let isPolling = false;

const safePollSQS = async () => {
  if (isPolling) return;
  isPolling = true;
  try {
    await pollSQS();
  } finally {
    isPolling = false;
  }
};

// Server start logic
const startServer = async () => {
  try {
    await connectRabbitMQ();
    console.log("🐇 Connected to RabbitMQ");

    // Poll SQS every 10 seconds (adjust as needed)
    console.log("🚀 SQS polling started");
    setInterval(safePollSQS, 10000);
  } catch (err) {
    console.error("❌ Server initialization failed:", err);
    process.exit(1);
  }
};

startServer();
