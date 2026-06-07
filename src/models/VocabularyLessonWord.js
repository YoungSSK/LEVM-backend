import mongoose from "mongoose";

const vocabularyLessonWordSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VocabularyTopic",
      required: true,
    },

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VocabularyLesson",
      required: true,
    },

    wordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Word",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Một từ chỉ được xuất hiện 1 lần trong cùng topic
vocabularyLessonWordSchema.index({ topicId: 1, wordId: 1 }, { unique: true });

const VocabularyLessonWord = mongoose.model(
  "VocabularyLessonWord",
  vocabularyLessonWordSchema,
);

export default VocabularyLessonWord;
