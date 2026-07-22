import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    wordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Word",
      required: true,
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },

    userAnswer: {
      type: String,
      default: "",
    },

    timeSpent: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const lessonAttemptSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VocabularyLesson",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    level: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },

    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },

    correctCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    stars: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },

    answers: {
      type: [answerSchema],
      default: [],
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

lessonAttemptSchema.index({ lessonId: 1, userId: 1 });
lessonAttemptSchema.index({ lessonId: 1, userId: 1, level: 1 });
lessonAttemptSchema.index({ userId: 1, completedAt: -1 });

const LessonAttempt = mongoose.model("LessonAttempt", lessonAttemptSchema);

export default LessonAttempt;
