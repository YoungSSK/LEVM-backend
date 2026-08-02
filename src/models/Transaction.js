import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    // User thực hiện giao dịch
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Gói muốn mua
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },

    // Số tiền giao dịch (VND)
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Đơn vị tiền tệ
    currency: {
      type: String,
      default: "VND",
    },

    // Cổng thanh toán sử dụng
    provider: {
      type: String,
      enum: ["sepay", "vnpay", "momo", "manual", "free"],
      required: true,
    },

    // Mã giao dịch phía cổng thanh toán trả về (để đối soát)
    providerTransactionId: {
      type: String,
      default: "",
      trim: true,
    },

    // Trạng thái giao dịch
    // pending: đã tạo, chờ thanh toán
    // success: thanh toán thành công (webhook xác nhận)
    // failed: thanh toán thất bại
    // refunded: đã hoàn tiền
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
      required: true,
    },

    // Lưu nguyên payload từ cổng thanh toán để đối soát sau
    rawGatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Ghi chú thêm (admin, lý do refund, v.v.)
    note: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, provider: 1 });
transactionSchema.index({ providerTransactionId: 1 }); // đối soát nhanh theo mã GD cổng

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
