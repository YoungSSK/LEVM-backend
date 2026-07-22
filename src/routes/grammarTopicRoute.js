import express from "express";
import {
  createGrammarTopic,
  getAllGrammarTopics,
  getGrammarTopicById,
  getGrammarTopicBySlug,
  updateGrammarTopic,
  deleteGrammarTopic,
  searchGrammarTopics,
  changeTopicOrder,
  changeTopicStatus,
  updateLessonCount,
  getActiveGrammarTopics,
  getGrammarTopicsWithProgress,
} from "../controllers/grammarTopicController.js";

import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";

import {
  grammarTopicIdParamsSchema,
  createGrammarTopicSchema,
  updateGrammarTopicSchema,
  changeTopicOrderSchema,
  changeTopicStatusSchema,
} from "../validations/grammarTopicValidation.js";

const router = express.Router();

// Lấy danh sách chủ đề ngữ pháp kèm tiến độ học tập (Private/User)
router.get("/progress", getGrammarTopicsWithProgress);

// Tìm kiếm chủ đề ngữ pháp
router.get("/search", searchGrammarTopics);

// Lấy danh sách chủ đề ngữ pháp đang hoạt động
router.get("/active", getActiveGrammarTopics);

// Lấy danh sách tất cả chủ đề ngữ pháp (phân trang, lọc, sắp xếp)
router.get("/", getAllGrammarTopics);

// Lấy chi tiết chủ đề theo Slug
// Đặt TRƯỚC /:id để tránh slug bị nhận dạng sai thành topic ID
router.get("/slug/:slug", getGrammarTopicBySlug);

// Lấy chi tiết chủ đề theo ID
router.get(
  "/:id",
  validate(grammarTopicIdParamsSchema, "params"),
  getGrammarTopicById,
);

// --- Admin Routes ---
router.use(authorMiddleware("admin"));

// Tạo chủ đề ngữ pháp mới
router.post("/", validate(createGrammarTopicSchema), createGrammarTopic);

// Cập nhật chủ đề ngữ pháp
router.patch(
  "/:id",
  validate(grammarTopicIdParamsSchema, "params"),
  validate(updateGrammarTopicSchema),
  updateGrammarTopic,
);

// Thay đổi thứ tự hiển thị
router.patch(
  "/:id/order",
  validate(grammarTopicIdParamsSchema, "params"),
  validate(changeTopicOrderSchema),
  changeTopicOrder,
);

// Thay đổi trạng thái hoạt động
router.patch(
  "/:id/status",
  validate(grammarTopicIdParamsSchema, "params"),
  validate(changeTopicStatusSchema),
  changeTopicStatus,
);

// Cập nhật số lượng bài học trực tiếp
router.patch(
  "/:id/lesson-count",
  validate(grammarTopicIdParamsSchema, "params"),
  updateLessonCount,
);

// Xóa chủ đề ngữ pháp
router.delete(
  "/:id",
  validate(grammarTopicIdParamsSchema, "params"),
  deleteGrammarTopic,
);

export default router;
