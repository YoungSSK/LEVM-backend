import * as streakService from "../services/streakService.js";

export const getStreak = async (req, res) => {
  try {
    const userId = req.user.id;
    const streakInfo = await streakService.getStreakInfo(userId);
    return res.status(200).json({
      success: true,
      data: streakInfo,
    });
  } catch (error) {
    console.error("Error getting streak:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getStreakCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const calendar = await streakService.getStreakCalendar(userId, Math.min(days, 90));
    return res.status(200).json({
      success: true,
      data: calendar,
    });
  } catch (error) {
    console.error("Error getting streak calendar:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const useStreakFreeze = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await streakService.useStreakFreeze(userId);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        freezeCount: result.freezeCount,
      },
    });
  } catch (error) {
    console.error("Error using streak freeze:", error);
    const statusCode = error.message.includes("not found")
      ? 404
      : error.message.includes("No streak freeze")
      ? 400
      : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
