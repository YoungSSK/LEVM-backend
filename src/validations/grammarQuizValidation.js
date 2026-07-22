import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const trimString = (value) =>
  typeof value === "string" ? value.trim() : value;

const optionSchema = z.object({
  text: z.preprocess(
    trimString,
    z.string().min(1, "Đáp án không được trống").max(1000),
  ),
  isCorrect: z.boolean().optional().default(false),
});

const optionsArraySchema = z
  .array(optionSchema)
  .min(2, "Cần ít nhất 2 lựa chọn")
  .max(6, "Tối đa 6 lựa chọn")
  .superRefine((arr, ctx) => {
    const correctCount = arr.filter((o) => o.isCorrect === true).length;
    if (correctCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phải có đúng 1 đáp án đúng (isCorrect=true)",
      });
    }
  });

export const lessonIdParamsQuizSchema = z
  .object({
    lessonId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID bài học không hợp lệ"),
    ),
  })
  .strict();

export const questionIdParamsSchema = z
  .object({
    questionId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID câu hỏi không hợp lệ"),
    ),
  })
  .strict();

export const createGrammarQuizQuestionSchema = z
  .object({
    questionText: z.preprocess(
      trimString,
      z.string().min(1, "Đề bài không được trống").max(2000),
    ),
    options: optionsArraySchema,
    explanation: z.preprocess(
      trimString,
      z.string().max(2000).optional().default(""),
    ),
    order: z.number().int().min(0).optional().default(0),
    isActive: z.boolean().optional().default(true),
  })
  .strict();

export const updateGrammarQuizQuestionSchema = z
  .object({
    questionText: z.preprocess(
      trimString,
      z.string().min(1, "Đề bài không được trống").max(2000).optional(),
    ),
    options: optionsArraySchema.optional(),
    explanation: z.preprocess(trimString, z.string().max(2000).optional()),
    order: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Phải cung cấp ít nhất một trường để cập nhật",
  });

export const reorderQuizSchema = z
  .object({
    orders: z
      .array(
        z.object({
          questionId: z.preprocess(
            trimString,
            z.string().regex(objectIdRegex, "ID câu hỏi không hợp lệ"),
          ),
          order: z.number().int().min(0),
        }),
      )
      .min(1, "Danh sách thứ tự không được rỗng"),
  })
  .strict();

export const submitQuizAnswerSchema = z
  .object({
    questionId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID câu hỏi không hợp lệ"),
    ),
    selectedOptionIndex: z.number().int().min(0).max(5),
  })
  .strict();

export const submitQuizAttemptSchema = z
  .object({
    answers: z
      .array(submitQuizAnswerSchema)
      .min(1, "Phải có ít nhất 1 câu trả lời"),
  })
  .strict();
