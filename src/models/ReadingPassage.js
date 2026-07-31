import mongoose from "mongoose";

const readingPassageSchema = new mongoose.Schema(
  {
    // ===== Relationship =====

    // Danh mục bài đọc
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingCategory",
      required: true,
      index: true,
    },

    // Admin tạo bài
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Admin sửa bài lần cuối
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ===== Core Content =====

    // Tiêu đề bài đọc
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    // URL thân thiện
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Mô tả ngắn hiển thị trên danh sách
    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    // Ảnh đại diện bài đọc
    thumbnail: {
      type: String,
      default: "",
    },

    // Nội dung HTML (từ DOCX hoặc editor)
    htmlContent: {
      type: String,
      required: true,
    },

    // Nội dung văn bản thuần dùng cho full-text search
    plainText: {
      type: String,
      default: "",
    },

    // ===== Classification =====

    // Độ khó
    difficulty: {
      type: String,
      enum: ["beginner", "elementary", "intermediate", "upper_intermediate", "advanced"],
      default: "intermediate",
    },

    // Cấp độ CEFR
    cefrLevel: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      default: "B1",
    },

    // Dạng văn bản
    readingType: {
      type: String,
      enum: [
        "academic",       // IELTS Academic
        "general",        // IELTS General Training
        "narrative",      // Tự sự
        "descriptive",    // Mô tả
        "expository",     // Giải thích / trình bày
        "argumentative",  // Lập luận
        "article",        // Bài báo / tạp chí
        "advertisement",  // Quảng cáo
        "notice",         // Thông báo
        "letter",         // Thư
        "report",         // Báo cáo
        "other",
      ],
      default: "article",
    },

    // Nhãn / từ khóa
    tags: {
      type: [String],
      default: [],
    },

    // ===== Metrics =====

    // Số từ trong bài đọc
    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Thời gian đọc ước tính (phút)
    estimatedTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Thứ tự hiển thị trong danh mục
    order: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ===== Status & Lifecycle =====
    // Dùng status enum thay vì isActive+isPublished:
    //   draft     → đang soạn thảo, chưa xuất bản
    //   published → đã xuất bản, user xem được
    //   archived  → đã lưu trữ (ẩn khỏi user, không xóa dữ liệu)
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    // Ngày giờ xuất bản (set khi status → published)
    publishedAt: {
      type: Date,
      default: null,
    },

    // ===== Gamification =====

    // XP cộng khi user pass bài đọc
    xpReward: {
      type: Number,
      default: 15,
      min: 0,
      max: 1000,
    },

    // Ngưỡng % đúng tối thiểu để tính "đạt"
    passThreshold: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },

    // ===== Content Audit =====

    // Timestamp autosave nội dung
    contentUpdatedAt: {
      type: Date,
      default: null,
    },

    // Admin sửa nội dung lần cuối
    contentUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ===== Flags =====

    // Cờ cho biết passage đã có câu hỏi hay chưa (>= 1 câu active)
    hasQuestions: {
      type: Boolean,
      default: false,
    },

    // Passage này được clone từ passage nào (audit trail)
    clonedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingPassage",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ===== Indexes =====

// Tăng tốc lấy danh sách passage theo category + thứ tự
readingPassageSchema.index({ categoryId: 1, order: 1 });

// Lọc passage theo category + status (dùng nhiều nhất)
readingPassageSchema.index({ categoryId: 1, status: 1 });

// Không cho trùng tên trong cùng category
readingPassageSchema.index({ categoryId: 1, title: 1 }, { unique: true });

// Lấy published passages theo ngày xuất bản mới nhất
readingPassageSchema.index({ status: 1, publishedAt: -1 });

// Lọc theo độ khó + cấp CEFR
readingPassageSchema.index({ difficulty: 1, cefrLevel: 1 });

// Tìm theo tags
readingPassageSchema.index({ tags: 1 });

// Full-text search trên title và nội dung
readingPassageSchema.index({ title: "text", plainText: "text" });

const ReadingPassage = mongoose.model("ReadingPassage", readingPassageSchema);

export default ReadingPassage;
