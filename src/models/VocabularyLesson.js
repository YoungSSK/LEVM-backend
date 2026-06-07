import mongoose from "mongoose";

const vocabularyLessonSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VocabularyTopic",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
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
  },
);

// Không cho phép trùng tên bài học trong cùng topic
vocabularyLessonSchema.index({ topicId: 1, title: 1 }, { unique: true });

const VocabularyLesson = mongoose.model(
  "VocabularyLesson",
  vocabularyLessonSchema,
);

export default VocabularyLesson;
