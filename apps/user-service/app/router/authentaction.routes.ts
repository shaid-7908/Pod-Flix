import express from "express";
import authentactionController from "../controllers/authentaction.controller";

const authRouter = express.Router();

authRouter.post("/register", authentactionController.registerUser);
authRouter.post("/login",authentactionController.loginUser)
authRouter.post("/refresh-token", authentactionController.refreshToken);
authRouter.post("/logout", authentactionController.logoutUser);
authRouter.get("/me", authentactionController.checkMe);

export default authRouter;
