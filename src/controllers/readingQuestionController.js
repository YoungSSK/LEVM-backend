import * as readingQuestionService from "../services/readingQuestionService.js";
import * as readingQuestionSetService from "../services/readingQuestionSetService.js";

// ===== Question Set =====

export const getQuestionSetsByPassage = async (req, res) => {
  try {
    const sets = await readingQuestionSetService.getQuestionSetsByPassage(
      req.params.passageId,
    );
    return res.status(200).json({ success: true, data: sets });
  } catch (error) {
    console.error("Lỗi getQuestionSetsByPassage:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// ===== Questions =====

export const getQuestionsBySet = async (req, res) => {
  try {
    // Admin nhận đáp án đúng, mobile không nhận
    const isAdmin = req.user?.role === "admin";
    const questions = await readingQuestionService.getQuestionsBySet(
      req.params.setId,
      { includeAnswers: isAdmin },
    );
    return res.status(200).json({ success: true, data: questions });
  } catch (error) {
    console.error("Lỗi getQuestionsBySet:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getQuestionsForAdmin = async (req, res) => {
  try {
    const questions = await readingQuestionService.getQuestionsBySet(
      req.params.setId,
      { includeAnswers: true },
    );
    return res.status(200).json({ success: true, data: questions });
  } catch (error) {
    console.error("Lỗi getQuestionsForAdmin:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const question = await readingQuestionService.createQuestion(
      req.params.setId,
      req.validatedData || req.body,
    );
    return res.status(201).json({
      success: true,
      message: "Tạo câu hỏi thành công",
      data: question,
    });
  } catch (error) {
    console.error("Lỗi createQuestion:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const question = await readingQuestionService.updateQuestion(
      req.params.id,
      req.validatedData || req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật câu hỏi thành công",
      data: question,
    });
  } catch (error) {
    console.error("Lỗi updateQuestion:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    await readingQuestionService.deleteQuestion(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Xóa câu hỏi thành công",
    });
  } catch (error) {
    console.error("Lỗi deleteQuestion:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const reorderQuestions = async (req, res) => {
  try {
    const result = await readingQuestionService.reorderQuestions(
      req.params.setId,
      (req.validatedData || req.body).orders,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật thứ tự câu hỏi thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi reorderQuestions:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// ===== CSV =====

export const previewCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload file CSV",
      });
    }
    const result = await readingQuestionService.previewQuestionsFromCsv(
      req.file.buffer,
    );
    return res.status(200).json({
      success: true,
      message: `Preview ${result.total} dòng: ${result.validCount} hợp lệ, ${result.errorCount} lỗi`,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi previewCsv:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const importCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload file CSV",
      });
    }
    const result = await readingQuestionService.importQuestionsFromCsv(
      req.params.setId,
      req.file.buffer,
    );
    return res.status(200).json({
      success: true,
      message: `Import hoàn tất: ${result.inserted} câu hỏi được thêm, ${result.failed} thất bại`,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi importCsv:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const exportCsv = async (req, res) => {
  try {
    const buffer = await readingQuestionService.exportQuestionsToCsv(
      req.params.setId,
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reading-questions-set-${req.params.setId}.csv"`,
    );
    return res.send(buffer);
  } catch (error) {
    console.error("Lỗi exportCsv:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const downloadCsvTemplate = async (req, res) => {
  try {
    const buffer = readingQuestionService.getCsvTemplate();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reading-questions-template.csv"`,
    );
    return res.send(buffer);
  } catch (error) {
    console.error("Lỗi downloadCsvTemplate:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
