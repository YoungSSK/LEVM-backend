import mongoose from "mongoose";
import Package from "../models/Package.js";
import Subscription from "../models/Subscription.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import * as sepayProvider from "./paymentProviders/sepayProvider.js";
import * as vnpayProvider from "./paymentProviders/vnpayProvider.js";

// ── Query ─────────────────────────────────────────────────────────────────────

/**
 * Lấy subscription đang active của user, kèm thông tin gói.
 */
export const getMySubscription = async (userId) => {
  const subscription = await Subscription.findOne({
    userId,
    status: "active",
  })
    .populate("packageId", "name slug level price durationInDays features")
    .sort({ createdAt: -1 })
    .lean();

  const user = await User.findById(userId)
    .select("currentPackageId packageExpiresAt")
    .populate("currentPackageId", "name slug level")
    .lean();

  return {
    subscription,
    currentPackage: user?.currentPackageId ?? null,
    packageExpiresAt: user?.packageExpiresAt ?? null,
  };
};

// ── Checkout ──────────────────────────────────────────────────────────────────

/**
 * Tạo giao dịch pending và trả về thông tin thanh toán SePay.
 * - Nếu gói là Free (price=0), activate ngay không qua cổng.
 */
export const checkout = async (userId, packageId, ipAddr = "127.0.0.1") => {
  const pkg = await Package.findById(packageId);
  if (!pkg || !pkg.isActive) {
    throw new AppError("Gói thành viên không tồn tại hoặc không còn hoạt động", 404);
  }

  // Gói Free: activate ngay
  if (pkg.price === 0) {
    await activateSubscription(userId, pkg, null);
    return { redirectUrl: null, isFree: true };
  }

  // Tạo Transaction pending
  const transaction = await Transaction.create({
    userId,
    packageId: pkg._id,
    amount: pkg.price,
    currency: pkg.currency,
    provider: "sepay",
    status: "pending",
  });

  // Tạo SePay Checkout Data (checkoutURL + formFields)
  const orderInfo = `Thanh toan don hang ${transaction._id}`;
  const { checkoutURL, formFields } = sepayProvider.createPaymentCheckout(
    transaction._id.toString(),
    pkg.price,
    orderInfo,
  );

  return {
    redirectUrl: checkoutURL,
    checkoutURL,
    formFields,
    transactionId: transaction._id,
    isFree: false,
  };
};

// ── Webhook Handler ───────────────────────────────────────────────────────────

/**
 * Xử lý Webhook / Callback từ SePay Gateway. Idempotent — gọi lại nhiều lần vẫn an toàn.
 * @param {object} payload - req.body hoặc req.query từ SePay
 * @param {object} headers - req.headers
 * @returns {{ success: boolean, message: string }}
 */
export const handleSepayWebhook = async (payload, headers = {}) => {
  const { valid, txnRef, status, amount, raw } = sepayProvider.verifyWebhook(
    payload,
    headers,
  );

  if (!valid || !txnRef) {
    throw new AppError("Payload Webhook SePay không hợp lệ", 400);
  }

  // Tìm transaction theo ID
  if (!mongoose.Types.ObjectId.isValid(txnRef)) {
    throw new AppError("Mã giao dịch không hợp lệ", 400);
  }

  const transaction = await Transaction.findById(txnRef);
  if (!transaction) {
    throw new AppError("Không tìm thấy giao dịch", 404);
  }

  // Idempotency: nếu đã xử lý thành công rồi, trả về ngay
  if (transaction.status === "success") {
    return { success: true, message: "Giao dịch đã được xử lý trước đó" };
  }
  if (transaction.status === "failed") {
    return { success: false, message: "Giao dịch đã thất bại" };
  }

  // Cập nhật rawGatewayResponse
  transaction.rawGatewayResponse = raw;
  transaction.providerTransactionId = raw.reference_number || raw.id || "";

  if (status !== "success") {
    transaction.status = "failed";
    await transaction.save();
    return { success: false, message: "Thanh toán thất bại" };
  }

  // Thanh toán thành công
  transaction.status = "success";
  await transaction.save();

  // Kích hoạt subscription
  const pkg = await Package.findById(transaction.packageId);
  if (!pkg) throw new AppError("Không tìm thấy gói thành viên", 404);

  await activateSubscription(transaction.userId, pkg, transaction._id);

  return { success: true, message: "Thanh toán thành công, gói đã được kích hoạt" };
};

/** Alias tương thích cũ */
export const handleVnpayCallback = handleSepayWebhook;

// ── Cron: Expire subscriptions ────────────────────────────────────────────────

/**
 * Chạy hằng ngày: tìm các subscription hết hạn → expired, reset user về Free.
 * @returns {{ expiredCount: number }}
 */
export const expireSubscriptions = async () => {
  const now = new Date();

  // Tìm tất cả subscription active đã hết hạn
  const expiredSubs = await Subscription.find({
    status: "active",
    endAt: { $ne: null, $lt: now },
  }).lean();

  if (expiredSubs.length === 0) {
    console.log("[expireSubscriptions] Không có subscription nào hết hạn.");
    return { expiredCount: 0 };
  }

  // Tìm gói Free (giá bằng 0)
  const freePkg = await Package.findOne({
    $or: [{ price: 0 }, { slug: "free" }],
  }).lean();
  if (!freePkg) {
    console.error("[expireSubscriptions] ❌ Không tìm thấy gói Free! Kiểm tra migration 001.");
    return { expiredCount: 0 };
  }

  const expiredIds = expiredSubs.map((s) => s._id);
  const affectedUserIds = [...new Set(expiredSubs.map((s) => s.userId.toString()))];

  // Batch update: subscription → expired
  await Subscription.updateMany(
    { _id: { $in: expiredIds } },
    { $set: { status: "expired" } },
  );

  // Reset user về Free (chỉ những user KHÔNG còn active subscription khác)
  for (const userId of affectedUserIds) {
    const stillActive = await Subscription.exists({ userId, status: "active" });
    if (!stillActive) {
      await User.findByIdAndUpdate(userId, {
        $set: {
          currentPackageId: freePkg._id,
          packageExpiresAt: null,
        },
      });
    }
  }

  console.log(`[expireSubscriptions] ✓ Đã expire ${expiredSubs.length} subscription(s), reset ${affectedUserIds.length} user(s) về Free.`);
  return { expiredCount: expiredSubs.length };
};

// ── Internal Helpers ──────────────────────────────────────────────────────────

/**
 * Activate subscription cho user — dùng chung cho cả free và paid.
 * - Cancel subscription đang active (nếu có)
 * - Tạo subscription mới
 * - Cập nhật denormalized fields trên User
 */
async function activateSubscription(userId, pkg, transactionId) {
  const now = new Date();
  const endAt =
    pkg.durationInDays
      ? new Date(now.getTime() + pkg.durationInDays * 24 * 60 * 60 * 1000)
      : null;

  // Cancel subscription active cũ (nếu có)
  await Subscription.updateMany(
    { userId, status: "active" },
    { $set: { status: "cancelled", note: "Nâng cấp lên gói mới" } },
  );

  // Tạo subscription mới
  await Subscription.create({
    userId,
    packageId: pkg._id,
    status: "active",
    startAt: now,
    endAt,
    autoRenew: false,
    paymentTransactionId: transactionId,
  });

  // Cập nhật denorm trên User
  await User.findByIdAndUpdate(userId, {
    $set: {
      currentPackageId: pkg._id,
      packageExpiresAt: endAt,
    },
  });
}
