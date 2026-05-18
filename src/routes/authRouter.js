import express from "express";
import { Login, Logout, Register } from "../controllers/authController.js";
import { validate } from "../middlewares/validateMiddleware.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "../validations/userValidation.js";
const router = express.Router();
router.post("/register", validate(registerUserSchema), Register);
router.post("/login", validate(loginUserSchema), Login);
router.post("/logout", Logout);
export default router;
