import express from "express";

import {
  createVocabularyTopic,
  getAllVocabularyTopic,
  getVocabularyTopicById,
  updatedVocabularyTopic,
  deletedVocabularyTopic,
  changeStatus,
} from "../controllers/vocabularyTopicController.js";

import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";

import {
  topicIdParamsSchema,
  createTopicSchema,
  updateTopicSchema,
  changeStatusSchema,
} from "../validations/vocabularyTopicValidation.js";

const router = express.Router();

// Lấy danh sách chủ đề
router.get("/", getAllVocabularyTopic);

// Lấy chi tiết một chủ đề
router.get(
  "/:id",
  validate(topicIdParamsSchema, "params"),
  getVocabularyTopicById,
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

export default router;
