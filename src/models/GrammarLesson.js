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

    // ===== Gamification (Bước 1 refactor) =====
    // Số XP cộng cho user khi pass quiz lần đầu. Admin chỉnh được qua GrammarLessonFormDialog.
    xpReward: {
      type: Number,
      default: 10,
      min: 0,
    },

    // Ngưỡng % đúng tối thiểu để tính "đạt"; Admin chỉnh được. Mặc định 70.
    passThreshold: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },

    // Cờ cho FE biết lesson này đã có câu hỏi quiz hay chưa (>=1 câu active).
    // Tự động set true khi tạo câu hỏi đầu tiên; không cần FE nhập tay.
    hasQuiz: {
      type: Boolean,
      default: false,
    },

    // Audit cho autosave + khoá tránh ghi đè (Bước 2 sẽ dùng).
    contentUpdatedAt: {
      type: Date,
      default: null,
    },
    contentUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ===== DEPRECATED =====
    // @deprecated Kể từ refactor Grammar: 1 lesson = Theory + Quiz. Sẽ xoá ở release sau.
    // Logic quiz mới dùng model GrammarQuizQuestion (lessonId ref tới đây).
    // Field giữ lại để migration xử lý dữ liệu cũ & không vỡ các nơi đang đọc.
    lessonType: {
      type: String,
      enum: ["theory", "exercise"],
      default: "theory",
    },

    // @deprecated Trỏ tới GrammarLesson cha (khi lessonType='exercise' cũ). Giữ tạm để migration.
    parentLessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrammarLesson",
      default: null,
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

// Index cho slug đã được tạo tự động qua unique:true trong field definition
grammarLessonSchema.index({ topicId: 1, parentLessonId: 1, order: 1 });

const GrammarLesson = mongoose.model("GrammarLesson", grammarLessonSchema);

export default GrammarLesson;
