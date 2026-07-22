import { z } from "zod";

export const createAttemptSchema = z.object({
  lessonId: z.string().min(1, "lessonId là bắt buộc"),
  level: z.number().int().min(1).max(3, "level phải từ 1 đến 3"),
});

export const submitAnswerSchema = z.object({
  wordId: z.string().min(1, "wordId là bắt buộc"),
  userAnswer: z.string(),
  isCorrect: z.boolean().optional().default(false),
  timeSpent: z.number().int().min(0).optional().default(0),
});

export const attemptIdParamsSchema = z.object({
  attemptId: z.string().min(1, "attemptId là bắt buộc"),
});

export const lessonIdParamsSchema = z.object({
  lessonId: z.string().min(1, "lessonId là bắt buộc"),
});
