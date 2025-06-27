import { Request, Response } from "express";
import { asyncHandler } from "../utils/async.handler";
import { registerSchema } from "../validation/registerschema.validation";
import { loginSchema } from "../validation/loginschema.validation";
import { sendError, sendSuccess } from "../utils/unified.response";
import { STATUS_CODES, hashPassword, validateAccessToken, comparePassword, generateAccessToken, generateRefreshToken, validateRefreshToken } from "@shared/utils";
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
    console.log(req.body)
    const validateRegisterRequest = registerSchema.safeParse(req.body);
    if (!validateRegisterRequest.success) {
      return sendError(
        res,
        "Data validation failed",
        validateRegisterRequest.error.errors,
        STATUS_CODES.BAD_REQUEST
      );
    }
    console.log(validateRegisterRequest.data)
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
    try {
      const hashedPassword = await hashPassword(user_password);

      const createdUser = await UserModel.create({
        user_first_name,
        user_last_name,
        user_email,
        user_password: hashedPassword,
        user_profile_picture: req.body.imageUrl,
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
      //  Always release the lock, no matter what
      await releaseUsernameLock(user_name);
    }
  });

  loginUser = asyncHandler(async (req: Request, res: Response) => {
    console.log(req.body)
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
    const tokenPayload: JwtPayload = {
      user_id: getUser._id.toString(),
      user_email: getUser.user_email,
      user_name: getUser.user_name
    }
    if (matchPassword) {
      const accessToken = generateAccessToken(tokenPayload, envConfig.JWT_SECRET)
      const refreshToken = generateRefreshToken(tokenPayload, envConfig.JWT_SECRET)

      res.cookie('refreshToken', refreshToken, { httpOnly: true })
      res.cookie('accessToken', accessToken, { httpOnly: true })

      const payloadUser: UserPayload = {
        user_email: getUser.user_email,
        user_id: getUser._id.toString(),
        user_name: getUser.user_name
      }
      const payloadData = {
        user_data: payloadUser,
        access_token: accessToken
      }
      return sendSuccess(res, 'Login successfull', payloadData, STATUS_CODES.ACCEPTED)
    } else {
      return sendError(res, 'Invalid password', null, STATUS_CODES.BAD_REQUEST)
    }
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      console.log('No refresh token')
      return sendError(res, "No refresh token", null, STATUS_CODES.UNAUTHORIZED);
    }
    const user = await validateRefreshToken(envConfig.JWT_SECRET, refreshToken);
    if (!user) {
      return sendError(res, "Invalid refresh token", null, STATUS_CODES.UNAUTHORIZED);
    }
    const newAccessToken = generateAccessToken(user, envConfig.JWT_SECRET);
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
    });
    return sendSuccess(res, "Token refreshed", { access_token: newAccessToken, user_data: user }, STATUS_CODES.OK);
  });

  logoutUser = asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie('accessToken', { httpOnly: true });
    res.clearCookie('refreshToken', { httpOnly: true });
    return sendSuccess(res, 'Logout successful', null, STATUS_CODES.OK);
  });

  checkMe = asyncHandler(async (req: Request, res: Response) => {
    // Get the access token from cookies
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return sendError(res, "Not authenticated", null, STATUS_CODES.UNAUTHORIZED);
    }

    // Validate the access token
    const userPayload = await validateAccessToken(envConfig.JWT_SECRET, accessToken);
    if (!userPayload) {
      return sendError(res, "Invalid or expired token", null, STATUS_CODES.UNAUTHORIZED);
    }

    // Optionally, fetch the user from the database for fresh info
    const user = await UserModel.findById(userPayload.user_id);
    if (!user) {
      return sendError(res, "User not found", null, STATUS_CODES.NOT_FOUND);
    }

    // Build the user_data object as expected by the frontend
    const user_data = {
      user_id: user._id.toString(),
      user_email: user.user_email,
      user_name: user.user_name,
      user_avatar: "" // or provide a default avatar
    };

    return sendSuccess(res, "User authenticated", { user_data }, STATUS_CODES.OK);
  });

}

const authentactionController = new AuthenticationController();

export default authentactionController;
