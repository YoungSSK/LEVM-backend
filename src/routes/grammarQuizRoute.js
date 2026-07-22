import express from "express";
import authorMiddleware from "../middlewares/authorMiddleware.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import uploadQuizCsv from "../middlewares/uploadQuizCsv.js";

import {
  lessonIdParamsQuizSchema,
  questionIdParamsSchema,
  createGrammarQuizQuestionSchema,
  updateGrammarQuizQuestionSchema,
  reorderQuizSchema,
  submitQuizSchema,
} from "../validations/grammarQuizValidation.js";

import {
  listQuizQuestions,
  getQuizQuestionsForPlay,
  submitGrammarQuiz,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  reorderQuizQuestions,
  importQuizCsv,
  downloadCsvTemplate,
} from "../controllers/grammarQuizController.js";

const router = express.Router();

/**
 * Route cho user thường (không phải admin) - đặt TRƯỚC admin middleware.
 * Lưu ý: phải đặt TRƯỚC router.use(authorMiddleware) để không bị admin guard chặn.
 */

// Lấy câu hỏi quiz để user làm bài (KHÔNG kèm isCorrect và explanation)
router.get(
  "/lessons/:lessonId/quiz-play",
  authMiddleware,
  validate(lessonIdParamsQuizSchema, "params"),
  getQuizQuestionsForPlay,
);

// Nộp bài quiz (user thường)
router.post(
  "/lessons/:lessonId/quiz/submit",
  authMiddleware,
  validate(lessonIdParamsQuizSchema, "params"),
  validate(submitQuizSchema),
  submitGrammarQuiz,
);

/**
 * Tất cả route admin (CRUD + CSV import) - đặt SAU admin middleware.
 */
router.use(authorMiddleware("admin"));

// Tải file mẫu CSV
router.get("/quiz/csv-template", downloadCsvTemplate);

// Lấy / tạo danh sách câu hỏi theo lesson (admin)
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
