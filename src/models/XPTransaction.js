import mongoose from "mongoose";

const xpTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      enum: [
        "quiz_correct",
        "level_complete",
        "lesson_complete",
        "streak_bonus",
        "perfect_score",
        "daily_bonus",
      ],
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

xpTransactionSchema.index({ userId: 1, createdAt: -1 });

const XPTransaction = mongoose.model("XPTransaction", xpTransactionSchema);

export default XPTransaction;
