import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import envConfig from "../config/env.config";

const s3 = new S3Client({
  region: envConfig.AWS_REGION,
  credentials: {
    accessKeyId: envConfig.AWS_ACCESS_KEY,
    secretAccessKey: envConfig.AWS_SECRET_KEY,
  },
});

export const downloadFromS3 = async (videoKey: string): Promise<string> => {
  const fileName = path.basename(videoKey);
  const outputPath = path.join(__dirname, "..", "..", "tmp", fileName);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const command = new GetObjectCommand({
    Bucket: envConfig.AWS_S3_DOWNLOAD_BUCKET_NAME,
    Key: videoKey,
  });

  const response = await s3.send(command);

  if (!(response.Body instanceof Readable)) {
    throw new Error("Expected S3 Body to be a stream.");
  }

  const writeStream = fs.createWriteStream(outputPath);
  response.Body.pipe(writeStream);

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  return fileName;
};
