import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import envConfig from "./config";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { consumeVideoQueue, connectRabbitMQ } from "@shared/rabbitmq";
import {UnprocessedVideoModel ,connectDB} from '@shared/database'

// ---------- S3 Client Setup ----------
const s3 = new S3Client({
  region: envConfig.AWS_REGION!,
  credentials: {
    accessKeyId: envConfig.AWS_ACCESS_KEY!,
    secretAccessKey: envConfig.AWS_SECRET_KEY!,
  },
});

// ---------- Download Video from S3 ----------
const downloadFromS3 = async (videoKey: string): Promise<string> => {
  const fileName = path.basename(videoKey);
  const outputPath = path.join(__dirname, "tmp", fileName);

  // Ensure the /tmp directory exists
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });

  const command = new GetObjectCommand({
    Bucket: envConfig.AWS_S3_DOWNLOAD_BUCKET_NAME,
    Key: videoKey,
  });

  const response = await s3.send(command);

  if (!(response.Body instanceof Readable)) {
    throw new Error("Expected S3 response Body to be a Readable stream.");
  }

  const stream = fs.createWriteStream(outputPath);
  response.Body.pipe(stream);

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  console.log("[✅] Download complete:", outputPath);
  return outputPath;
};

// ---------- RabbitMQ Message Handler ----------
const handleConsumeVideo = async (msg: Record<string, any>) => {
  try {
    console.log("[📥] Received message:", msg);

    const videoKey = msg["object-key"];
    const bucket = msg["bucket-name"];

    if (!videoKey || !bucket) {
      console.warn("[⚠️] Missing 'object-key' or 'bucket-name' in message");
      return;
    }
    const dbVideoUrl = ``;
    const videoData = await UnprocessedVideoModel.findOne({org_video_url:dbVideoUrl})

    console.log(videoData,'video data')
    await downloadFromS3(videoKey);
  } catch (error) {
    console.error("[❌] Error handling video message:", error);
  }
};

// ---------- Bootstrap ----------
const startConsumer = async () => {
  try {
    await connectDB(envConfig.MONGODB_URL,envConfig.MONGODB_DB_NAME)
    await connectRabbitMQ();
    await consumeVideoQueue(handleConsumeVideo);
    console.log("[🚀] Video consumer is running...");
  } catch (error) {
    console.error("[❌] Failed to start video consumer:", error);
  }
};

startConsumer();

