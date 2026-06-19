import mongoose from "mongoose";

const wordMeaningSchema = new mongoose.Schema(
  {
    wordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Word",
      required: true,
      index: true,
    },

    partOfSpeech: {
      type: String,
      enum: [
        "noun",
        "verb",
        "adjective",
        "adverb",
        "pronoun",
        "preposition",
        "conjunction",
        "interjection",
        "other",
      ],
      required: true,
    },

    meaning: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    exampleSentence: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    exampleMeaning: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    order: {
      type: Number,
      default: 1,
      min: 1,
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

// Không cho phép trùng nghĩa trong cùng một từ
wordMeaningSchema.index(
  {
    wordId: 1,
    partOfSpeech: 1,
    meaning: 1,
  },
  {
    unique: true,
  },
);

const WordMeaning = mongoose.model("WordMeaning", wordMeaningSchema);

export default WordMeaning;
