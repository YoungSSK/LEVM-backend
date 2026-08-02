/**
 * VNPay Payment Provider
 *
 * Tài liệu: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 *
 * Cấu hình môi trường (.env):
 *   VNPAY_TMN_CODE=<your_tmn_code>
 *   VNPAY_HASH_SECRET=<your_hash_secret>
 *   VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
 *   VNPAY_RETURN_URL=https://yourapp.com/api/webhooks/payment/vnpay
 */

import crypto from "crypto";
import querystring from "querystring";

const VNPAY_URL =
  process.env.VNPAY_URL ||
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const TMN_CODE = process.env.VNPAY_TMN_CODE || "";
const HASH_SECRET = process.env.VNPAY_HASH_SECRET || "";
const RETURN_URL =
  process.env.VNPAY_RETURN_URL || "http://localhost:5001/api/webhooks/payment/vnpay";

/**
 * Tạo URL thanh toán VNPay.
 * @param {string} txnRef - Mã tham chiếu giao dịch nội bộ (txn._id.toString())
 * @param {number} amount - Số tiền (VND, nguyên)
 * @param {string} orderInfo - Mô tả đơn hàng
 * @param {string} ipAddr - IP người dùng
 * @returns {string} URL redirect tới VNPay
 */
export function createPaymentUrl(txnRef, amount, orderInfo, ipAddr = "127.0.0.1") {
  const date = new Date();
  const createDate = formatDate(date);

  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: TMN_CODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100, // VNPay tính theo đơn vị x100
    vnp_ReturnUrl: RETURN_URL,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  // Sắp xếp key theo alphabet (yêu cầu của VNPay)
  const sortedParams = sortObject(params);
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", HASH_SECRET);
  const signature = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  sortedParams.vnp_SecureHash = signature;

  return `${VNPAY_URL}?${querystring.stringify(sortedParams, { encode: false })}`;
}

/**
 * Xác thực chữ ký callback từ VNPay.
 * @param {object} query - req.query từ GET callback
 * @returns {{ valid: boolean, txnRef: string, responseCode: string }}
 */
export function verifyCallback(query) {
  const secureHash = query.vnp_SecureHash;
  const params = { ...query };

  // Xoá các field không tham gia ký
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sortedParams = sortObject(params);
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", HASH_SECRET);
  const calculated = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return {
    valid: calculated === secureHash,
    txnRef: query.vnp_TxnRef || "",
    responseCode: query.vnp_ResponseCode || "",
    amount: parseInt(query.vnp_Amount || "0") / 100, // convert về VND
    providerTransactionId: query.vnp_TransactionNo || "",
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}` +
    `${pad(date.getMonth() + 1)}` +
    `${pad(date.getDate())}` +
    `${pad(date.getHours())}` +
    `${pad(date.getMinutes())}` +
    `${pad(date.getSeconds())}`
  );
}

function sortObject(obj) {
  return Object.fromEntries(
    Object.entries(obj)
      .sort(([a], [b]) => a.localeCompare(b))
  );
}
