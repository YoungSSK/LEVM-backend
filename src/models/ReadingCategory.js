import mongoose from "mongoose";

const readingCategorySchema = new mongoose.Schema(
  {
    // Tên danh mục
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 200,
    },

    // URL thân thiện
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Mô tả danh mục
    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    // Ảnh đại diện danh mục
    thumbnail: {
      type: String,
      default: "",
    },

    // Màu sắc hiển thị (hex code, vd: "#3B82F6")
    color: {
      type: String,
      default: "",
      maxlength: 20,
    },

    // Thứ tự hiển thị
    order: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Số bài đọc trong danh mục (counter cache)
    passageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Trạng thái hoạt động
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
readingCategorySchema.index({ order: 1 });
// name và slug unique đã tạo auto index qua unique:true

const ReadingCategory = mongoose.model("ReadingCategory", readingCategorySchema);

export default ReadingCategory;
