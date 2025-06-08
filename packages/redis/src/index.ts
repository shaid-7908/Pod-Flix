import Redis from "ioredis";

const redis = new Redis({
  host: "localhost",
  port: 6379, // optional
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});
const USERNAME_SET_KEY = "usernames";
const LOCK_PREFIX = "username:lock:";
const LOCK_TTL = 30; // seconds

// Try to acquire a lock for the username
export const reserveUsernameLock = async (username: string): Promise<boolean> => {
  const result = await (redis as any).set(
    `${LOCK_PREFIX}${username}`,
    'locked',
    'NX',
    'EX',
    LOCK_TTL
  );
  return result === 'OK'; 
};

export const releaseUsernameLock = async (username: string): Promise<void> => {
  await redis.del(`${LOCK_PREFIX}${username}`);
};

export const isUsernameLocked = async (username: string): Promise<boolean> => {
  const exists = await redis.exists(`${LOCK_PREFIX}${username}`);
  return exists === 1;
};

export const addUsername = async (username: string) => {
  await redis.sadd(USERNAME_SET_KEY, username); // Adds only if not exists
};

export const usernameExists = async (username: string): Promise<boolean> => {
  const result = await redis.sismember(USERNAME_SET_KEY, username);
  return result === 1;
};

export const redisClient = redis;