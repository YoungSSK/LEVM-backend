import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10, // "A", "B", "C", "D"
    },
    text: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const listeningQuestionSchema = new mongoose.Schema(
  {
    setId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ListeningSet",
      required: true,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ListeningAudioGroup",
      default: null,
      index: true,
    },
    part: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
      index: true,
    },
    // Part 1 & 2 fields (when groupId is null)
    audioUrl: {
      type: String,
      default: "",
      trim: true,
    },
    audioPublicId: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    imagePublicId: {
      type: String,
      default: "",
      trim: true,
    },
    transcript: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    // Question & options
    questionText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    options: {
      type: [optionSchema],
      default: [],
    },
    explanation: {
      type: String,
      default: "",
      trim: true,
      maxlength: 3000,
    },
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
  }
);

listeningQuestionSchema.index({ setId: 1, order: 1 });
listeningQuestionSchema.index({ groupId: 1, order: 1 });

const ListeningQuestion = mongoose.model("ListeningQuestion", listeningQuestionSchema);

export default ListeningQuestion;
