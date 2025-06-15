import { downloadFromS3 } from "../utils/s3Downloader";
import { transcodeVideo } from "../processor/transcoder";
import { UnprocessedVideoModel } from "@shared/database";
import { uploadTranscodedFolder } from "../utils/uploadTranscodedFolder";
import path from 'path'
import { ProcessedVideoModel } from "@shared/database";
import {UnprocessedVideoDocument} from '@shared/types'





export const handleIncomingVideo = async (msg: Record<string, any>) => {
  const videoKey = msg["object-key"];
  const bucket = msg["bucket-name"];

  if (!videoKey || !bucket) {
    console.warn("[⚠️] Invalid message format.");
    return;
  }

  const dbVideoUrl = `https://${bucket}.s3.ap-south-1.amazonaws.com/${videoKey}`;
  const videoData = await UnprocessedVideoModel.findOne({
    org_video_url: dbVideoUrl,
  }) as any ;

  if (!videoData) {
    console.warn("[⚠️] No matching DB record found.");
    return;
  }

  try {
    const localFilePath = await downloadFromS3(videoKey);
    await transcodeVideo(localFilePath, videoData);

    const transcodedPath = path.join(
      __dirname,
      "..",
      "..",
      "transcoded",
    );

    const results = await uploadTranscodedFolder(
      transcodedPath,
      videoData._id.toString()
    );

    // Save to ProcessedVideoModel
    await ProcessedVideoModel.create({
      video_id: videoData._id,
      channel_id: videoData.channel_id,
      bucket,
      s3Key: videoKey,
      status: "DONE",
      resolutions: results,
      duration: videoData.duration || undefined, // optionally compute using ffprobe
    });

    // Optional: update status in UnprocessedVideoModel
    await UnprocessedVideoModel.updateOne(
      { _id: videoData._id },
      { $set: { status: "PRCD" } }
    );

    console.log(`✅ Video metadata saved to DB for video ID: ${videoData._id}`);
  } catch (err: any) {
    console.error("❌ Failed during processing:", err.message);

    await ProcessedVideoModel.create({
      video_id: videoData._id,
      channel_id: videoData.channel_id,
      bucket,
      s3Key: videoKey,
      status: "ERROR",
      errorMessage: err.message,
    });

    await UnprocessedVideoModel.updateOne(
      { _id: videoData._id },
      { $set: { status: "FLD" } }
    );
  }
};