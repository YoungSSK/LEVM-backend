import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const trimString = (value) =>
  typeof value === "string" ? value.trim() : value;

const normalizeDescription = (value) => {
  if (value === null) {
    return "";
  }

  return typeof value === "string" ? value.trim() : value;
};

const normalizeName = (value) => {
  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }

  return value;
};

export const createOccupationSchema = z
  .object({
    categoryId: z
      .string({
        required_error: "Nhóm ngành là bắt buộc",
      })
      .regex(objectIdRegex, "ID nhóm ngành không hợp lệ"),

    name: z.preprocess(
      normalizeName,
      z
        .string({
          required_error: "Tên nghề nghiệp là bắt buộc",
        })
        .min(1, "Tên nghề nghiệp không được để trống")
        .max(100, "Tên nghề nghiệp không được vượt quá 100 ký tự"),
    ),

    description: z.preprocess(
      normalizeDescription,
      z
        .string()
        .max(500, "Mô tả không được vượt quá 500 ký tự")
        .optional()
        .default(""),
    ),

    isActive: z.boolean().optional(),
  })
  .strict();

export const updateOccupationSchema = z
  .object({
    categoryId: z
      .string()
      .regex(objectIdRegex, "ID nhóm ngành không hợp lệ")
      .optional(),

    name: z.preprocess(
      normalizeName,
      z
        .string()
        .min(1, "Tên nghề nghiệp không được để trống")
        .max(100, "Tên nghề nghiệp không được vượt quá 100 ký tự")
        .optional(),
    ),

    description: z.preprocess(
      normalizeDescription,
      z.string().max(500, "Mô tả không được vượt quá 500 ký tự").optional(),
    ),

    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Phải cung cấp ít nhất một trường để cập nhật",
  });
