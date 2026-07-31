import mongoose from "mongoose";

// ===== Sub-schema: câu trả lời của user cho 1 câu hỏi =====
const userAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingQuestion",
      required: true,
    },

    // Lưu lại questionType để grade không cần join
    questionType: {
      type: String,
      required: true,
    },

    // Câu trả lời của user — cấu trúc tuỳ questionType:
    //   multiple_choice:       { selectedKey: "B" }
    //   multiple_answer:       { selectedKeys: ["A", "C"] }
    //   true_false_not_given:  { answer: "True" | "False" | "Not Given" }
    //   yes_no_not_given:      { answer: "Yes" | "No" | "Not Given" }
    //   true_false:            { answer: "True" | "False" }
    //   matching_*:            { matches: [{ leftId: "A", rightId: "2" }] }
    //   fill_in_blank / short_answer / completion: { textAnswer: "..." }
    userAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Kết quả chấm tự động
    isCorrect: {
      type: Boolean,
      required: true,
    },

    // Điểm nhận được (0 hoặc question.points)
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Thời gian làm câu này (giây)
    timeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

// ===== Main Schema =====

const readingAttemptSchema = new mongoose.Schema(
  {
    // ===== Relationship =====

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    passageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingPassage",
      required: true,
      index: true,
    },

    questionSetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingQuestionSet",
      required: true,
    },

    // ===== Answers =====

    answers: {
      type: [userAnswerSchema],
      default: [],
    },

    // ===== Statistics =====

    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    correctAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    wrongAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    skippedAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Tổng điểm tối đa (sum of question.points)
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Điểm user đạt được
    earnedPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    // % điểm (0–100), làm tròn 2 số thập phân
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    isPassed: {
      type: Boolean,
      default: false,
    },

    // ===== Gamification =====

    xpEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Cờ audit: attempt này có phải là lần đầu hoàn thành trong ngày không
    isFirstCompletionToday: {
      type: Boolean,
      default: false,
    },

    // ===== Timing =====

    // Tổng thời gian làm bài (giây)
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    // ===== Status =====

    // in_progress: đang làm, completed: đã nộp, abandoned: bỏ giữa chừng
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
  },
  {
    timestamps: true,
  },
);

// ===== Indexes =====

// Lịch sử attempt của user theo passage, mới nhất trước
readingAttemptSchema.index({ userId: 1, passageId: 1, submittedAt: -1 });

// Lịch sử tổng quát của user
readingAttemptSchema.index({ userId: 1, submittedAt: -1 });

// Thống kê theo passage
readingAttemptSchema.index({ passageId: 1, status: 1 });

const ReadingAttempt = mongoose.model("ReadingAttempt", readingAttemptSchema);

export default ReadingAttempt;
