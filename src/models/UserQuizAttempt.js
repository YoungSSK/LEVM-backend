import mongoose from "mongoose";

const userQuizAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrammarQuizQuestion",
      required: true,
    },
    selectedOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 5, // index trong mảng options (0-5 ứng với 2-6 options)
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false },
);

const userQuizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrammarLesson",
      required: true,
      index: true,
    },

    answers: {
      type: [userQuizAnswerSchema],
      default: [],
    },

    // % đúng (0–100), làm tròn 2 chữ số thập phân khi lưu.
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // score >= lesson.passThreshold
    isPassed: {
      type: Boolean,
      default: false,
    },

    // XP thực nhận (0 nếu đã pass trước đó / không pass).
    xpEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    attemptedAt: {
      type: Date,
      default: Date.now,
    },

    // Cờ audit: attempt này có tính là "bài đầu tiên hoàn thành trong ngày" hay không.
    // (Streak chỉ cộng 1 lần/ngày — các attempt sau đều false.)
    isFirstCompletionToday: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Lịch sử attempt theo user + lesson, mới nhất trước.
userQuizAttemptSchema.index({ userId: 1, lessonId: 1, attemptedAt: -1 });

// Index cho thống kê: đếm số attempt theo user + lesson.
userQuizAttemptSchema.index({ userId: 1, attemptedAt: -1 });

/**
 * Khuyến nghị chiến lược lưu trữ (không thay đổi logic hiện tại):
 *
 * - Giữ toàn bộ attempt: Phù hợp nếu số lượng user < 10,000 và mỗi user
 *   trung bình < 100 attempt. Collection sẽ tăng ~1-5 MB/ngày/user nếu họ
 *   luyện tập thường xuyên.
 *
 * - Chỉ giữ N attempt gần nhất (ví dụ: 50) mỗi user + lesson:
 *   → Chạy script định kỳ (cron job hàng ngày):
 *     UserQuizAttempt.aggregate([
 *       { $group: { _id: { userId: "$userId", lessonId: "$lessonId" },
 *                   attempts: { $push: { _id: "$_id", attemptedAt: "$attemptedAt" } } } },
 *       { $match: { "attempts.1": { $exists: true } } }, // chỉ group có > 1 attempt
 *     ]).forEach(group => {
 *       const toDelete = group.attempts
 *         .sort((a, b) => b.attemptedAt - a.attemptedAt)
 *         .slice(50)  // giữ 50 gần nhất
 *         .map(a => a._id);
 *       UserQuizAttempt.deleteMany({ _id: { $in: toDelete } });
 *     });
 *
 * - TTL index (xóa tự động sau N ngày):
 *   → Không khuyến nghị vì mất dữ liệu lịch sử học tập.
 *   → Chỉ dùng nếu cần giảm storage bắt buộc, và chỉ áp dụng cho
 *     các attempt cũ hơn 1 năm.
 */

const UserQuizAttempt = mongoose.model(
  "UserQuizAttempt",
  userQuizAttemptSchema,
);

export default UserQuizAttempt;
