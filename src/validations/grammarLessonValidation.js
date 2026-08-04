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

export const grammarLessonIdParamsSchema = z
  .object({
    id: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID bài học ngữ pháp không hợp lệ"),
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

export const createGrammarLessonSchema = z
  .object({
    topicId: z.preprocess(
      trimString,
      z
        .string({
          required_error: "ID chủ đề ngữ pháp là bắt buộc",
        })
        .regex(objectIdRegex, "ID chủ đề ngữ pháp không hợp lệ"),
    ),

    title: z.preprocess(
      normalizeName,
      z
        .string({
          required_error: "Tiêu đề bài học là bắt buộc",
        })
        .min(1, "Tiêu đề bài học không được để trống")
        .max(200, "Tiêu đề bài học không được vượt quá 200 ký tự"),
    ),

    shortDescription: z.preprocess(
      normalizeDescription,
      z
        .string()
        .max(500, "Mô tả ngắn không được vượt quá 500 ký tự")
        .optional()
        .default(""),
    ),

    htmlContent: z.preprocess(
      trimString,
      z
        .string({
          required_error: "Nội dung bài học dạng HTML là bắt buộc",
        })
        .min(1, "Nội dung HTML không được để trống"),
    ),

    plainTextContent: z.preprocess(
      trimString,
      z.string().optional().default(""),
    ),

    thumbnailUrl: z.preprocess(
      trimString,
      z
        .string()
        .url("Thumbnail URL không hợp lệ")
        .or(z.literal(""))
        .optional()
        .default(""),
    ),

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

    isPublished: z
      .boolean({
        invalid_type_error: "Trạng thái xuất bản phải là boolean",
      })
      .optional()
      .default(true),

    isActive: z
      .boolean({
        invalid_type_error: "Trạng thái hoạt động phải là boolean",
      })
      .optional()
      .default(true),

    xpReward: z
      .number({
        invalid_type_error: "XP thưởng phải là số",
      })
      .int("XP thưởng phải là số nguyên")
      .min(0, "XP thưởng không được nhỏ hơn 0")
      .max(1000, "XP thưởng không được vượt quá 1000")
      .optional()
      .default(10),

    passThreshold: z
      .number({
        invalid_type_error: "Ngưỡng đạt phải là số",
      })
      .int("Ngưỡng đạt phải là số nguyên")
      .min(0, "Ngưỡng đạt không được nhỏ hơn 0")
      .max(100, "Ngưỡng đạt không được vượt quá 100")
      .optional()
      .default(70),

    htmlContent: z.preprocess(
      trimString,
      z
        .string({
          required_error: "Nội dung bài học dạng HTML là bắt buộc",
        })
        .min(1, "Nội dung HTML không được để trống")
        .optional()
        .default("<p></p>"),
    ),

    allowedPackageIds: z
      .array(
        z.string().regex(objectIdRegex, "ID gói không hợp lệ"),
      )
      .optional()
      .default([]),
  })
  .strict();

export const updateGrammarLessonSchema = z
  .object({
    topicId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID chủ đề ngữ pháp không hợp lệ").optional(),
    ),

    title: z.preprocess(
      normalizeName,
      z
        .string()
        .min(1, "Tiêu đề bài học không được để trống")
        .max(200, "Tiêu đề bài học không được vượt quá 200 ký tự")
        .optional(),
    ),

    shortDescription: z.preprocess(
      normalizeDescription,
      z.string().max(500, "Mô tả ngắn không được vượt quá 500 ký tự").optional(),
    ),

    htmlContent: z.preprocess(
      trimString,
      z.string().min(1, "Nội dung HTML không được để trống").optional(),
    ),

    plainTextContent: z.preprocess(
      trimString,
      z.string().optional(),
    ),

    thumbnailUrl: z.preprocess(
      trimString,
      z.string().url("URL ảnh đại diện không hợp lệ").or(z.literal("")).optional(),
    ),

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

    isPublished: z
      .boolean({
        invalid_type_error: "Trạng thái xuất bản phải là boolean",
      })
      .optional(),

    isActive: z
      .boolean({
        invalid_type_error: "Trạng thái hoạt động phải là boolean",
      })
      .optional(),

    xpReward: z
      .number({
        invalid_type_error: "XP thưởng phải là số",
      })
      .int("XP thưởng phải là số nguyên")
      .min(0, "XP thưởng không được nhỏ hơn 0")
      .max(1000, "XP thưởng không được vượt quá 1000")
      .optional(),

    passThreshold: z
      .number({
        invalid_type_error: "Ngưỡng đạt phải là số",
      })
      .int("Ngưỡng đạt phải là số nguyên")
      .min(0, "Ngưỡng đạt không được nhỏ hơn 0")
      .max(100, "Ngưỡng đạt không được vượt quá 100")
      .optional(),

    lessonType: z
      .enum(["theory", "exercise"], {
        invalid_type_error: "Loại bài học không hợp lệ",
      })
      .optional(),

    parentLessonId: z.preprocess(
      trimString,
      z
        .string()
        .regex(objectIdRegex, "ID bài học cha không hợp lệ")
        .or(z.literal(""))
        .optional()
        .nullable()
        .transform((v) => (v === "" || v === null ? null : v)),
    ),

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

export const changeLessonOrderSchema = z
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
 * Body của PUT /grammar-lessons/:id/content — autosave editor lý thuyết.
 * Tách riêng khỏi updateGrammarLessonSchema để:
 *  - Không xung đột với validation metadata (title, isPublished, ...).
 *  - Cho phép debounce gọi nhiều lần mà không tốn validate field không liên quan.
 *  - lastKnownContentUpdatedAt (optional) dùng cho optimistic locking ở FE.
 */
export const updateGrammarLessonContentSchema = z
  .object({
    htmlContent: z.preprocess(
      trimString,
      z
        .string({
          required_error: "Nội dung HTML là bắt buộc",
        })
        .min(1, "Nội dung HTML không được để trống"),
    ),
    plainTextContent: z.preprocess(
      trimString,
      z.string().optional().default(""),
    ),
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

export const changePublishStatusSchema = z
  .object({
    isPublished: z.boolean({
      required_error: "Trạng thái xuất bản là bắt buộc",
      invalid_type_error: "Trạng thái xuất bản phải là boolean",
    }),
  })
  .strict();

export const changeLessonStatusSchema = z
  .object({
    isActive: z.boolean({
      required_error: "Trạng thái hoạt động là bắt buộc",
      invalid_type_error: "Trạng thái hoạt động phải là boolean",
    }),
  })
  .strict();

export const createGrammarLessonFromDocumentSchema = z
  .object({
    topicId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID chủ đề ngữ pháp không hợp lệ"),
    ),

    title: z.preprocess(
      normalizeName,
      z
        .string({
          required_error: "Tiêu đề bài học là bắt buộc",
        })
        .min(1, "Tiêu đề bài học không được để trống")
        .max(200, "Tiêu đề bài học không được vượt quá 200 ký tự"),
    ),

    shortDescription: z.preprocess(
      normalizeDescription,
      z
        .string()
        .max(500, "Mô tả ngắn không được vượt quá 500 ký tự")
        .optional()
        .default(""),
    ),

    thumbnailUrl: z.preprocess(
      trimString,
      z
        .string()
        .url("Thumbnail URL không hợp lệ")
        .or(z.literal(""))
        .optional()
        .default(""),
    ),

    estimatedTime: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z
        .number({
          invalid_type_error: "Thời gian ước tính phải là số",
        })
        .int("Thời gian ước tính phải là số nguyên phút")
        .min(0, "Thời gian ước tính không được nhỏ hơn 0")
        .optional()
        .default(0),
    ),

    order: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z
        .number({
          invalid_type_error: "Thứ tự hiển thị phải là số",
        })
        .int("Thứ tự hiển thị phải là số nguyên")
        .min(0, "Thứ tự hiển thị không được nhỏ hơn 0")
        .optional()
        .default(0),
    ),

    isPublished: z.preprocess(
      (val) => {
        if (val === "true" || val === true) return true;
        if (val === "false" || val === false) return false;
        return undefined;
      },
      z
        .boolean({
          invalid_type_error: "Trạng thái xuất bản phải là boolean",
        })
        .optional()
        .default(true),
    ),

    isActive: z.preprocess(
      (val) => {
        if (val === "true" || val === true) return true;
        if (val === "false" || val === false) return false;
        return undefined;
      },
      z
        .boolean({
          invalid_type_error: "Trạng thái hoạt động phải là boolean",
        })
        .optional()
        .default(true),
    ),

    lessonType: z
      .enum(["theory", "exercise"], {
        invalid_type_error: "Loại bài học không hợp lệ",
      })
      .optional()
      .default("theory"),

    parentLessonId: z.preprocess(
      trimString,
      z
        .string()
        .regex(objectIdRegex, "ID bài học cha không hợp lệ")
        .or(z.literal(""))
        .optional()
        .nullable()
        .transform((v) => (v === "" || v === null ? null : v)),
    ),
  })
  .strict();

export const updateGrammarLessonFromDocumentSchema = z
  .object({
    title: z.preprocess(
      normalizeName,
      z
        .string()
        .min(1, "Tiêu đề bài học không được để trống")
        .max(200, "Tiêu đề bài học không được vượt quá 200 ký tự")
        .optional(),
    ),

    shortDescription: z.preprocess(
      normalizeDescription,
      z
        .string()
        .max(500, "Mô tả ngắn không được vượt quá 500 ký tự")
        .optional(),
    ),

    thumbnailUrl: z.preprocess(
      trimString,
      z
        .string()
        .url("Thumbnail URL không hợp lệ")
        .or(z.literal(""))
        .optional(),
    ),

    estimatedTime: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z
        .number({
          invalid_type_error: "Thời gian ước tính phải là số",
        })
        .int("Thời gian ước tính phải là số nguyên phút")
        .min(0, "Thời gian ước tính không được nhỏ hơn 0")
        .optional(),
    ),

    isPublished: z.preprocess(
      (val) => {
        if (val === "true" || val === true) return true;
        if (val === "false" || val === false) return false;
        return undefined;
      },
      z
        .boolean({
          invalid_type_error: "Trạng thái xuất bản phải là boolean",
        })
        .optional(),
    ),

    isActive: z.preprocess(
      (val) => {
        if (val === "true" || val === true) return true;
        if (val === "false" || val === false) return false;
        return undefined;
      },
      z
        .boolean({
          invalid_type_error: "Trạng thái hoạt động phải là boolean",
        })
        .optional(),
    ),

    xpReward: z
      .number({
        invalid_type_error: "XP thưởng phải là số",
      })
      .int("XP thưởng phải là số nguyên")
      .min(0, "XP thưởng không được nhỏ hơn 0")
      .max(1000, "XP thưởng không được vượt quá 1000")
      .optional(),

    passThreshold: z
      .number({
        invalid_type_error: "Ngưỡng đạt phải là số",
      })
      .int("Ngưỡng đạt phải là số nguyên")
      .min(0, "Ngưỡng đạt không được nhỏ hơn 0")
      .max(100, "Ngưỡng đạt không được vượt quá 100")
      .optional(),
  })
  .strict();
