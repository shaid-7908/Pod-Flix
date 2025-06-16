import ffmpeg from "fluent-ffmpeg";
import path from "path";

export const getVideoDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
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
