import * as xpService from "../services/xpService.js";

export const getUserXP = async (req, res) => {
  try {
    const userId = req.user.id;
    const xpInfo = await xpService.getUserXPInfo(userId);
    return res.status(200).json({
      success: true,
      data: xpInfo,
    });
  } catch (error) {
    console.error("Error getting user XP:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getXPHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const history = await xpService.getXPHistory(userId, limit, skip);
    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error getting XP history:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getXPSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await xpService.getXPSummary(userId);
    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error getting XP summary:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
