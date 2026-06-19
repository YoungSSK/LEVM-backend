import express from "express";

import {
  getVocabularyLessonById,
  updateVocabularyLesson,
  deleteVocabularyLesson,
  changeLessonStatus,
  getLessonWords,
  addWordToLesson,
  removeWordFromLesson,
  getWordsForStudy,
} from "../controllers/vocabularyLessonController.js";

import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";

import {
  lessonIdParamsSchema,
  lessonWordParamsSchema,
  lessonWordDeleteParamsSchema,
  updateLessonSchema,
  addWordSchema,
} from "../validations/vocabularyLessonValidation.js";

const router = express.Router();

//public route
// Chi tiết bài học
router.get(
  "/:id",
  validate(lessonIdParamsSchema, "params"),
  getVocabularyLessonById,
);

// Danh sách từ trong bài học
router.get(
  "/:lessonId/words",
  validate(lessonWordParamsSchema, "params"),
  getLessonWords,
);
//Lấy danh từ trong lesson theo format study
router.get(
  "/:lessonId/study-words",
  validate(lessonWordParamsSchema, "params"),
  getWordsForStudy,
);
//Admin route

// Cập nhật bài học
router.patch(
  "/:id",
  authorMiddleware("admin"),
  validate(lessonIdParamsSchema, "params"),
  validate(updateLessonSchema),
  updateVocabularyLesson,
);

// Thay đổi trạng thái
router.patch(
  "/:id/status",
  authorMiddleware("admin"),
  validate(lessonIdParamsSchema, "params"),
  changeLessonStatus,
);

// Xóa bài học
router.delete(
  "/:id",
  authorMiddleware("admin"),
  validate(lessonIdParamsSchema, "params"),
  deleteVocabularyLesson,
);

// Thêm từ vào bài học
router.post(
  "/:lessonId/words",
  authorMiddleware("admin"),
  validate(lessonWordParamsSchema, "params"),
  validate(addWordSchema),
  addWordToLesson,
);

// Xóa từ khỏi bài học
router.delete(
  "/:lessonId/words/:wordId",
  authorMiddleware("admin"),
  validate(lessonWordDeleteParamsSchema, "params"),
  removeWordFromLesson,
);

export default router;
