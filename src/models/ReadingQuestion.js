import mongoose from "mongoose";

// ===== Sub-schemas =====

// Option cho Multiple Choice / Multiple Answer
const optionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10, // "A", "B", "C", "D", "E"
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

// Item cho Matching (left/right side)
const matchingItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { _id: false },
);

// Cặp match đúng
const correctMatchSchema = new mongoose.Schema(
  {
    leftId: {
      type: String,
      required: true,
    },
    rightId: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

// ===== Main Schema =====

const readingQuestionSchema = new mongoose.Schema(
  {
    // ===== Relationship =====

    // Bộ câu hỏi chứa câu này
    questionSetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingQuestionSet",
      required: true,
      index: true,
    },

    // Denormalized passageId để query nhanh (không cần join qua QuestionSet)
    passageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReadingPassage",
      required: true,
      index: true,
    },

    // ===== Question Content =====

    // Đề bài
    questionText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    // Ngữ cảnh bổ sung (ví dụ: đoạn văn cần match heading, bảng/biểu đồ)
    contextText: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    // ===== Question Type =====
    questionType: {
      type: String,
      required: true,
      enum: [
        "multiple_choice",          // 1 đáp án đúng trong 4-6 options
        "multiple_answer",          // Nhiều đáp án đúng
        "true_false",               // True / False
        "true_false_not_given",     // IELTS: True / False / Not Given
        "yes_no_not_given",         // IELTS: Yes / No / Not Given
        "matching_heading",         // Match heading with paragraph
        "matching_information",     // Match information with paragraph/section
        "matching_feature",         // Match feature with person/group/item
        "matching_sentence_ending", // Match first half of sentence with ending
        "sentence_completion",      // Fill 1 blank in a sentence (from passage)
        "summary_completion",       // Fill blanks in a summary paragraph
        "note_completion",          // Fill blanks in notes/outline
        "table_completion",         // Fill blanks in a table
        "flow_chart_completion",    // Fill blanks in a flow chart
        "diagram_completion",       // Label a diagram
        "short_answer",             // Answer with short phrase (no word bank)
        "fill_in_blank",            // Fill in blank with word bank or open
      ],
    },

    // ===== Answer Data — tuỳ theo questionType =====

    // Multiple Choice / Multiple Answer: danh sách options (A, B, C, D, ...)
    options: {
      type: [optionSchema],
      default: [],
    },

    // Matching types: danh sách item bên trái (vd: Paragraphs A, B, C)
    leftItems: {
      type: [matchingItemSchema],
      default: [],
    },

    // Matching types: danh sách item bên phải (vd: Headings 1, 2, 3)
    rightItems: {
      type: [matchingItemSchema],
      default: [],
    },

    // Matching types: danh sách cặp đúng { leftId, rightId }
    correctMatches: {
      type: [correctMatchSchema],
      default: [],
    },

    // True/False/Not Given, Yes/No/Not Given, completion types, short answer:
    // Lưu đáp án đúng dạng string hoặc string[] (nếu chấp nhận nhiều cách viết)
    // Mixed type để linh hoạt theo questionType
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      // String: đáp án duy nhất
      // [String]: nhiều cách viết được chấp nhận
      // null: không dùng (dùng options hoặc correctMatches)
    },

    // Số từ tối đa cho short_answer / fill_in_blank (null = không giới hạn)
    wordLimit: {
      type: Number,
      default: null,
      min: 1,
    },

    // Phân biệt hoa thường cho fill_in_blank / short_answer
    caseSensitive: {
      type: Boolean,
      default: false,
    },

    // ===== Metadata =====

    // Giải thích đáp án (hiển thị sau khi nộp bài)
    explanation: {
      type: String,
      default: "",
      maxlength: 3000,
    },

    // Vị trí tham chiếu trong bài đọc (vd: "Paragraph A", "Line 12–15")
    locationInPassage: {
      type: String,
      default: "",
      maxlength: 100,
    },

    // Thứ tự hiển thị trong question set
    order: {
      type: Number,
      default: 0,
    },

    // Trạng thái hoạt động
    isActive: {
      type: Boolean,
      default: true,
    },

    // Điểm số của câu hỏi (mặc định 1, exam mode có thể weight khác)
    points: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// ===== Indexes =====

// Truy vấn nhanh câu hỏi theo question set + thứ tự
readingQuestionSchema.index({ questionSetId: 1, order: 1 });

// Truy vấn câu hỏi theo passage (denormalized)
readingQuestionSchema.index({ passageId: 1, questionType: 1 });

// Filter câu hỏi active trong set
readingQuestionSchema.index({ questionSetId: 1, isActive: 1 });

const ReadingQuestion = mongoose.model("ReadingQuestion", readingQuestionSchema);

export default ReadingQuestion;
