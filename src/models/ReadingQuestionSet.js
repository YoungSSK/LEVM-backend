import mongoose from "mongoose";

const readingQuestionSetSchema = new mongoose.Schema(
  {
    // Bài đọc chứa question set này
    passageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingPassage",
      required: true,
      index: true,
    },

    // Tên bộ câu hỏi
    title: {
      type: String,
      default: "Default Question Set",
      trim: true,
      maxlength: 200,
    },

    // Loại bộ câu hỏi
    setType: {
      type: String,
      enum: ["practice", "quiz", "mini_test", "exam"],
      default: "practice",
    },

    // Mô tả bộ câu hỏi (tuỳ chọn)
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // Thứ tự hiển thị
    order: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Số câu hỏi (counter cache)
    questionCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Trạng thái hoạt động
    isActive: {
      type: Boolean,
      default: true,
    },

    // XP override (null = dùng passage.xpReward)
    xpReward: {
      type: Number,
      default: null,
      min: 0,
    },

    // Pass threshold override (null = dùng passage.passThreshold)
    passThreshold: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    // Giới hạn thời gian làm bài (giây, null = không giới hạn)
    timeLimit: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Tăng tốc lấy question sets theo passage + thứ tự
readingQuestionSetSchema.index({ passageId: 1, order: 1 });

const ReadingQuestionSet = mongoose.model("ReadingQuestionSet", readingQuestionSetSchema);

export default ReadingQuestionSet;
