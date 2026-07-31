import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const trimString = (value) =>
  typeof value === "string" ? value.trim() : value;

// ===== Enums =====

export const QUESTION_TYPES = [
  "multiple_choice",
  "multiple_answer",
  "true_false",
  "true_false_not_given",
  "yes_no_not_given",
  "matching_heading",
  "matching_information",
  "matching_feature",
  "matching_sentence_ending",
  "sentence_completion",
  "summary_completion",
  "note_completion",
  "table_completion",
  "flow_chart_completion",
  "diagram_completion",
  "short_answer",
  "fill_in_blank",
];

const MATCHING_TYPES = [
  "matching_heading",
  "matching_information",
  "matching_feature",
  "matching_sentence_ending",
];

const COMPLETION_TYPES = [
  "sentence_completion",
  "summary_completion",
  "note_completion",
  "table_completion",
  "flow_chart_completion",
  "diagram_completion",
  "short_answer",
  "fill_in_blank",
];

const TF_TYPES = [
  "true_false",
  "true_false_not_given",
  "yes_no_not_given",
];

// ===== Sub-schemas =====

const optionSchema = z.object({
  key: z.string().trim().min(1, "Key option không được để trống").max(10),
  text: z.string().trim().min(1, "Nội dung option không được để trống").max(2000),
  isCorrect: z.boolean().default(false),
});

const matchingItemSchema = z.object({
  id: z.string().trim().min(1, "ID matching item không được để trống"),
  text: z.string().trim().min(1, "Nội dung matching item không được để trống").max(1000),
});

const correctMatchSchema = z.object({
  leftId: z.string().trim().min(1),
  rightId: z.string().trim().min(1),
});

// ===== Params schemas =====

export const questionSetIdParamsSchema = z
  .object({
    setId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID bộ câu hỏi không hợp lệ"),
    ),
  })
  .strict();

export const questionIdParamsSchema = z
  .object({
    id: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID câu hỏi không hợp lệ"),
    ),
  })
  .strict();

// ===== Base question fields (dùng chung cho create và update) =====

const baseQuestionFields = {
  questionText: z.preprocess(
    trimString,
    z
      .string({
        required_error: "Nội dung câu hỏi là bắt buộc",
      })
      .min(1, "Nội dung câu hỏi không được để trống")
      .max(3000, "Nội dung câu hỏi không được vượt quá 3000 ký tự"),
  ),

  questionType: z.enum(QUESTION_TYPES, {
    required_error: "Loại câu hỏi là bắt buộc",
    invalid_type_error: "Loại câu hỏi không hợp lệ",
  }),

  contextText: z.preprocess(
    trimString,
    z.string().max(2000).optional().default(""),
  ),

  options: z.array(optionSchema).optional().default([]),

  leftItems: z.array(matchingItemSchema).optional().default([]),
  rightItems: z.array(matchingItemSchema).optional().default([]),
  correctMatches: z.array(correctMatchSchema).optional().default([]),

  // correctAnswer: string | string[] | null
  correctAnswer: z
    .union([
      z.string().trim(),
      z.array(z.string().trim()),
      z.null(),
    ])
    .optional()
    .default(null),

  wordLimit: z
    .number({ invalid_type_error: "Giới hạn số từ phải là số" })
    .int("Giới hạn số từ phải là số nguyên")
    .min(1, "Giới hạn số từ phải ít nhất là 1")
    .nullable()
    .optional()
    .default(null),

  caseSensitive: z.boolean().optional().default(false),

  explanation: z.preprocess(
    trimString,
    z.string().max(3000).optional().default(""),
  ),

  locationInPassage: z.preprocess(
    trimString,
    z.string().max(100).optional().default(""),
  ),

  order: z
    .number({ invalid_type_error: "Thứ tự phải là số" })
    .int("Thứ tự phải là số nguyên")
    .min(0)
    .optional(),

  points: z
    .number({ invalid_type_error: "Điểm số phải là số" })
    .min(0, "Điểm số không được nhỏ hơn 0")
    .optional()
    .default(1),
};

/**
 * Cross-field validation dựa theo questionType.
 * Áp dụng cho cả create và update.
 */
const refineQuestionByType = (data, ctx) => {
  const { questionType, options, leftItems, rightItems, correctMatches, correctAnswer } = data;

  if (!questionType) return; // update có thể không gửi questionType

  if (["multiple_choice", "multiple_answer"].includes(questionType)) {
    if (!options || options.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Multiple Choice / Multiple Answer phải có ít nhất 2 lựa chọn",
      });
    } else {
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (questionType === "multiple_choice" && correctCount !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Multiple Choice phải có đúng 1 đáp án đúng",
        });
      }
      if (questionType === "multiple_answer" && correctCount < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Multiple Answer phải có ít nhất 1 đáp án đúng",
        });
      }
    }
  }

  if (TF_TYPES.includes(questionType)) {
    const validAnswers = {
      true_false: ["True", "False"],
      true_false_not_given: ["True", "False", "Not Given"],
      yes_no_not_given: ["Yes", "No", "Not Given"],
    };
    const allowed = validAnswers[questionType];
    if (!correctAnswer || !allowed.includes(correctAnswer)) {
      ctx.addIssue({
        code: "custom",
        path: ["correctAnswer"],
        message: `Câu trả lời phải là một trong: ${allowed.join(", ")}`,
      });
    }
  }

  if (MATCHING_TYPES.includes(questionType)) {
    if (!leftItems || leftItems.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["leftItems"],
        message: "Matching type phải có ít nhất 1 item bên trái",
      });
    }
    if (!rightItems || rightItems.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["rightItems"],
        message: "Matching type phải có ít nhất 1 item bên phải",
      });
    }
    if (!correctMatches || correctMatches.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["correctMatches"],
        message: "Matching type phải có ít nhất 1 cặp đáp án đúng",
      });
    }
  }

  if (COMPLETION_TYPES.includes(questionType)) {
    if (
      correctAnswer === null ||
      correctAnswer === undefined ||
      (typeof correctAnswer === "string" && correctAnswer.trim() === "") ||
      (Array.isArray(correctAnswer) && correctAnswer.length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["correctAnswer"],
        message: "Loại câu hỏi này yêu cầu đáp án đúng",
      });
    }
  }
};

export const createReadingQuestionSchema = z
  .object(baseQuestionFields)
  .strict()
  .superRefine(refineQuestionByType);

export const updateReadingQuestionSchema = z
  .object({
    questionText: baseQuestionFields.questionText.optional(),
    questionType: baseQuestionFields.questionType.optional(),
    contextText: baseQuestionFields.contextText,
    options: baseQuestionFields.options,
    leftItems: baseQuestionFields.leftItems,
    rightItems: baseQuestionFields.rightItems,
    correctMatches: baseQuestionFields.correctMatches,
    correctAnswer: baseQuestionFields.correctAnswer,
    wordLimit: baseQuestionFields.wordLimit,
    caseSensitive: baseQuestionFields.caseSensitive,
    explanation: baseQuestionFields.explanation,
    locationInPassage: baseQuestionFields.locationInPassage,
    order: baseQuestionFields.order,
    points: baseQuestionFields.points,
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Phải cung cấp ít nhất một trường để cập nhật",
  })
  .superRefine(refineQuestionByType);

export const reorderQuestionsSchema = z
  .object({
    orders: z
      .array(
        z.object({
          questionId: z.preprocess(
            trimString,
            z.string().regex(objectIdRegex, "ID câu hỏi không hợp lệ"),
          ),
          order: z
            .number({ invalid_type_error: "Thứ tự phải là số" })
            .int("Thứ tự phải là số nguyên")
            .min(0, "Thứ tự phải >= 0"),
        }),
      )
      .min(1, "Danh sách thứ tự không được rỗng"),
  })
  .strict();
