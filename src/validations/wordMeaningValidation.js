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

const trimString = (value) =>
  typeof value === "string" ? value.trim() : value;

const normalizeText = (value) => {
  if (value === null) {
    return "";
  }

  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value;
};

const normalizeEnumString = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().toLowerCase();
};

const normalizeBoolean = (value) => {
  if (value === undefined || value === null || value === "") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
};

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return value;
  }

  const number = Number(value);

  return Number.isNaN(number) ? value : number;
};

export const wordMeaningWordIdParamsSchema = z
  .object({
    wordId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "Word ID không hợp lệ"),
    ),
  })
  .strict();

export const wordMeaningIdParamsSchema = z
  .object({
    id: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "Meaning ID không hợp lệ "),
    ),
  })
  .strict();

export const setPrimaryMeaningParamsSchema = z
  .object({
    wordId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "Word ID khong hop le"),
    ),

    meaningId: z.preprocess(
      trimString,
      z.string().regex(objectIdRegex, "Meaning ID khong hop le"),
    ),
  })
  .strict();

export const createMeaningSchema = z
  .object({
    partOfSpeech: z.preprocess(
      normalizeEnumString,
      z
        .string({
          required_error: "Part of speech is required",
        })
        .min(1, "Part of speech cannot be empty")
        .refine((value) => partOfSpeechValues.includes(value), {
          message: "Part of speech is invalid",
        }),
    ),

    meaning: z.preprocess(
      normalizeText,
      z
        .string({
          required_error: "Meaning is required",
        })
        .min(1, "Meaning cannot be empty")
        .max(500, "Meaning cannot exceed 500 characters"),
    ),

    exampleSentence: z.preprocess(
      normalizeText,
      z.string().max(1000, "Example sentence cannot exceed 1000 characters")
        .optional()
        .default(""),
    ),

    exampleMeaning: z.preprocess(
      normalizeText,
      z.string().max(1000, "Example meaning cannot exceed 1000 characters")
        .optional()
        .default(""),
    ),

    order: z.preprocess(
      normalizeNumber,
      z.number().int().min(1, "Order must be greater than 0").optional(),
    ),

    isPrimary: z.preprocess(
      normalizeBoolean,
      z.boolean().optional().default(false),
    ),

    isActive: z.preprocess(
      normalizeBoolean,
      z.boolean().optional().default(true),
    ),
  })
  .strict();

export const updateMeaningSchema = z
  .object({
    partOfSpeech: z.preprocess(
      normalizeEnumString,
      z
        .string()
        .optional()
        .refine(
          (value) => value === undefined || partOfSpeechValues.includes(value),
          {
            message: "Part of speech is invalid",
          },
        ),
    ),

    meaning: z.preprocess(
      normalizeText,
      z
        .string()
        .min(1, "Meaning cannot be empty")
        .max(500, "Meaning cannot exceed 500 characters")
        .optional(),
    ),

    exampleSentence: z.preprocess(
      normalizeText,
      z.string().max(1000, "Example sentence cannot exceed 1000 characters").optional(),
    ),

    exampleMeaning: z.preprocess(
      normalizeText,
      z.string().max(1000, "Example meaning cannot exceed 1000 characters").optional(),
    ),

    order: z.preprocess(
      normalizeNumber,
      z.number().int().min(1, "Order must be greater than 0").optional(),
    ),

    isActive: z.preprocess(normalizeBoolean, z.boolean().optional()),

    isPrimary: z.preprocess(normalizeBoolean, z.boolean().optional()),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Phai cung cap it nhat mot truong de cap nhat",
  });

export const changeMeaningStatusSchema = z
  .object({
    isActive: z.preprocess(
      normalizeBoolean,
      z.boolean({
        required_error: "Trang thai la bat buoc",
      }),
    ),
  })
  .strict();

export const changeMeaningOrderSchema = z
  .object({
    orders: z
      .array(
        z.object({
          meaningId: z.preprocess(
            trimString,
            z.string().regex(objectIdRegex, "Meaning ID khong hop le"),
          ),

          order: z.preprocess(
            normalizeNumber,
            z.number().int().min(1, "Order must be greater than 0"),
          ),
        }),
      )
      .min(1, "Danh sach khong duoc rong"),
  })
  .strict();
