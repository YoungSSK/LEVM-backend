import * as attemptService from "../services/attemptService.js";

export const createAttempt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId, level } = req.validatedData || req.body;

    if (!lessonId || !level) {
      return res.status(400).json({
        success: false,
        message: "lessonId và level là bắt buộc",
      });
    }

    const attempt = await attemptService.createAttempt(userId, lessonId, level);
    return res.status(201).json({
      success: true,
      message: "Tạo attempt thành công",
      data: attempt,
    });
  } catch (error) {
    console.error("Error creating attempt:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getAttempt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { attemptId } = req.params;

    const attempt = await attemptService.getAttempt(attemptId, userId);
    return res.status(200).json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    console.error("Error getting attempt:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { attemptId } = req.params;
    const { wordId, userAnswer, isCorrect, timeSpent } = req.body;

    if (!wordId || userAnswer === undefined) {
      return res.status(400).json({
        success: false,
        message: "wordId và userAnswer là bắt buộc",
      });
    }

    const result = await attemptService.submitAnswer(
      attemptId,
      userId,
      wordId,
      userAnswer,
      isCorrect ?? false,
      timeSpent ?? 0
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const completeAttempt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { attemptId } = req.params;

    const result = await attemptService.completeAttempt(attemptId, userId);

    return res.status(200).json({
      success: true,
      message: "Hoàn thành attempt thành công",
      data: result,
    });
  } catch (error) {
    console.error("Error completing attempt:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getLessonAttempts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;

    const attempts = await attemptService.getLessonAttempts(userId, lessonId);
    return res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    console.error("Error getting lesson attempts:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getLessonStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;

    const stats = await attemptService.getLessonStats(userId, lessonId);
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting lesson stats:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
