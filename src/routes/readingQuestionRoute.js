import express from "express";
import {
  getQuestionsByPassage,
  getQuestionSetsByPassage,
  getQuestionsBySet,
  getQuestionsForAdmin,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  previewCsv,
  importCsv,
  exportCsv,
  downloadCsvTemplate,
} from "../controllers/readingQuestionController.js";

import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import uploadQuizCsv from "../middlewares/uploadQuizCsv.js";
import {
  questionSetIdParamsSchema,
  questionIdParamsSchema,
  createReadingQuestionSchema,
  updateReadingQuestionSchema,
  reorderQuestionsSchema,
} from "../validations/readingQuestionValidation.js";

const router = express.Router();

// ===== Public / Mobile routes =====

// Download CSV template (admin tool, nhưng không cần admin auth)
router.get("/template", downloadCsvTemplate);

// [MOBILE] Lấy tất cả câu hỏi của một passage (không có correctAnswer)
router.get("/passage/:passageId", getQuestionsByPassage);

// Lấy câu hỏi theo question set (Mobile — không có đáp án)
router.get(
  "/set/:setId",
  validate(questionSetIdParamsSchema, "params"),
  getQuestionsBySet,
);

// Lấy tất cả question sets của một passage
router.get(
  "/passage/:passageId/sets",
  getQuestionSetsByPassage,
);

// ===== Admin routes =====
router.use(authorMiddleware("admin"));

// Lấy câu hỏi kèm đáp án đúng (Admin)
router.get(
  "/set/:setId/admin",
  validate(questionSetIdParamsSchema, "params"),
  getQuestionsForAdmin,
);

// Preview CSV (parse + validate, không lưu DB)
router.post(
  "/set/:setId/preview-csv",
  validate(questionSetIdParamsSchema, "params"),
  uploadQuizCsv.single("file"),
  previewCsv,
);

// Import CSV vào DB
router.post(
  "/set/:setId/import-csv",
  validate(questionSetIdParamsSchema, "params"),
  uploadQuizCsv.single("file"),
  importCsv,
);

// Export câu hỏi ra CSV
router.get(
  "/set/:setId/export-csv",
  validate(questionSetIdParamsSchema, "params"),
  exportCsv,
);

// Tạo câu hỏi mới
router.post(
  "/set/:setId",
  validate(questionSetIdParamsSchema, "params"),
  validate(createReadingQuestionSchema),
  createQuestion,
);

// Reorder câu hỏi
router.patch(
  "/set/:setId/reorder",
  validate(questionSetIdParamsSchema, "params"),
  validate(reorderQuestionsSchema),
  reorderQuestions,
);

// Cập nhật câu hỏi
router.patch(
  "/:id",
  validate(questionIdParamsSchema, "params"),
  validate(updateReadingQuestionSchema),
  updateQuestion,
);

// Xóa câu hỏi
router.delete(
  "/:id",
  validate(questionIdParamsSchema, "params"),
  deleteQuestion,
);

export default router;
