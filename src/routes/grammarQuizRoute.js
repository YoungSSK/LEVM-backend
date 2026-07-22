import express from "express";
import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import uploadQuizCsv from "../middlewares/uploadQuizCsv.js";

import {
  lessonIdParamsQuizSchema,
  questionIdParamsSchema,
  createGrammarQuizQuestionSchema,
  updateGrammarQuizQuestionSchema,
  reorderQuizSchema,
} from "../validations/grammarQuizValidation.js";

import {
  listQuizQuestions,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  reorderQuizQuestions,
  importQuizCsv,
  downloadCsvTemplate,
} from "../controllers/grammarQuizController.js";

const router = express.Router();

/**
 * Tất cả route admin (theo prompt 2.3 — CRUD + CSV import).
 * Nếu sau này cần cho user xem quiz, sẽ tách router riêng.
 *
 * Lưu ý: route /csv-template đặt TRƯỚC /:lessonId/quiz để không bị
 * Express match nhầm 'csv-template' làm :lessonId.
 */
router.use(authorMiddleware("admin"));

// Tải file mẫu CSV
router.get("/quiz/csv-template", downloadCsvTemplate);

// Lấy / tạo danh sách câu hỏi theo lesson
router.get(
  "/lessons/:lessonId/quiz",
  validate(lessonIdParamsQuizSchema, "params"),
  listQuizQuestions,
);

router.post(
  "/lessons/:lessonId/quiz",
  validate(lessonIdParamsQuizSchema, "params"),
  validate(createGrammarQuizQuestionSchema),
  createQuizQuestion,
);

// Đổi thứ tự câu hỏi (bulk)
router.patch(
  "/lessons/:lessonId/quiz/reorder",
  validate(lessonIdParamsQuizSchema, "params"),
  validate(reorderQuizSchema),
  reorderQuizQuestions,
);

// Import CSV (multipart, field=file)
router.post(
  "/lessons/:lessonId/quiz/import-csv",
  validate(lessonIdParamsQuizSchema, "params"),
  uploadQuizCsv.single("file"),
  importQuizCsv,
);

// Sửa / xoá câu hỏi đơn lẻ
router.patch(
  "/quiz/:questionId",
  validate(questionIdParamsSchema, "params"),
  validate(updateGrammarQuizQuestionSchema),
  updateQuizQuestion,
);

router.delete(
  "/quiz/:questionId",
  validate(questionIdParamsSchema, "params"),
  deleteQuizQuestion,
);

export default router;
