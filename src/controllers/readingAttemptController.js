import * as readingAttemptService from "../services/readingAttemptService.js";

export const startAttempt = async (req, res) => {
  try {
    const { passageId, questionSetId } = req.validatedData || req.body;
    const result = await readingAttemptService.startAttempt(
      req.user._id,
      passageId,
      questionSetId,
    );
    return res.status(201).json({
      success: true,
      message: "Bắt đầu làm bài thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi startAttempt:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const result = await readingAttemptService.submitAttempt(
      req.params.attemptId,
      req.user._id,
      req.validatedData || req.body,
    );
    return res.status(200).json({
      success: true,
      message: result.isPassed ? "Chúc mừng! Bạn đã đạt yêu cầu." : "Nộp bài thành công. Hãy thử lại để đạt điểm cao hơn!",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi submitAttempt:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getAttemptById = async (req, res) => {
  try {
    const attempt = await readingAttemptService.getAttemptById(
      req.params.attemptId,
      req.user._id,
    );
    return res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    console.error("Lỗi getAttemptById:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getReviewData = async (req, res) => {
  try {
    const data = await readingAttemptService.getReviewData(
      req.params.attemptId,
      req.user._id,
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi getReviewData:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getUserAttemptHistory = async (req, res) => {
  try {
    const options = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sortBy: req.query.sortBy || "submittedAt",
      sortOrder: req.query.sortOrder || "desc",
    };
    const result = await readingAttemptService.getUserAttemptHistory(
      req.user._id,
      options,
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi getUserAttemptHistory:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getAttemptsByPassage = async (req, res) => {
  try {
    const options = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    };
    const result = await readingAttemptService.getAttemptsByPassage(
      req.user._id,
      req.params.passageId,
      options,
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi getAttemptsByPassage:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
