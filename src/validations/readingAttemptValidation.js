import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const trimString = (value) =>
  typeof value === "string" ? value.trim() : value;

// ===== Params schemas =====

export const attemptIdParamsSchema = z
  .object({
    attemptId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID attempt không hợp lệ"),
    ),
  })
  .strict();

export const passageIdParamsSchema = z
  .object({
    passageId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID bài đọc không hợp lệ"),
    ),
  })
  .strict();

// ===== Body schemas =====

export const startAttemptSchema = z
  .object({
    passageId: z.preprocess(
      trimString,
      z
        .string({ required_error: "ID bài đọc là bắt buộc" })
        .regex(objectIdRegex, "ID bài đọc không hợp lệ"),
    ),
    questionSetId: z.preprocess(
      trimString,
      z
        .string({ required_error: "ID bộ câu hỏi là bắt buộc" })
        .regex(objectIdRegex, "ID bộ câu hỏi không hợp lệ"),
    ),
  })
  .strict();

/**
 * Schema validate danh sách câu trả lời khi submit.
 * userAnswer dùng Mixed type (z.any()) vì cấu trúc khác nhau theo questionType.
 * Business validation (chính xác theo questionType) thực hiện trong service.
 */
export const submitAttemptSchema = z
  .object({
    answers: z
      .array(
        z.object({
          questionId: z.preprocess(
            trimString,
            z
              .string({ required_error: "ID câu hỏi là bắt buộc" })
              .regex(objectIdRegex, "ID câu hỏi không hợp lệ"),
          ),
          userAnswer: z.any(),
          timeSpent: z
            .number({ invalid_type_error: "Thời gian làm câu phải là số" })
            .min(0)
            .optional()
            .default(0),
        }),
      )
      .min(1, "Phải có ít nhất 1 câu trả lời"),
    duration: z
      .number({ invalid_type_error: "Thời gian làm bài phải là số" })
      .min(0, "Thời gian làm bài không được nhỏ hơn 0")
      .optional()
      .default(0),
  })
  .strict();
