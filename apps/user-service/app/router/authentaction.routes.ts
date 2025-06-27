import express from "express";
import authentactionController from "../controllers/authentaction.controller";
import { s3ImageUploader,imageUpload } from "../middleware/multer.middleware";

const authRouter = express.Router();

authRouter.post("/register", imageUpload, s3ImageUploader, authentactionController.registerUser);
authRouter.post("/login",authentactionController.loginUser)
authRouter.post("/refresh-token", authentactionController.refreshToken);
authRouter.post("/logout", authentactionController.logoutUser);
authRouter.get("/me", authentactionController.checkMe);

export default authRouter;
