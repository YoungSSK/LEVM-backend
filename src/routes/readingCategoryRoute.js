import express from "express";
import {
  createReadingCategory,
  updateReadingCategory,
  deleteReadingCategory,
  getReadingCategoryById,
  getReadingCategoryBySlug,
  getAllReadingCategories,
  toggleCategoryStatus,
} from "../controllers/readingCategoryController.js";

import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import {
  readingCategoryIdParamsSchema,
  readingCategorySlugParamsSchema,
  createReadingCategorySchema,
  updateReadingCategorySchema,
  toggleCategoryStatusSchema,
} from "../validations/readingCategoryValidation.js";

const router = express.Router();

// ===== Public routes =====

// Lấy tất cả danh mục (paginate + search + filter)
router.get("/", getAllReadingCategories);

// Lấy danh mục theo slug
router.get(
  "/slug/:slug",
  validate(readingCategorySlugParamsSchema, "params"),
  getReadingCategoryBySlug,
);

// Lấy danh mục theo ID
router.get(
  "/:id",
  validate(readingCategoryIdParamsSchema, "params"),
  getReadingCategoryById,
);

// ===== Admin routes =====
router.use(authorMiddleware("admin"));

// Tạo danh mục mới
router.post("/", validate(createReadingCategorySchema), createReadingCategory);

// Cập nhật thông tin danh mục
router.patch(
  "/:id",
  validate(readingCategoryIdParamsSchema, "params"),
  validate(updateReadingCategorySchema),
  updateReadingCategory,
);

// Toggle trạng thái hoạt động
router.patch(
  "/:id/status",
  validate(readingCategoryIdParamsSchema, "params"),
  validate(toggleCategoryStatusSchema),
  toggleCategoryStatus,
);

// Xóa danh mục
router.delete(
  "/:id",
  validate(readingCategoryIdParamsSchema, "params"),
  deleteReadingCategory,
);

export default router;
