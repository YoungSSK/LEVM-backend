import mongoose from "mongoose";

const wordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      trim: true,
    },

    pronunciation: {
      type: String,
      default: "",
    },

    meaning: {
      type: String,
      required: true,
    },

    exampleSentence: {
      type: String,
      default: "",
    },

    exampleMeaning: {
      type: String,
      default: "",
    },

    audioUrl: {
      type: String,
      default: "",
    },

    imageUrl: {
      type: String,
      default: "",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
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

// Không cho phép tạo trùng từ
wordSchema.index({ word: 1 }, { unique: true });

const Word = mongoose.model("Word", wordSchema);

export default Word;
