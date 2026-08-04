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

// ===== Enums =====

const DIFFICULTY_ENUM = [
  "beginner",
  "elementary",
  "intermediate",
  "upper_intermediate",
  "advanced",
];

const CEFR_LEVEL_ENUM = ["A1", "A2", "B1", "B2", "C1", "C2"];

const READING_TYPE_ENUM = [
  "academic",
  "general",
  "narrative",
  "descriptive",
  "expository",
  "argumentative",
  "article",
  "advertisement",
  "notice",
  "letter",
  "report",
  "other",
];

const STATUS_ENUM = ["draft", "published", "archived"];

// ===== Params schemas =====

export const readingPassageIdParamsSchema = z
  .object({
    id: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID bài đọc không hợp lệ"),
    ),
  })
  .strict();

export const readingPassageSlugParamsSchema = z
  .object({
    slug: z.preprocess(
      trimString,
      z.string().min(1, "Slug không được để trống"),
    ),
  })
  .strict();

export const categoryIdParamsSchema = z
  .object({
    categoryId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID danh mục không hợp lệ"),
    ),
  })
  .strict();

// ===== Body schemas =====

export const createReadingPassageSchema = z
  .object({
    categoryId: z.preprocess(
      trimString,
      z
        .string({
          required_error: "ID danh mục là bắt buộc",
        })
        .regex(objectIdRegex, "ID danh mục không hợp lệ"),
    ),

    title: z.preprocess(
      normalizeName,
      z
        .string({
          required_error: "Tiêu đề bài đọc là bắt buộc",
        })
        .min(1, "Tiêu đề bài đọc không được để trống")
        .max(300, "Tiêu đề bài đọc không được vượt quá 300 ký tự"),
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

    htmlContent: z.preprocess(
      trimString,
      z
        .string({
          required_error: "Nội dung bài đọc (HTML) là bắt buộc",
        })
        .min(1, "Nội dung bài đọc không được để trống"),
    ),

    plainText: z.preprocess(
      trimString,
      z.string().optional().default(""),
    ),

    difficulty: z
      .enum(DIFFICULTY_ENUM, {
        invalid_type_error: "Độ khó không hợp lệ",
      })
      .optional()
      .default("intermediate"),

    cefrLevel: z
      .enum(CEFR_LEVEL_ENUM, {
        invalid_type_error: "Cấp độ CEFR không hợp lệ",
      })
      .optional()
      .default("B1"),

    readingType: z
      .enum(READING_TYPE_ENUM, {
        invalid_type_error: "Dạng văn bản không hợp lệ",
      })
      .optional()
      .default("article"),

    tags: z
      .array(z.string().trim().max(50, "Tag không được vượt quá 50 ký tự"))
      .max(20, "Tối đa 20 tags")
      .optional()
      .default([]),

    estimatedTime: z
      .number({
        invalid_type_error: "Thời gian ước tính phải là số",
      })
      .int("Thời gian ước tính phải là số nguyên phút")
      .min(0, "Thời gian ước tính không được nhỏ hơn 0")
      .optional()
      .default(0),

    order: z
      .number({
        invalid_type_error: "Thứ tự hiển thị phải là số",
      })
      .int("Thứ tự hiển thị phải là số nguyên")
      .min(0, "Thứ tự hiển thị không được nhỏ hơn 0")
      .optional()
      .default(0),

    xpReward: z
      .number({
        invalid_type_error: "XP thưởng phải là số",
      })
      .int("XP thưởng phải là số nguyên")
      .min(0, "XP thưởng không được nhỏ hơn 0")
      .max(1000, "XP thưởng không được vượt quá 1000")
      .optional()
      .default(15),

    passThreshold: z
      .number({
        invalid_type_error: "Ngưỡng đạt phải là số",
      })
      .int("Ngưỡng đạt phải là số nguyên")
      .min(0, "Ngưỡng đạt không được nhỏ hơn 0")
      .max(100, "Ngưỡng đạt không được vượt quá 100")
      .optional()
      .default(70),

    allowedPackageIds: z
      .array(
        z.string().regex(objectIdRegex, "ID gói không hợp lệ"),
      )
      .optional()
      .default([]),
  })
  .strict();

export const updateReadingPassageSchema = z
  .object({
    categoryId: z.preprocess(
      trimString,
      z
        .string()
        .regex(objectIdRegex, "ID danh mục không hợp lệ")
        .optional(),
    ),

    title: z.preprocess(
      normalizeName,
      z
        .string()
        .min(1, "Tiêu đề bài đọc không được để trống")
        .max(300, "Tiêu đề bài đọc không được vượt quá 300 ký tự")
        .optional(),
    ),

    description: z.preprocess(
      trimString,
      z.string().max(1000, "Mô tả không được vượt quá 1000 ký tự").optional(),
    ),

    thumbnail: z.preprocess(
      trimString,
      z
        .string()
        .url("Thumbnail URL không hợp lệ")
        .or(z.literal(""))
        .optional(),
    ),

    difficulty: z
      .enum(DIFFICULTY_ENUM, {
        invalid_type_error: "Độ khó không hợp lệ",
      })
      .optional(),

    cefrLevel: z
      .enum(CEFR_LEVEL_ENUM, {
        invalid_type_error: "Cấp độ CEFR không hợp lệ",
      })
      .optional(),

    readingType: z
      .enum(READING_TYPE_ENUM, {
        invalid_type_error: "Dạng văn bản không hợp lệ",
      })
      .optional(),

    tags: z
      .array(z.string().trim().max(50))
      .max(20, "Tối đa 20 tags")
      .optional(),

    estimatedTime: z
      .number({
        invalid_type_error: "Thời gian ước tính phải là số",
      })
      .int("Thời gian ước tính phải là số nguyên")
      .min(0, "Thời gian ước tính không được nhỏ hơn 0")
      .optional(),

    order: z
      .number({
        invalid_type_error: "Thứ tự hiển thị phải là số",
      })
      .int("Thứ tự hiển thị phải là số nguyên")
      .min(0, "Thứ tự hiển thị không được nhỏ hơn 0")
      .optional(),

    xpReward: z
      .number({ invalid_type_error: "XP thưởng phải là số" })
      .int("XP thưởng phải là số nguyên")
      .min(0)
      .max(1000)
      .optional(),

    passThreshold: z
      .number({ invalid_type_error: "Ngưỡng đạt phải là số" })
      .int("Ngưỡng đạt phải là số nguyên")
      .min(0)
      .max(100)
      .optional(),

    allowedPackageIds: z
      .array(
        z.string().regex(objectIdRegex, "ID gói không hợp lệ"),
      )
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Phải cung cấp ít nhất một trường để cập nhật",
  });

/**
 * Schema cho autosave content editor (PUT /:id/content)
 * Tách khỏi updateReadingPassageSchema để không xung đột validation metadata
 */
export const updateReadingPassageContentSchema = z
  .object({
    htmlContent: z.preprocess(
      trimString,
      z
        .string({
          required_error: "Nội dung HTML là bắt buộc",
        })
        .min(1, "Nội dung HTML không được để trống"),
    ),
    plainText: z.preprocess(
      trimString,
      z.string().optional().default(""),
    ),
    // Optimistic locking (optional) — FE gửi timestamp lần autosave trước
    lastKnownContentUpdatedAt: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : v),
        z
          .string()
          .datetime({ offset: true })
          .or(z.string().datetime())
          .optional(),
      )
      .optional(),
  })
  .strict();

export const changePassageStatusSchema = z
  .object({
    status: z.enum(STATUS_ENUM, {
      required_error: "Trạng thái là bắt buộc",
      invalid_type_error: `Trạng thái phải là một trong: ${STATUS_ENUM.join(", ")}`,
    }),
  })
  .strict();

export const changePassageOrderSchema = z
  .object({
    order: z
      .number({
        required_error: "Thứ tự hiển thị là bắt buộc",
        invalid_type_error: "Thứ tự hiển thị phải là số",
      })
      .int("Thứ tự hiển thị phải là số nguyên")
      .min(0, "Thứ tự hiển thị không được nhỏ hơn 0"),
  })
  .strict();

/**
 * Schema dùng cho tạo passage từ DOCX (multipart/form-data)
 * Các field số/boolean cần preprocess vì FormData gửi dạng string
 */
export const createPassageFromDocumentSchema = z
  .object({
    categoryId: z.preprocess(
      trimString,
      z
        .string({ required_error: "ID danh mục là bắt buộc" })
        .regex(objectIdRegex, "ID danh mục không hợp lệ"),
    ),

    title: z.preprocess(
      normalizeName,
      z
        .string({ required_error: "Tiêu đề bài đọc là bắt buộc" })
        .min(1, "Tiêu đề bài đọc không được để trống")
        .max(300),
    ),

    description: z.preprocess(
      trimString,
      z.string().max(1000).optional().default(""),
    ),

    thumbnail: z.preprocess(
      trimString,
      z.string().url("Thumbnail URL không hợp lệ").or(z.literal("")).optional().default(""),
    ),

    difficulty: z
      .enum(DIFFICULTY_ENUM, { invalid_type_error: "Độ khó không hợp lệ" })
      .optional()
      .default("intermediate"),

    cefrLevel: z
      .enum(CEFR_LEVEL_ENUM, { invalid_type_error: "Cấp độ CEFR không hợp lệ" })
      .optional()
      .default("B1"),

    readingType: z
      .enum(READING_TYPE_ENUM, { invalid_type_error: "Dạng văn bản không hợp lệ" })
      .optional()
      .default("article"),

    estimatedTime: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z.number().int().min(0).optional().default(0),
    ),

    order: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z.number().int().min(0).optional().default(0),
    ),

    xpReward: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z.number().int().min(0).max(1000).optional().default(15),
    ),

    passThreshold: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z.number().int().min(0).max(100).optional().default(70),
    ),
  })
  .strict();

export const updatePassageFromDocumentSchema = z
  .object({
    title: z.preprocess(
      normalizeName,
      z.string().min(1).max(300).optional(),
    ),

    description: z.preprocess(
      trimString,
      z.string().max(1000).optional(),
    ),

    thumbnail: z.preprocess(
      trimString,
      z.string().url("Thumbnail URL không hợp lệ").or(z.literal("")).optional(),
    ),

    difficulty: z
      .enum(DIFFICULTY_ENUM, { invalid_type_error: "Độ khó không hợp lệ" })
      .optional(),

    cefrLevel: z
      .enum(CEFR_LEVEL_ENUM, { invalid_type_error: "Cấp độ CEFR không hợp lệ" })
      .optional(),

    readingType: z
      .enum(READING_TYPE_ENUM, { invalid_type_error: "Dạng văn bản không hợp lệ" })
      .optional(),

    estimatedTime: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z.number().int().min(0).optional(),
    ),

    xpReward: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z.number().int().min(0).max(1000).optional(),
    ),

    passThreshold: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z.number().int().min(0).max(100).optional(),
    ),
  })
  .strict();
