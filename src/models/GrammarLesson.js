import mongoose from "mongoose";

const grammarLessonSchema = new mongoose.Schema(
  {
    // Chủ đề ngữ pháp
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrammarTopic",
      required: true,
      index: true,
    },

    // Tiêu đề bài học
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

    // Mô tả ngắn hiển thị danh sách bài học
    shortDescription: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    // Nội dung HTML sau khi convert từ DOCX
    htmlContent: {
      type: String,
      required: true,
    },

    // Nội dung text thuần để tìm kiếm
    plainTextContent: {
      type: String,
      default: "",
    },

    // Ảnh đại diện bài học
    thumbnailUrl: {
      type: String,
      default: "",
    },

    // Thời gian học dự kiến (phút)
    estimatedTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Thứ tự bài học trong topic
    order: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Đã xuất bản cho user xem chưa
    isPublished: {
      type: Boolean,
      default: true,
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

// Không cho phép trùng tên bài học trong cùng một topic
grammarLessonSchema.index(
  {
    topicId: 1,
    title: 1,
  },
  {
    unique: true,
  },
);

// Tăng tốc lấy danh sách bài học theo topic
grammarLessonSchema.index({
  topicId: 1,
  order: 1,
});

// Tăng tốc tìm kiếm theo slug
grammarLessonSchema.index(
  {
    slug: 1,
  },
  {
    unique: true,
  },
);

const GrammarLesson = mongoose.model("GrammarLesson", grammarLessonSchema);

export default GrammarLesson;
