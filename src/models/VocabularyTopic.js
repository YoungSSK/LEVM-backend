import mongoose from "mongoose";

const vocabularyTopicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    thumbnail: {
      type: String,
      default: "",
    },
    lessonCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    wordCount: {
      type: Number,
      default: 0,
      min: 0,
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

vocabularyTopicSchema.index({ name: 1 }, { unique: true });

const VocabularyTopic = mongoose.model(
  "VocabularyTopic",
  vocabularyTopicSchema,
);
export default VocabularyTopic;
