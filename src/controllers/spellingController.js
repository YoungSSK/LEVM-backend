import * as attemptService from "../services/attemptService.js";

export const verifySpelling = async (req, res) => {
  try {
    const { userAnswer, correctAnswer } = req.body;

    if (!userAnswer || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: "userAnswer và correctAnswer là bắt buộc",
      });
    }

    const result = await attemptService.verifySpelling(userAnswer, correctAnswer);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error verifying spelling:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
