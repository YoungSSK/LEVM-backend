import express from "express";
import { validate } from "../middlewares/validateMiddleware.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  lessonIdParamsQuizSchema,
  submitQuizAttemptSchema,
} from "../validations/grammarQuizValidation.js";
import { submitQuizAttempt } from "../controllers/grammarQuizController.js";

const router = express.Router();

/**
 * Submit quiz — chỉ cần đăng nhập user (không phải admin).
 * Tách riêng khỏi grammarQuizRoute (admin only) để không bị admin guard.
 */
router.use(authMiddleware);

router.post(
  "/lessons/:lessonId/quiz/submit",
  validate(lessonIdParamsQuizSchema, "params"),
  validate(submitQuizAttemptSchema),
  submitQuizAttempt,
);

export default router;
