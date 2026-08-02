import express from "express";
import {
  createGrammarLesson,
  updateGrammarLesson,
  updateGrammarLessonContent,
  updateGrammarLessonFromDocument,
  deleteGrammarLesson,
  getGrammarLessonById,
  getGrammarLessonBySlug,
  getAllGrammarLessons,
  getLessonsByTopic,
  searchGrammarLessons,
  changeLessonOrder,
  changePublishStatus,
  changeLessonStatus,
  getPublishedLessons,
  getActiveLessonsByTopic,
  getNextLesson,
  getPreviousLesson,
  createGrammarLessonFromDocument,
} from "../controllers/grammarLessonController.js";

import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import uploadGrammarDocument from "../middlewares/uploadGrammarDocument.js";
import {
  loadGrammarLesson,
  loadGrammarLessonBySlug,
  lessonAccessMiddleware,
} from "../middlewares/lessonAccessMiddleware.js";

import {
  grammarLessonIdParamsSchema,
  topicIdParamsSchema,
  createGrammarLessonSchema,
  updateGrammarLessonSchema,
  updateGrammarLessonContentSchema,
  changeLessonOrderSchema,
  changePublishStatusSchema,
  changeLessonStatusSchema,
  createGrammarLessonFromDocumentSchema,
  updateGrammarLessonFromDocumentSchema,
} from "../validations/grammarLessonValidation.js";

const router = express.Router();

// --- Public / Mobile Routes ---

// Lấy danh sách bài học đang được xuất bản (Mobile App)
router.get("/published", getPublishedLessons);

// Tìm kiếm bài học ngữ pháp
router.get("/search", searchGrammarLessons);

// Lấy danh sách bài học theo chủ đề
router.get(
  "/topic/:topicId",
  validate(topicIdParamsSchema, "params"),
  getLessonsByTopic,
);

// Lấy danh sách bài học đang hoạt động theo chủ đề (Mobile App)
router.get(
  "/topic/:topicId/active",
  validate(topicIdParamsSchema, "params"),
  getActiveLessonsByTopic,
);

// Lấy danh sách tất cả bài học ngữ pháp (phân trang, lọc, sắp xếp)
// Đặt TRƯỚC /:id để tránh slug "all" bị nhận dạng sai thành lesson ID
router.get("/", getAllGrammarLessons);

// Lấy chi tiết bài học ngữ pháp theo Slug
// Đặt TRƯỚC /:id để tránh slug bị nhận dạng sai thành lesson ID
// lessonAccessMiddleware: kiểm tra gói thành viên (log-only mặc định)
router.get("/slug/:slug",
  loadGrammarLessonBySlug,  // load doc by slug vào req.lessonDoc
  lessonAccessMiddleware,
  getGrammarLessonBySlug,
);

// Lấy chi tiết bài học ngữ pháp theo ID
router.get(
  "/:id",
  validate(grammarLessonIdParamsSchema, "params"),
  loadGrammarLesson,       // load doc vào req.lessonDoc
  lessonAccessMiddleware,  // kiểm tra gói thành viên
  getGrammarLessonById,
);

// Lấy bài học kế tiếp trong cùng chủ đề
router.get(
  "/:id/next",
  validate(grammarLessonIdParamsSchema, "params"),
  getNextLesson,
);

// Lấy bài học trước đó trong cùng chủ đề (Mobile App)
router.get(
  "/:id/previous",
  validate(grammarLessonIdParamsSchema, "params"),
  getPreviousLesson,
);

// --- Admin Routes ---
router.use(authorMiddleware("admin"));

// Tạo bài học ngữ pháp mới từ tài liệu Word (DOCX)
router.post(
  "/from-document",
  uploadGrammarDocument.single("file"),
  validate(createGrammarLessonFromDocumentSchema),
  createGrammarLessonFromDocument,
);

// Tạo bài học ngữ pháp mới
router.post("/", validate(createGrammarLessonSchema), createGrammarLesson);

// Cập nhật bài học ngữ pháp
router.patch(
  "/:id",
  validate(grammarLessonIdParamsSchema, "params"),
  validate(updateGrammarLessonSchema),
  updateGrammarLesson,
);

// Autosave nội dung lý thuyết (PUT riêng để tần suất cao, không xung đột validation metadata)
router.put(
  "/:id/content",
  validate(grammarLessonIdParamsSchema, "params"),
  validate(updateGrammarLessonContentSchema),
  updateGrammarLessonContent,
);

// Upload file DOCX để thay thế nội dung bài học đã tồn tại
router.post(
  "/:id/from-document",
  validate(grammarLessonIdParamsSchema, "params"),
  uploadGrammarDocument.single("file"),
  validate(updateGrammarLessonFromDocumentSchema),
  updateGrammarLessonFromDocument,
);

// Thay đổi thứ tự bài học
router.patch(
  "/:id/order",
  validate(grammarLessonIdParamsSchema, "params"),
  validate(changeLessonOrderSchema),
  changeLessonOrder,
);

// Cập nhật trạng thái xuất bản
router.patch(
  "/:id/publish-status",
  validate(grammarLessonIdParamsSchema, "params"),
  validate(changePublishStatusSchema),
  changePublishStatus,
);

// Cập nhật trạng thái hoạt động
router.patch(
  "/:id/status",
  validate(grammarLessonIdParamsSchema, "params"),
  validate(changeLessonStatusSchema),
  changeLessonStatus,
);

// Xóa bài học ngữ pháp
router.delete(
  "/:id",
  validate(grammarLessonIdParamsSchema, "params"),
  deleteGrammarLesson,
);

export default router;
