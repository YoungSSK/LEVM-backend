import express from "express";
import { verifySpelling } from "../controllers/spellingController.js";

const router = express.Router();

router.post("/verify", verifySpelling);

export default router;
