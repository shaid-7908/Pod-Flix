import { Request, Response } from "express";
import { asyncHandler } from "../utils/async.handler";
import { registerSchema } from "../validation/registerschema.validation";
import { loginSchema } from "../validation/loginschema.validation";
import { sendError, sendSuccess } from "../utils/unified.response";
import { STATUS_CODES, hashPassword, comparePassword ,generateAccessToken,generateRefreshToken } from "@shared/utils";
import {
  reserveUsernameLock,
  usernameExists,
  addUsername,
  releaseUsernameLock,
  isUsernameLocked,
} from "@shared/redis";
import { UserModel } from "@shared/database";
import { JwtPayload, UserPayload } from "@shared/types";
import envConfig from "../config/env.config";

class AuthenticationController {
  registerUser = asyncHandler(async (req: Request, res: Response) => {
    const validateRegisterRequest = registerSchema.safeParse(req.body);
    if (!validateRegisterRequest.success) {
      return sendError(
        res,
        "Data validation failed",
        validateRegisterRequest.error.errors,
        STATUS_CODES.BAD_GATEWAY
      );
    }
    const {
      user_email,
      user_first_name,
      user_last_name,
      user_name,
      user_password,
    } = validateRegisterRequest.data;
    const existingEmail = await UserModel.findOne({ user_email: user_email });
    if (existingEmail) {
      return sendError(
        res,
        "Email is already registered",
        null,
        STATUS_CODES.CONFLICT
      );
    }
    const usernameCheck = await usernameExists(user_name);
    if (usernameCheck) {
      return sendError(res, "Username is taken", null, STATUS_CODES.CONFLICT);
    }
    const checklockstatus = await isUsernameLocked(user_name);
    if (!checklockstatus) {
      return sendError(res, "Username is taken", null, STATUS_CODES.CONFLICT);
    }
    const lockusername = await reserveUsernameLock(user_name);
    if (!lockusername) {
      return sendError(
        res,
        "Try differnet User name",
        null,
        STATUS_CODES.CONFLICT
      );
    }
    try {
      const hashedPassword = await hashPassword(user_password);

      const createdUser = await UserModel.create({
        user_first_name,
        user_last_name,
        user_email,
        user_password: hashedPassword,
        user_name,
      });

      await addUsername(user_name); // Add to Redis set after creation

      const payload: UserPayload = {
        user_email: createdUser.user_email,
        user_id: createdUser._id.toString(),
        user_name: createdUser.user_name,
      };
      return sendSuccess(
        res,
        "User registered successfully",
        payload,
        STATUS_CODES.CREATED
      );
    } finally {
      // 🔓 Always release the lock, no matter what
      await releaseUsernameLock(user_name);
    }
  });

  loginUser = asyncHandler(async (req: Request, res: Response) => {
    const validateLoginRequest = loginSchema.safeParse(req.body);

    if (!validateLoginRequest.success) {
      return sendError(
        res,
        "Data validation failed",
        validateLoginRequest.error.errors,
        STATUS_CODES.BAD_REQUEST
      );
    }
    const { user_email, user_password } = validateLoginRequest.data;
    const getUser = await UserModel.findOne({ user_email: user_email });
    if (!getUser) {
      return sendError(res, "Email not found", null, STATUS_CODES.BAD_REQUEST);
    }
    const matchPassword = await comparePassword(
      user_password,
      getUser.user_password
    );
    const tokenPayload:JwtPayload ={
     user_id:getUser._id.toString(),
     user_email:getUser.user_email,
     user_name:getUser.user_name
    }
    if (matchPassword) {
      const accessToken = generateAccessToken(tokenPayload,envConfig.JWT_SECRET)
      const refreshToken = generateRefreshToken(tokenPayload,envConfig.JWT_SECRET)

      res.cookie('refreshToken',refreshToken,{httpOnly:true})
      res.cookie('accessToken',accessToken,{httpOnly:true})

      const payloadUser:UserPayload = {
           user_email:getUser.user_email,
           user_id:getUser._id.toString(),
           user_name:getUser.user_name
      }
      const payloadData ={
        user_data:payloadUser,
        access_token:accessToken
      }
      return sendSuccess(res,'Login successfull',payloadData,STATUS_CODES.ACCEPTED)
    }else{
      return sendError(res,'Invalid password',null,STATUS_CODES.BAD_REQUEST)
    }
  });
}

const authentactionController = new AuthenticationController();

export default authentactionController;
