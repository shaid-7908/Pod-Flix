import { redisClient } from "../client";

export const cacheVideoData = async (videoId: string, data: any) => {
  const key = `video:data:${videoId}`;
  const ttlInSeconds = 60 * 60 * 24; // 86400 seconds = 1 day

  await redisClient.set(key, JSON.stringify(data), "EX", ttlInSeconds);
};


export const getCachedVideoData = async (
  videoId: string
): Promise<any | null> => {
  const key = `video:data:${videoId}`;
  const cached = await redisClient.get(key);
  return cached ? JSON.parse(cached) : null;
};


export const invalidateVideoCache = async (videoId: string) => {
  const key = `video:data:${videoId}`;
  await redisClient.del(key);
};
  