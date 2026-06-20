import express from "express";

import {
  updateMeaning,
  deleteMeaning,
  getMeaningById,
  changeMeaningStatus,
} from "../controllers/wordMeaningController.js";

import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";

import {
  wordMeaningIdParamsSchema,
  updateMeaningSchema,
  changeMeaningStatusSchema,
} from "../validations/wordMeaningValidation.js";

const router = express.Router();

// Read routes
router.get(
  "/:id",
  validate(wordMeaningIdParamsSchema, "params"),
  getMeaningById,
);

// Admin routes
router.patch(
  "/:id",
  authorMiddleware("admin"),
  validate(wordMeaningIdParamsSchema, "params"),
  validate(updateMeaningSchema),
  updateMeaning,
);

router.patch(
  "/:id/status",
  authorMiddleware("admin"),
  validate(wordMeaningIdParamsSchema, "params"),
  validate(changeMeaningStatusSchema),
  changeMeaningStatus,
);

router.delete(
  "/:id",
  authorMiddleware("admin"),
  validate(wordMeaningIdParamsSchema, "params"),
  deleteMeaning,
);

export default router;
