import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const partOfSpeechValues = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "interjection",
  "other",
];

const difficultyValues = ["easy", "medium", "hard"];

const trimString = (value) => {
  return typeof value === "string" ? value.trim() : value;
};

const normalizeWord = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().replace(/\s+/g, " ").toLowerCase();
};

const normalizeMeaning = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().replace(/\s+/g, " ");
};

const normalizeEnumString = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().toLowerCase();
};

const escapeRegex = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeSearchKeyword = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return escapeRegex(value.trim().replace(/\s+/g, " "));
};

export const wordIdParamsSchema = z
  .object({
    id: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "ID tu vung khong hop le"),
    ),
  })
  .strict();

export const createWordSchema = z
  .object({
    word: z.preprocess(
      normalizeWord,
      z
        .string({
          required_error: "Tu vung la bat buoc",
        })
        .min(1, "Tu vung khong duoc de trong")
        .max(100, "Tu vung khong duoc vuot qua 100 ky tu"),
    ),

    meaning: z.preprocess(
      normalizeMeaning,
      z
        .string({
          required_error: "Nghia la bat buoc",
        })
        .min(1, "Nghia khong duoc de trong")
        .max(500, "Nghia khong duoc vuot qua 500 ky tu"),
    ),

    partOfSpeech: z.preprocess(
      normalizeEnumString,
      z
        .string({
          required_error: "Tu loai la bat buoc",
        })
        .min(1, "Tu loai khong duoc de trong")
        .refine((value) => partOfSpeechValues.includes(value), {
          message: "Tu loai khong hop le",
        }),
    ),

    difficulty: z.preprocess(
      normalizeEnumString,
      z
        .string()
        .optional()
        .default("easy")
        .refine((value) => difficultyValues.includes(value), {
          message: "Muc do kho khong hop le",
        }),
    ),
  })
  .strict();

export const updateWordSchema = z
  .object({
    word: z.preprocess(
      normalizeWord,
      z
        .string()
        .min(1, "Tu vung khong duoc de trong")
        .max(100, "Tu vung khong duoc vuot qua 100 ky tu")
        .optional(),
    ),

    difficulty: z.preprocess(
      normalizeEnumString,
      z
        .string()
        .optional()
        .refine((value) => value === undefined || difficultyValues.includes(value), {
          message: "Muc do kho khong hop le",
        }),
    ),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Phai cung cap it nhat mot truong de cap nhat",
  });

export const getAllWordQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  })
  .strict();

export const searchWordQuerySchema = z
  .object({
    keyword: z.preprocess(
      normalizeSearchKeyword,
      z
        .string({
          required_error: "Tu khoa tim kiem la bat buoc",
        })
        .min(1, "Tu khoa tim kiem khong duoc de trong"),
    ),
  })
  .strict();

export const changeStatusWordSchema = z
  .object({
    isActive: z.boolean({
      required_error: "Trang thai la bat buoc",
    }),
  })
  .strict();
