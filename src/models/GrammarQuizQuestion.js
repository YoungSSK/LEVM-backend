import mongoose from "mongoose";

const grammarQuizOptionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const grammarQuizQuestionSchema = new mongoose.Schema(
  {
    // Bài học ngữ pháp chứa câu hỏi này.
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrammarLesson",
      required: true,
      index: true,
    },

    // Đề bài (HTML hoặc text — FE/quizService tự quyết cách render).
    questionText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // 2–6 lựa chọn, validate ở schema để service không phải check lại.
    options: {
      type: [grammarQuizOptionSchema],
      validate: {
        validator: (arr) =>
          Array.isArray(arr) &&
          arr.length >= 2 &&
          arr.length <= 6 &&
          arr.filter((o) => o.isCorrect).length === 1,
        message:
          "options phải có 2-6 lựa chọn và đúng 1 đáp án isCorrect=true",
      },
    },

    // Giải thích hiển thị SAU khi user nộp bài (không leak trước).
    explanation: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    // Thứ tự hiển thị trong lesson (cho QuizBuilder kéo-thả).
    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Truy vấn nhanh theo lesson + thứ tự.
grammarQuizQuestionSchema.index({ lessonId: 1, order: 1 });

const GrammarQuizQuestion = mongoose.model(
  "GrammarQuizQuestion",
  grammarQuizQuestionSchema,
);

export default GrammarQuizQuestion;
