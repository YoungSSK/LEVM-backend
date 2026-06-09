import mongoose from "mongoose";

const vocabularyLessonWordSchema = new mongoose.Schema(
  {
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

vocabularyLessonWordSchema.index({ lessonId: 1, wordId: 1 }, { unique: true });

const VocabularyLessonWord = mongoose.model(
  "VocabularyLessonWord",
  vocabularyLessonWordSchema,
);

export default VocabularyLessonWord;
