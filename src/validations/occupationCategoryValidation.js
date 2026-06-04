import { z } from "zod";

const trimString = (value) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value;

const normalizeDescription = (value) => {
  if (value == null) return "";

  return typeof value === "string" ? value.trim() : value;
};
const normalizeOptionalString = (value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim().replace(/\s+/g, " ");

  return trimmed === "" ? undefined : trimmed;
};

export const createOccupationCategorySchema = z
  .object({
    name: z.preprocess(
      trimString,
      z
        .string()
        .min(1, "Tên nhóm ngành không được để trống")
        .max(100, "Tên nhóm ngành không được vượt quá 100 ký tự"),
    ),

    description: z.preprocess(
      normalizeDescription,
      z
        .string()
        .max(500, "Mô tả không được vượt quá 500 ký tự")
        .optional()
        .default(""),
    ),
  })
  .strict();

export const updateOccupationCategorySchema = z
  .object({
    name: z.preprocess(
      normalizeOptionalString,
      z
        .string()
        .min(1, "Tên nhóm ngành không được để trống")
        .max(100, "Tên nhóm ngành không được vượt quá 100 ký tự")
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
