import express from "express";
import {
  createAttempt,
  getAttempt,
  submitAnswer,
  completeAttempt,
  getLessonAttempts,
  getLessonStats,
} from "../controllers/attemptController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { createAttemptSchema } from "../validations/attemptValidation.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate(createAttemptSchema), createAttempt);

router.get("/:attemptId", getAttempt);

router.patch("/:attemptId", submitAnswer);

router.post("/:attemptId/complete", completeAttempt);

router.get("/lesson/:lessonId", getLessonAttempts);

router.get("/lesson/:lessonId/stats", getLessonStats);

export default router;
