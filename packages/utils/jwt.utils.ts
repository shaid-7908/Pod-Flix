import jwt from "jsonwebtoken";
import { JwtPayload } from "@shared/types";

export const generateAccessToken = (
  payload: JwtPayload,
  access_token_secret: string
) => {
  return jwt.sign(
    {
      user_name: payload.user_name,
      user_id: payload.user_id,
      user_email: payload.user_email,
    },
    access_token_secret,
    {
      expiresIn: "10m",
    }
  );
};

export const generateRefreshToken = (
  payload: JwtPayload,
  refresh_token_secret: string
) => {
  return jwt.sign(
    {
      user_name: payload.user_name,
      user_id: payload.user_id,
      user_email: payload.user_email,
    },
    refresh_token_secret,
    {
      expiresIn: "7d",
    }
  );
};

export const validateRefreshToken = (refresh_token_secret:string,actual_refresh_token:string) : false | JwtPayload =>{
    try {
      const decode = jwt.verify(actual_refresh_token,refresh_token_secret)
      return decode as JwtPayload
    } catch (error) {
      return false
    }
}

export const validateAccessToken = (access_token_secret:string,actual_access_token:string):false | JwtPayload =>{
    try {
      const decode = jwt.verify(actual_access_token,access_token_secret)
      return decode as JwtPayload
    } catch (error) {
      return false
    }
}