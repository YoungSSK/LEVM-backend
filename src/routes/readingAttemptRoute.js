import express from "express";
import {
  startAttempt,
  submitAttempt,
  getAttemptById,
  getReviewData,
  getUserAttemptHistory,
  getAttemptsByPassage,
} from "../controllers/readingAttemptController.js";

import { validate } from "../middlewares/validateMiddleware.js";
import {
  attemptIdParamsSchema,
  passageIdParamsSchema,
  startAttemptSchema,
  submitAttemptSchema,
} from "../validations/readingAttemptValidation.js";

const router = express.Router();

// Tất cả reading attempt routes đều yêu cầu user đã auth (authMiddleware global)

// Lịch sử làm bài của user (paginate)
router.get("/history", getUserAttemptHistory);

// Lịch sử làm bài theo passage
router.get(
  "/passage/:passageId",
  validate(passageIdParamsSchema, "params"),
  getAttemptsByPassage,
);

// Lấy kết quả attempt (summary, không có đáp án đúng)
router.get(
  "/:attemptId",
  validate(attemptIdParamsSchema, "params"),
  getAttemptById,
);

// Lấy review (kèm đáp án đúng — chỉ khi attempt completed)
router.get(
  "/:attemptId/review",
  validate(attemptIdParamsSchema, "params"),
  getReviewData,
);

// Bắt đầu làm bài
router.post(
  "/start",
  validate(startAttemptSchema),
  startAttempt,
);

// Nộp bài
router.post(
  "/:attemptId/submit",
  validate(attemptIdParamsSchema, "params"),
  validate(submitAttemptSchema),
  submitAttempt,
);

export default router;
