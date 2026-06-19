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

export const topicIdParamsSchema = z
  .object({
    id: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID chủ đề không hợp lệ"),
    ),
  })
  .strict();

export const createTopicSchema = z
  .object({
    name: z.preprocess(
      normalizeName,
      z
        .string({
          required_error: "Tên chủ đề là bắt buộc",
        })
        .min(1, "Tên chủ đề không được để trống")
        .max(100, "Tên chủ đề không được vượt quá 100 ký tự"),
    ),

    description: z.preprocess(
      normalizeDescription,
      z
        .string()
        .max(500, "Mô tả không được vượt quá 500 ký tự")
        .optional()
        .default(""),
    ),

    thumbnail: z.preprocess(
      trimString,
      z
        .string()
        .url("Đường dẫn thumbnail không hợp lệ")
        .or(z.literal(""))
        .optional()
        .default(""),
    ),
  })
  .strict();

export const updateTopicSchema = z
  .object({
    name: z.preprocess(
      normalizeName,
      z
        .string()
        .min(1, "Tên chủ đề không được để trống")
        .max(100, "Tên chủ đề không được vượt quá 100 ký tự")
        .optional(),
    ),

    description: z.preprocess(
      normalizeDescription,
      z.string().max(500, "Mô tả không được vượt quá 500 ký tự").optional(),
    ),

    thumbnail: z.preprocess(
      trimString,
      z
        .string()
        .url("Đường dẫn thumbnail không hợp lệ")
        .or(z.literal(""))
        .optional(),
    ),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Phải cung cấp ít nhất một trường để cập nhật",
  });

export const changeStatusSchema = z
  .object({
    isActive: z.boolean({
      required_error: "Trạng thái là bắt buộc",
    }),
  })
  .strict();
