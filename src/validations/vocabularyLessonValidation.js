import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const trimString = (value) =>
  typeof value === "string" ? value.trim() : value;

const normalizeName = (value) => {
  if (typeof value === "string") {
    return value.trim().replace(/\s+/g, " ");
  }

  return value;
};

const normalizeDescription = (value) => {
  if (value === null) return "";

  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value;
};

export const lessonIdParamsSchema = z
  .object({
    id: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID bài học không hợp lệ"),
    ),
  })
  .strict();

export const topicIdParamsSchema = z
  .object({
    topicId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID chủ đề không hợp lệ"),
    ),
  })
  .strict();

export const createLessonSchema = z
  .object({
    topicId: z.preprocess(
      trimString,
      z
        .string({
          required_error: "Topic là bắt buộc",
        })
        .regex(objectIdRegex, "Topic không hợp lệ"),
    ),

    title: z.preprocess(
      normalizeName,
      z
        .string({
          required_error: "Tên bài học là bắt buộc",
        })
        .min(1, "Tên bài học không được để trống")
        .max(100, "Tên bài học tối đa 100 ký tự"),
    ),

    description: z.preprocess(
      normalizeDescription,
      z.string().max(500, "Mô tả tối đa 500 ký tự").optional().default(""),
    ),

    order: z
      .number({
        invalid_type_error: "Thứ tự phải là số",
      })
      .int("Thứ tự phải là số nguyên")
      .min(1, "Thứ tự phải lớn hơn 0")
      .optional(),

    thumbnail: z.preprocess(
      trimString,
      z
        .string()
        .url("Thumbnail không hợp lệ")
        .or(z.literal(""))
        .optional()
        .default(""),
    ),

    estimatedTime: z
      .number({
        invalid_type_error: "Thời gian phải là số",
      })
      .min(0, "Thời gian không được âm")
      .optional()
      .default(0),

    isActive: z.boolean().optional().default(true),
  })
  .strict();

export const updateLessonSchema = z
  .object({
    title: z.preprocess(
      normalizeName,
      z
        .string()
        .min(1, "Tên bài học không được để trống")
        .max(100, "Tên bài học tối đa 100 ký tự")
        .optional(),
    ),

    description: z.preprocess(
      normalizeDescription,
      z.string().max(500, "Mô tả tối đa 500 ký tự").optional(),
    ),

    thumbnail: z.preprocess(
      trimString,
      z.string().url("Thumbnail không hợp lệ").or(z.literal("")).optional(),
    ),

    order: z.number().int().min(1).optional(),

    estimatedTime: z.number().min(0).optional(),

    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Phải cung cấp ít nhất một trường để cập nhật",
  });

export const lessonWordSchema = z
  .object({
    lessonId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "Lesson không hợp lệ"),
    ),

    wordId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "Word không hợp lệ"),
    ),
  })
  .strict();

export const changeStatusSchema = z
  .object({
    isActive: z.boolean({
      required_error: "Trạng thái là bắt buộc",
    }),
  })
  .strict();

export const changeOrderSchema = z
  .object({
    orders: z
      .array(
        z.object({
          lessonId: z.preprocess(
            trimString,
            z.string().regex(objectIdRegex, "Lesson không hợp lệ"),
          ),

          order: z.number().int().min(1),
        }),
      )
      .min(1, "Danh sách không được rỗng"),
  })
  .strict();
