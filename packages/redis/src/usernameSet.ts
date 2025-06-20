import { redisClient } from "./client";

const USERNAME_SET_KEY = "usernames";

export const addUsername = async (username: string): Promise<void> => {
  await redisClient.sadd(USERNAME_SET_KEY, username);
};

export const usernameExists = async (username: string): Promise<boolean> => {
  const result = await redisClient.sismember(USERNAME_SET_KEY, username);
  return result === 1;
};
