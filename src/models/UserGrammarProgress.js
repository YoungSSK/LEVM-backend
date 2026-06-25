import mongoose from "mongoose";

const userGrammarProgressSchema = new mongoose.Schema(
  {
    // Người học
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Bài học ngữ pháp
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrammarLesson",
      required: true,
    },

    // Đã hoàn thành bài học hay chưa
    isCompleted: {
      type: Boolean,
      default: false,
    },

    // Thời điểm hoàn thành
    completedAt: {
      type: Date,
      default: null,
    },

    // Thời điểm truy cập gần nhất
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Mỗi user chỉ có 1 bản ghi tiến độ cho 1 bài học
userGrammarProgressSchema.index(
  {
    userId: 1,
    lessonId: 1,
  },
  {
    unique: true,
  }
);

// Tăng tốc lấy danh sách bài học đã học của user
userGrammarProgressSchema.index({
  userId: 1,
});

// Tăng tốc thống kê tiến độ theo bài học
userGrammarProgressSchema.index({
  lessonId: 1,
});

const UserGrammarProgress = mongoose.model(
  "UserGrammarProgress",
  userGrammarProgressSchema
);

export default UserGrammarProgress;