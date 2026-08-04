import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

/**
 * Accept cả ObjectId lẫn slug — giống topicIdParamsSchema trong vocabulary.
 * Lỗi "ID chủ đề ngữ pháp không hợp lệ" xảy ra khi slug bị gửi vào schema này.
 */
export const grammarTopicIdParamsSchema = z
  .object({
    id: z.preprocess(
      trimString,
      z.string().refine(
        (val) => objectIdRegex.test(val) || slugRegex.test(val),
        "ID chủ đề ngữ pháp không hợp lệ",
      ),
    ),
  })
  .strict();

export const createGrammarTopicSchema = z
  .object({
    name: z.preprocess(
      normalizeName,
      z
        .string({
          required_error: "Tên chủ đề ngữ pháp là bắt buộc",
        })
        .min(1, "Tên chủ đề ngữ pháp không được để trống")
        .max(200, "Tên chủ đề ngữ pháp không được vượt quá 200 ký tự"),
    ),

    description: z.preprocess(
      normalizeDescription,
      z
        .string()
        .max(1000, "Mô tả không được vượt quá 1000 ký tự")
        .optional()
        .default(""),
    ),

    thumbnail: z.preprocess(
      trimString,
      z.string().max(2000, "URL thumbnail không được quá 2000 ký tự").optional().default(""),
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

export const updateGrammarTopicSchema = z
  .object({
    name: z.preprocess(
      normalizeName,
      z
        .string()
        .min(1, "Tên chủ đề ngữ pháp không được để trống")
        .max(200, "Tên chủ đề ngữ pháp không được vượt quá 200 ký tự")
        .optional(),
    ),

    description: z.preprocess(
      normalizeDescription,
      z
        .string()
        .max(1000, "Mô tả không được vượt quá 1000 ký tự")
        .optional(),
    ),

    thumbnail: z.preprocess(
      trimString,
      z.string().max(2000, "URL thumbnail không được quá 2000 ký tự").optional(),
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

export const changeTopicOrderSchema = z
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

export const changeTopicStatusSchema = z
  .object({
    isActive: z.boolean({
      required_error: "Trạng thái hoạt động là bắt buộc",
      invalid_type_error: "Trạng thái hoạt động phải là boolean",
    }),
  })
  .strict();
