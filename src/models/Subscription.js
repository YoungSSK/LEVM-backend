import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    // User sở hữu subscription này
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Gói thành viên
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },

    // Trạng thái subscription
    // pending_payment: đã tạo đơn, chờ thanh toán
    // active: đang còn hiệu lực
    // expired: đã hết hạn (cron chuyển)
    // cancelled: bị huỷ (admin/user thực hiện)
    status: {
      type: String,
      enum: ["pending_payment", "active", "expired", "cancelled"],
      default: "pending_payment",
      required: true,
    },

    // Ngày bắt đầu hiệu lực (set khi webhook success)
    startAt: {
      type: Date,
      default: null,
    },

    // Ngày hết hạn (null = vĩnh viễn / gói Free)
    endAt: {
      type: Date,
      default: null,
    },

    // Tự động gia hạn (chưa implement — placeholder cho tích hợp sau)
    autoRenew: {
      type: Boolean,
      default: false,
    },

    // Tham chiếu giao dịch thanh toán
    paymentTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },

    // Ghi chú (admin ghi tay, hoặc hệ thống ghi lý do cancel)
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
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userId: 1, createdAt: -1 });
subscriptionSchema.index({ status: 1, endAt: 1 }); // cho cron query expire

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
