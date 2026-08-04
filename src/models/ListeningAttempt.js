import mongoose from "mongoose";

const userAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ListeningQuestion",
      required: true,
    },
    selectedKey: {
      type: String,
      required: true,
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

const listeningAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    setId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ListeningSet",
      required: true,
      index: true,
    },
    answers: {
      type: [userAnswerSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
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
    isPassed: {
      type: Boolean,
      default: false,
    },
    xpEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

listeningAttemptSchema.index({ userId: 1, setId: 1, submittedAt: -1 });
listeningAttemptSchema.index({ userId: 1, submittedAt: -1 });

const ListeningAttempt = mongoose.model("ListeningAttempt", listeningAttemptSchema);

export default ListeningAttempt;
