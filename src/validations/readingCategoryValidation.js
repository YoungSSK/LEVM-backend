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

// ===== Params schemas =====

export const readingCategoryIdParamsSchema = z
  .object({
    id: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID danh mục không hợp lệ"),
    ),
  })
  .strict();

export const readingCategorySlugParamsSchema = z
  .object({
    slug: z.preprocess(
      trimString,
      z.string().min(1, "Slug không được để trống"),
    ),
  })
  .strict();

// ===== Body schemas =====

export const createReadingCategorySchema = z
  .object({
    name: z.preprocess(
      normalizeName,
      z
        .string({
          required_error: "Tên danh mục là bắt buộc",
        })
        .min(1, "Tên danh mục không được để trống")
        .max(200, "Tên danh mục không được vượt quá 200 ký tự"),
    ),

    description: z.preprocess(
      trimString,
      z
        .string()
        .max(1000, "Mô tả không được vượt quá 1000 ký tự")
        .optional()
        .default(""),
    ),

    thumbnail: z.preprocess(
      trimString,
      z
        .string()
        .url("Thumbnail URL không hợp lệ")
        .or(z.literal(""))
        .optional()
        .default(""),
    ),

    color: z.preprocess(
      trimString,
      z
        .string()
        .max(20, "Color không được vượt quá 20 ký tự")
        .optional()
        .default(""),
    ),

    order: z
      .number({
        invalid_type_error: "Thứ tự hiển thị phải là số",
      })
      .int("Thứ tự hiển thị phải là số nguyên")
      .min(0, "Thứ tự hiển thị không được nhỏ hơn 0")
      .optional()
      .default(0),

    isActive: z
      .boolean({
        invalid_type_error: "Trạng thái hoạt động phải là boolean",
      })
      .optional()
      .default(true),
  })
  .strict();

export const updateReadingCategorySchema = z
  .object({
    name: z.preprocess(
      normalizeName,
      z
        .string()
        .min(1, "Tên danh mục không được để trống")
        .max(200, "Tên danh mục không được vượt quá 200 ký tự")
        .optional(),
    ),

    description: z.preprocess(
      trimString,
      z
        .string()
        .max(1000, "Mô tả không được vượt quá 1000 ký tự")
        .optional(),
    ),

    thumbnail: z.preprocess(
      trimString,
      z
        .string()
        .url("Thumbnail URL không hợp lệ")
        .or(z.literal(""))
        .optional(),
    ),

    color: z.preprocess(
      trimString,
      z.string().max(20, "Color không được vượt quá 20 ký tự").optional(),
    ),

    order: z
      .number({
        invalid_type_error: "Thứ tự hiển thị phải là số",
      })
      .int("Thứ tự hiển thị phải là số nguyên")
      .min(0, "Thứ tự hiển thị không được nhỏ hơn 0")
      .optional(),

    isActive: z
      .boolean({
        invalid_type_error: "Trạng thái hoạt động phải là boolean",
      })
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Phải cung cấp ít nhất một trường để cập nhật",
  });

export const toggleCategoryStatusSchema = z
  .object({
    isActive: z.boolean({
      required_error: "Trạng thái hoạt động là bắt buộc",
      invalid_type_error: "Trạng thái hoạt động phải là boolean",
    }),
  })
  .strict();
