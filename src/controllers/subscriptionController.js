import * as subscriptionService from "../services/subscriptionService.js";

// ── User ──────────────────────────────────────────────────────────────────────

export const getMySubscription = async (req, res) => {
  try {
    const data = await subscriptionService.getMySubscription(req.user._id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const checkout = async (req, res) => {
  try {
    const { packageId } = req.body;
    if (!packageId) {
      return res.status(400).json({ success: false, message: "Thiếu packageId" });
    }

    const ipAddr =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip;

    const result = await subscriptionService.checkout(
      req.user._id,
      packageId,
      ipAddr,
    );

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// ── Webhook (PUBLIC — không qua authMiddleware) ────────────────────────────────

export const sepayWebhook = async (req, res) => {
  try {
    const payload = req.method === "POST" ? req.body : req.query;
    const result = await subscriptionService.handleSepayWebhook(
      payload,
      req.headers,
    );

    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error("[SePay Webhook] Lỗi:", error);
    return res
      .status(200)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};

export const vnpayWebhook = sepayWebhook;

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getAllSubscriptions = async (req, res) => {
  try {
    const { userId, status, page = 1, limit = 20 } = req.query;

    const Subscription = (await import("../models/Subscription.js")).default;
    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate("userId", "username email displayName")
        .populate("packageId", "name slug level")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: { subscriptions, total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
