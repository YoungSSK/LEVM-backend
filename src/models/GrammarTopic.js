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

    // Thumbnail / Banner image URL
    thumbnail: {
      type: String,
      default: "",
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

// Index cho name và slug đã được tạo tự động qua unique:true trong field definitions

grammarTopicSchema.index({
  order: 1,
});

const GrammarTopic = mongoose.model(
  "GrammarTopic",
  grammarTopicSchema
);

export default GrammarTopic;