import express from "express";
import {
  createOccupationCategory,
  getAllOccupationCategory,
  updateOccupationCategory,
} from "../controllers/occupationCategoryController.js";
import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import {
  createOccupationCategorySchema,
  updateOccupationCategorySchema,
} from "../validations/occupationCategoryValidation.js";

const router = express.Router();

// API lấy danh sách
router.get("/", getAllOccupationCategory);

// API tạo mới
router.post(
  "/",
  authorMiddleware("Admin"),
  validate(createOccupationCategorySchema),
  createOccupationCategory,
);

// API cập nhật
router.patch(
  "/",
  authorMiddleware("Admin"),
  validate(updateOccupationCategorySchema),
  updateOccupationCategory,
);

export default router;
