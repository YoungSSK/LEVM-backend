import express from "express";
import {
  getStreak,
  getStreakCalendar,
  useStreakFreeze,
} from "../controllers/streakController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getStreak);

router.get("/calendar", getStreakCalendar);

router.post("/freeze", useStreakFreeze);

export default router;
