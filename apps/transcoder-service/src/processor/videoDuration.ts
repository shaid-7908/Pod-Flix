import ffmpeg from "fluent-ffmpeg";
import path from "path";

export const getVideoDuration = (filePath: string): Promise<number> => {
  const fullFilePath = path.join(__dirname,'..','..','tmp',filePath)
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(fullFilePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration;
      if (typeof duration === "number") {
        resolve(duration);
      } else {
        reject(new Error("Could not determine video duration"));
      }
    });
  });
};
