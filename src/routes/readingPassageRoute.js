import express from "express";
import {
  getAllReadingPassages,
  getReadingPassageById,
  getReadingPassageBySlug,
  getPassagesByCategory,
  getPublishedPassages,
  createReadingPassage,
  previewDocument,
  createReadingPassageFromDocument,
  updateReadingPassageFromDocument,
  updateReadingPassage,
  updateReadingPassageContent,
  changePassageStatus,
  changePassageOrder,
  clonePassage,
  deleteReadingPassage,
} from "../controllers/readingPassageController.js";

import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import uploadReadingDocument from "../middlewares/uploadReadingDocument.js";
import {
  loadReadingPassage,
  loadReadingPassageBySlug,
  lessonAccessMiddleware,
} from "../middlewares/lessonAccessMiddleware.js";
import {
  readingPassageIdParamsSchema,
  readingPassageSlugParamsSchema,
  categoryIdParamsSchema,
  createReadingPassageSchema,
  updateReadingPassageSchema,
  updateReadingPassageContentSchema,
  changePassageStatusSchema,
  changePassageOrderSchema,
  createPassageFromDocumentSchema,
  updatePassageFromDocumentSchema,
} from "../validations/readingPassageValidation.js";

const router = express.Router();

// ===== Public / Mobile routes =====

// Lấy danh sách bài đọc đã xuất bản (Mobile App)
router.get("/published", getPublishedPassages);

// Lấy tất cả bài đọc (Admin có thể lọc thêm theo status)
router.get("/", getAllReadingPassages);

// Lấy bài đọc theo slug — đặt trước /:id
// Áp access guard (log-only mặc định)
router.get(
  "/slug/:slug",
  validate(readingPassageSlugParamsSchema, "params"),
  loadReadingPassageBySlug,   // load doc by slug
  lessonAccessMiddleware,     // kiểm tra gói thành viên
  getReadingPassageBySlug,
);

// Lấy bài đọc theo ID
// Áp access guard (log-only mặc định)
router.get(
  "/:id",
  validate(readingPassageIdParamsSchema, "params"),
  loadReadingPassage,         // load doc by ID
  lessonAccessMiddleware,     // kiểm tra gói thành viên
  getReadingPassageById,
);

// Lấy danh sách bài đọc theo danh mục
router.get(
  "/category/:categoryId",
  validate(categoryIdParamsSchema, "params"),
  getPassagesByCategory,
);

// ===== Admin routes =====
router.use(authorMiddleware("admin"));

// Preview DOCX — parse file, không lưu DB
router.post(
  "/preview-document",
  uploadReadingDocument.single("file"),
  previewDocument,
);

// Tạo bài đọc từ DOCX
router.post(
  "/from-document",
  uploadReadingDocument.single("file"),
  validate(createPassageFromDocumentSchema),
  createReadingPassageFromDocument,
);

// Tạo bài đọc từ JSON
router.post("/", validate(createReadingPassageSchema), createReadingPassage);

// Cập nhật metadata bài đọc
router.patch(
  "/:id",
  validate(readingPassageIdParamsSchema, "params"),
  validate(updateReadingPassageSchema),
  updateReadingPassage,
);

// Autosave nội dung HTML (PUT — tần suất cao, tách khỏi PATCH metadata)
router.put(
  "/:id/content",
  validate(readingPassageIdParamsSchema, "params"),
  validate(updateReadingPassageContentSchema),
  updateReadingPassageContent,
);

// Upload DOCX để cập nhật nội dung bài đọc đã tồn tại
router.post(
  "/:id/from-document",
  validate(readingPassageIdParamsSchema, "params"),
  uploadReadingDocument.single("file"),
  validate(updatePassageFromDocumentSchema),
  updateReadingPassageFromDocument,
);

// Thay đổi status: draft / published / archived
router.patch(
  "/:id/status",
  validate(readingPassageIdParamsSchema, "params"),
  validate(changePassageStatusSchema),
  changePassageStatus,
);

// Thay đổi thứ tự
router.patch(
  "/:id/order",
  validate(readingPassageIdParamsSchema, "params"),
  validate(changePassageOrderSchema),
  changePassageOrder,
);

// Clone bài đọc
router.post(
  "/:id/clone",
  validate(readingPassageIdParamsSchema, "params"),
  clonePassage,
);

// Xóa bài đọc
router.delete(
  "/:id",
  validate(readingPassageIdParamsSchema, "params"),
  deleteReadingPassage,
);

export default router;
