import mongoose from "mongoose";

const wordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },

    pronunciations: {
      us: {
        type: String,
        default: "",
      },
      uk: {
        type: String,
        default: "",
      },
    },

    audioUrls: {
      us: {
        type: String,
        default: "",
      },
      uk: {
        type: String,
        default: "",
      },
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
wordSchema.index(
  {
    word: 1,
  },
  {
    unique: true,
  },
);

// Virtual Populate
wordSchema.virtual("meanings", {
  ref: "WordMeaning",
  localField: "_id",
  foreignField: "wordId",
});

wordSchema.set("toJSON", {
  virtuals: true,
});

wordSchema.set("toObject", {
  virtuals: true,
});

const Word = mongoose.model("Word", wordSchema);

export default Word;
