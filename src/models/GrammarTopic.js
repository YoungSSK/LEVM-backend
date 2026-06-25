import mongoose from "mongoose";

const grammarTopicSchema = new mongoose.Schema(
  {
    // Tên chủ đề
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 200,
    },

    // URL thân thiện
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Mô tả chủ đề
    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    // Thứ tự hiển thị
    order: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Số lượng bài học thuộc chủ đề
    lessonCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Trạng thái hoạt động
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

grammarTopicSchema.index(
  { name: 1 },
  { unique: true }
);

grammarTopicSchema.index(
  { slug: 1 },
  { unique: true }
);

grammarTopicSchema.index({
  order: 1,
});

const GrammarTopic = mongoose.model(
  "GrammarTopic",
  grammarTopicSchema
);

export default GrammarTopic;