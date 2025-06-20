import { redisClient } from "./client";

const LOCK_PREFIX = "username:lock:";
const LOCK_TTL = 30; // seconds

export const reserveUsernameLock = async (
  username: string
): Promise<boolean> => {
  const result = await (redisClient as any).set(
    `${LOCK_PREFIX}${username}`,
    "locked",
    "NX",
    "EX",
    LOCK_TTL
  );
  return result === "OK";
};

export const releaseUsernameLock = async (username: string): Promise<void> => {
  await redisClient.del(`${LOCK_PREFIX}${username}`);
};

export const isUsernameLocked = async (username: string): Promise<boolean> => {
  const exists = await redisClient.exists(`${LOCK_PREFIX}${username}`);
  return exists === 1;
};
