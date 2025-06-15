import {
  generateAccessToken,
  validateAccessToken,
  validateRefreshToken,
  STATUS_CODES,
} from "@shared/utils";
import { Request, Response, NextFunction } from "express";
import envConfig from "../config/env.config";
import { asyncHandler } from "../utils/async.handler";

declare global {
  namespace Express {
    interface Request {
      user?: any; // Replace with your UserPayload type
    }
  }
}

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("am here");
  const accessToken: string | undefined = req.cookies.accessToken;
  const refreshToken: string | undefined = req.cookies.refreshToken;

  try {
    if (accessToken) {
      const user = await validateAccessToken(envConfig.JWT_SECRET, accessToken);
      if (user) {
        req.user = user;
        return next();
      }
    }

    // Access token missing or invalid, fallback to refresh token
    if (refreshToken) {
      const user = await validateRefreshToken(
        envConfig.JWT_SECRET,
        refreshToken
      );
      if (user) {
        const newAccessToken = generateAccessToken(user, envConfig.JWT_SECRET);

        // Set new access token in HTTP-only cookie
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
        });

        req.user = user;
        return next();
      }
    }

    // Both tokens failed
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  } catch (error) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default asyncHandler(authMiddleware);
