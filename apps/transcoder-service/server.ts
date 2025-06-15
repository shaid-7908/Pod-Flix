
import { connectRabbitMQ, consumeVideoQueue } from "@shared/rabbitmq";
import { connectDB } from "@shared/database";
import envConfig from "./src/config/env.config";
import { handleIncomingVideo } from "./src/consumer/consumer";
 

const start = async () => {
  try {
    await connectDB(envConfig.MONGODB_URL, envConfig.MONGODB_DB_NAME);
    await connectRabbitMQ();
    await consumeVideoQueue(handleIncomingVideo);

    console.log("🎬 Transcoder Service is live...");
  } catch (err) {
    console.error("❌ Failed to start:", err);
  }
};

start();
