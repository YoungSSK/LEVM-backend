import express from "express";

import {
  createVocabularyTopic,
  getAllVocabularyTopic,
  getVocabularyTopicById,
  updatedVocabularyTopic,
  deletedVocabularyTopic,
  changeStatus,
  getTopicStatistics,
} from "../controllers/vocabularyTopicController.js";
import {
  createVocabularyLesson,
  getVocabularyLessonByTopic,
  changeLessonOrder,
} from "../controllers/vocabularyLessonController.js";
import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";

import {
  topicIdParamsSchema,
  createTopicSchema,
  updateTopicSchema,
  changeStatusSchema,
} from "../validations/vocabularyTopicValidation.js";
import {
  topicIdParamsSchema as lessonTopicIdParamsSchema,
  createLessonSchema,
  changeOrderSchema,
} from "../validations/vocabularyLessonValidation.js";
const router = express.Router();

// Lấy danh sách chủ đề
router.get("/", getAllVocabularyTopic);

// Lấy chi tiết một chủ đề
router.get(
  "/:id",
  validate(topicIdParamsSchema, "params"),
  getVocabularyTopicById,
);
// Lấy danh sách lesson theo topic
router.get(
  "/:topicId/lessons",
  validate(lessonTopicIdParamsSchema, "params"),
  getVocabularyLessonByTopic,
);
// Tạo chủ đề mới
router.post(
  "/",
  authorMiddleware("admin"),
  validate(createTopicSchema),
  createVocabularyTopic,
);

// Cập nhật chủ đề
router.patch(
  "/:id",
  authorMiddleware("admin"),
  validate(topicIdParamsSchema, "params"),
  validate(updateTopicSchema),
  updatedVocabularyTopic,
);

// Thay đổi trạng thái (xóa mềm)
router.patch(
  "/:id/status",
  authorMiddleware("admin"),
  validate(topicIdParamsSchema, "params"),
  validate(changeStatusSchema),
  changeStatus,
);

// Xóa cứng
router.delete(
  "/:id",
  authorMiddleware("admin"),
  validate(topicIdParamsSchema, "params"),
  deletedVocabularyTopic,
);
// Lấy tổng trạng Lesson và wordCount active và inactive
router.get(
  "/:id/statistics",
  authorMiddleware("admin"),
  validate(topicIdParamsSchema, "params"),
  getTopicStatistics,
);
// Tạo lesson mới trong topic
router.post(
  "/:topicId/lessons",
  authorMiddleware("admin"),
  validate(lessonTopicIdParamsSchema, "params"),
  validate(createLessonSchema),
  createVocabularyLesson,
);

// Thay đổi thứ tự lesson
router.patch(
  "/:topicId/lessons/order",
  authorMiddleware("admin"),
  validate(lessonTopicIdParamsSchema, "params"),
  validate(changeOrderSchema),
  changeLessonOrder,
);
export default router;
