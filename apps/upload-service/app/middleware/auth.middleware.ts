import {
  validateAccessToken,
  STATUS_CODES,
} from "@shared/utils";
import { Request, Response, NextFunction } from "express";
import envConfig from "../config/env.config";
import { asyncHandler } from "../utils/async.handler";

// ... existing code ...
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
  const accessToken: string | undefined = req.cookies.accessToken;

  try {
    if (accessToken) {
      const user = await validateAccessToken(envConfig.JWT_SECRET, accessToken);
      if (user) {
        req.user = user;
        return next();
      }
    }
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
