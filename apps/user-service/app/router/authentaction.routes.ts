import express from "express";
import authentactionController from "../controllers/authentaction.controller";

const authRouter = express.Router();

authRouter.post("/register", authentactionController.registerUser);
authRouter.post("/login",authentactionController.loginUser)

export default authRouter;
