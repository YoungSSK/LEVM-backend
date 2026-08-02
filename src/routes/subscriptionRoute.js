import express from "express";
import {
  getMySubscription,
  checkout,
  getAllSubscriptions,
  sepayWebhook,
  vnpayWebhook,
} from "../controllers/subscriptionController.js";
import authorMiddleware from "../middlewares/authorMiddleware.js";

const router = express.Router();

// ── User routes (cần auth — đã có authMiddleware global) ─────────────────────
router.get("/me", getMySubscription);
router.post("/checkout", checkout);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get("/admin/all", authorMiddleware("admin"), getAllSubscriptions);

export default router;

// ── Webhook route (export riêng — mount TRƯỚC authMiddleware trong server.js) ─
export const webhookRouter = express.Router();
webhookRouter.get("/sepay", sepayWebhook);
webhookRouter.post("/sepay", sepayWebhook);
webhookRouter.all("/sepay/return", sepayWebhook);

// Backward compatibility
webhookRouter.get("/vnpay", vnpayWebhook);
webhookRouter.post("/vnpay", vnpayWebhook);
