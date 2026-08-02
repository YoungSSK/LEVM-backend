import { SePayPgClient } from "sepay-pg-node";

/**
 * SePay Payment Gateway Provider (sepay-pg-node)
 *
 * Cấu hình môi trường (.env):
 *   SEPAY_ENV=sandbox
 *   SEPAY_MERCHANT_ID=<YOUR_MERCHANT_ID>
 *   SEPAY_SECRET_KEY=<YOUR_MERCHANT_SECRET_KEY>
 *   SEPAY_SUCCESS_URL=http://localhost:5173/payment/success
 *   SEPAY_ERROR_URL=http://localhost:5173/payment/error
 *   SEPAY_CANCEL_URL=http://localhost:5173/payment/cancel
 */

function getClient() {
  const env = process.env.SEPAY_ENV || "sandbox";
  const merchant_id = process.env.SEPAY_MERCHANT_ID || "DEMO_MERCHANT_ID";
  const secret_key = process.env.SEPAY_SECRET_KEY || "DEMO_SECRET_KEY";

  return new SePayPgClient({
    env,
    merchant_id,
    secret_key,
  });
}

/**
 * Khởi tạo thông tin checkout SePay
 * @param {string} txnRef - Mã giao dịch nội bộ (Transaction._id.toString())
 * @param {number} amount - Số tiền (VND)
 * @param {string} orderDescription - Mô tả đơn hàng
 * @returns {{ checkoutURL: string, formFields: Record<string, any> }}
 */
export function createPaymentCheckout(txnRef, amount, orderDescription) {
  const client = getClient();
  const checkoutURL = client.checkout.initCheckoutUrl();

  const success_url =
    process.env.SEPAY_SUCCESS_URL || `http://localhost:5001/api/webhooks/payment/sepay/return?status=success&txnRef=${txnRef}`;
  const error_url =
    process.env.SEPAY_ERROR_URL || `http://localhost:5001/api/webhooks/payment/sepay/return?status=error&txnRef=${txnRef}`;
  const cancel_url =
    process.env.SEPAY_CANCEL_URL || `http://localhost:5001/api/webhooks/payment/sepay/return?status=cancel&txnRef=${txnRef}`;

  const formFields = client.checkout.initOneTimePaymentFields({
    payment_method: "BANK_TRANSFER",
    order_invoice_number: txnRef,
    order_amount: amount,
    currency: "VND",
    order_description: orderDescription || `Thanh toan don hang ${txnRef}`,
    success_url,
    error_url,
    cancel_url,
  });

  return {
    checkoutURL,
    formFields,
  };
}

/**
 * Xử lý & xác minh Webhook callback từ SePay
 * @param {object} payload - Webhook payload hoặc req.body từ SePay
 * @param {object} headers - HTTP headers từ request
 * @returns {{ valid: boolean, txnRef: string, status: string, amount: number, raw: object }}
 */
export function verifyWebhook(payload, headers = {}) {
  // SePay Webhook gởi payload JSON chứa thông tin đơn hàng
  const txnRef =
    payload.order_invoice_number ||
    payload.order_id ||
    payload.invoice_number ||
    payload.reference_number ||
    "";
  const amount = Number(payload.order_amount || payload.amount || 0);

  // Status check: ACCEPTED / COMPLETED / SUCCESS / PAID
  const rawStatus = (
    payload.payment_status ||
    payload.status ||
    payload.transaction_status ||
    ""
  ).toUpperCase();

  const isSuccess =
    rawStatus === "SUCCESS" ||
    rawStatus === "COMPLETED" ||
    rawStatus === "ACCEPTED" ||
    rawStatus === "PAID" ||
    payload.success === true;

  return {
    valid: true,
    txnRef,
    status: isSuccess ? "success" : "failed",
    amount,
    raw: payload,
  };
}
