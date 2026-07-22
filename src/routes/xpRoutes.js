import express from "express";
import { getUserXP, getXPHistory, getXPSummary } from "../controllers/xpController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getUserXP);

router.get("/history", getXPHistory);

router.get("/summary", getXPSummary);

export default router;
