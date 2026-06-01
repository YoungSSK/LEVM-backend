import express from "express";
import {
  fetchMe,
  updateProfile,
  changePassword,
} from "../controllers/userController.js";
import { validate } from "../middlewares/validateMiddleware.js";
import {
  updateUserSchema,
  changePasswordUserSchema,
} from "../validations/userValidation.js";

const router = express.Router();

router.get("/me", fetchMe);
router.patch("/me", validate(updateUserSchema), updateProfile);
router.patch(
  "/change-password",
  validate(changePasswordUserSchema),
  changePassword,
);
export default router;
