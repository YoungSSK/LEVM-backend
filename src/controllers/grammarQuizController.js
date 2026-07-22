import * as grammarQuizService from "../services/grammarQuizService.js";
import authorMiddleware from "../middlewares/authorMiddleware.js";

// GET /grammar-lessons/:lessonId/quiz (admin only — xem isCorrect)
export const listQuizQuestions = async (req, res) => {
  try {
    const data = await grammarQuizService.listQuizQuestionsByLesson(
      req.params.lessonId,
      { includeAnswers: true }, // route này đã được admin guard bên ngoài
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi listQuizQuestions:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// (Xem các export khác dưới đây — không thay đổi)

// POST /grammar-lessons/:lessonId/quiz
export const createQuizQuestion = async (req, res) => {
  try {
    const doc = await grammarQuizService.createQuizQuestion(
      req.params.lessonId,
      req.validatedData || req.body,
    );
    return res.status(201).json({
      success: true,
      message: "Tạo câu hỏi thành công",
      data: doc,
    });
  } catch (error) {
    console.error("Lỗi createQuizQuestion:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// PATCH /grammar-quiz/:questionId
export const updateQuizQuestion = async (req, res) => {
  try {
    const doc = await grammarQuizService.updateQuizQuestion(
      req.params.questionId,
      req.validatedData || req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật câu hỏi thành công",
      data: doc,
    });
  } catch (error) {
    console.error("Lỗi updateQuizQuestion:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// DELETE /grammar-quiz/:questionId
export const deleteQuizQuestion = async (req, res) => {
  try {
    const result = await grammarQuizService.deleteQuizQuestion(
      req.params.questionId,
    );
    return res.status(200).json({
      success: true,
      message: "Xoá câu hỏi thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi deleteQuizQuestion:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// PATCH /grammar-lessons/:lessonId/quiz/reorder
export const reorderQuizQuestions = async (req, res) => {
  try {
    const result = await grammarQuizService.reorderQuizQuestions(
      req.params.lessonId,
      req.validatedData.orders,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật thứ tự thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi reorderQuizQuestions:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// POST /grammar-lessons/:lessonId/quiz/import-csv  (multipart, field=file)
export const importQuizCsv = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "Thiếu file CSV (field name là 'file')",
      });
    }
    const result = await grammarQuizService.importQuizFromCsv(
      req.params.lessonId,
      req.file.buffer,
    );
    return res.status(200).json({
      success: true,
      message: `Đã import ${result.inserted} câu hỏi (lỗi ${result.failed}).`,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi importQuizCsv:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// GET /grammar-lessons/quiz/csv-template  (text/csv)
export const downloadCsvTemplate = async (req, res) => {
  try {
    const buf = grammarQuizService.getCsvTemplate();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="grammar-quiz-template.csv"',
    );
    return res.status(200).send(buf);
  } catch (error) {
    console.error("Lỗi downloadCsvTemplate:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

/**
 * User submit quiz — chỉ cần đăng nhập (không yêu cầu role admin).
 * Nằm ở router riêng (grammarQuizSubmitRoute) để tránh admin guard.
 */
export const submitQuizAttempt = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để nộp bài",
      });
    }
    const data = await grammarQuizService.submitQuizAttempt(
      req.user._id,
      req.params.lessonId,
      req.validatedData.answers,
    );
    return res.status(200).json({
      success: true,
      message: data.alreadyPassed
        ? "Bạn đã hoàn thành bài này trước đó, kết quả chỉ để tham khảo."
        : data.isPassed
        ? `Đạt! Bạn nhận ${data.xpEarned} XP.`
        : "Chưa đạt ngưỡng, thử lại nhé!",
      data,
    });
  } catch (error) {
    console.error("Lỗi submitQuizAttempt:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
