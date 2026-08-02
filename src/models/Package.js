import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    // Tên gói hiển thị
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // URL-friendly slug (unique)
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Cấp độ gói (0 = Free, 1+ = VIP các cấp)
    // Dùng để hiển thị thứ tự trên UI — không dùng để check quyền (whitelist model)
    level: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Giá gói (VND). Free = 0
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Đơn vị tiền tệ
    currency: {
      type: String,
      default: "VND",
      trim: true,
    },

    // Thời hạn gói tính theo ngày (null = vĩnh viễn / gói Free)
    durationInDays: {
      type: Number,
      default: null,
      min: 1,
    },

    // Mô tả ngắn hiển thị trên trang nâng cấp gói
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // Danh sách tính năng/quyền lợi (hiển thị trên UI)
    features: {
      type: [String],
      default: [],
    },

    // Trạng thái hoạt động (false = ẩn khỏi user, dùng cho draft hoặc deprecated)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
packageSchema.index({ level: 1 });
packageSchema.index({ isActive: 1, level: 1 });

const Package = mongoose.model("Package", packageSchema);

export default Package;
