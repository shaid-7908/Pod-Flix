import env from "dotenv";

env.config();

const envConfig = {
  //Define all env variables here for ease of usage
  PORT: process.env.PORT as string,
  MONGODB_URL: process.env.MONGODB_URL as string,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_ACCESSTOKEN_TIME: process.env.JWT_ACCESSTOKEN_TIME as string,
  JWT_REFRESHTOKEN_TIME: process.env.JWT_REFRESHTOKEN_TIME as string,
  EMAIL_PASS: process.env.EMAIL_PASS as string,
  EMAIL_USER: process.env.EMAIL_USER as string,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  GOOGLE_REDIDERCT_URI: process.env.GOOGLE_REDIDERCT_URI as string,
  HOST_ENVIORMENT: process.env.HOST_ENVIORMENT as string,
};

export default envConfig;
