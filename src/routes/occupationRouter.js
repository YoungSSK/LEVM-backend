import express from "express";

import {
  createOccupation,
  updateOccupation,
  getOccupationsByCategory,
  getAllOccupations,
} from "../controllers/occupationController.js";

import {validate} from "../middlewares/validateMiddleware.js";

import {
  createOccupationSchema,
  updateOccupationSchema,
} from "../validations/occupationValidation.js";

import { authorMiddleware } from "../middlewares/authorMiddleware.js";

const router = express.Router();

// GET /api/occupations - Lấy tất cả occupations
router.get("/", getAllOccupations);

router.get("/category/:categoryId", getOccupationsByCategory);
router.post(
  "/",
  authorMiddleware("admin"),
  validate(createOccupationSchema),
  createOccupation,
);

router.patch(
  "/:id",
  authorMiddleware("admin"),
  validate(updateOccupationSchema),
  updateOccupation,
);

export default router;
