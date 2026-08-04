import { z } from "zod";

// Valid object ID string pattern
const objectIdString = z
  .string()
  .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid ObjectId",
  });

// Schema cho ListeningSet
export const createListeningSetSchema = z.object({
  title: z.string().trim().min(1, "Tiêu đề bài nghe không được để trống").max(300, "Tiêu đề tối đa 300 ký tự"),
  part: z.number().int().min(1).max(4, "Part phải thuộc từ 1 đến 4"),
  difficulty: z
    .enum(["beginner", "elementary", "intermediate", "upper_intermediate", "advanced"])
    .optional()
    .default("intermediate"),
  status: z.enum(["draft", "published", "archived"]).optional().default("draft"),
  xpReward: z.number().min(0).max(1000).optional().default(15),
  passThreshold: z.number().min(0).max(100).optional().default(70),
  order: z.number().min(0).optional().default(0),
  allowedPackageIds: z.preprocess(
    (val) => (Array.isArray(val) ? val.map((v) => (typeof v === "object" && v ? v._id || v.id : v)) : val),
    z.array(objectIdString).optional().default([]),
  ),
});

export const updateListeningSetSchema = z.object({
  title: z.string().trim().min(1, "Tiêu đề bài nghe không được để trống").max(300, "Tiêu đề tối đa 300 ký tự").optional(),
  part: z.number().int().min(1).max(4, "Part phải thuộc từ 1 đến 4").optional(),
  difficulty: z.enum(["beginner", "elementary", "intermediate", "upper_intermediate", "advanced"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  xpReward: z.number().min(0).max(1000).optional(),
  passThreshold: z.number().min(0).max(100).optional(),
  order: z.number().min(0).optional(),
  allowedPackageIds: z.preprocess(
    (val) => (Array.isArray(val) ? val.map((v) => (typeof v === "object" && v ? v._id || v.id : v)) : val),
    z.array(objectIdString).optional(),
  ),
});

// Schema cho ListeningAudioGroup (Dành riêng Part 3 & 4)
export const createListeningGroupSchema = z.object({
  setId: objectIdString,
  title: z.string().trim().max(300).optional().default(""),
  audioUrl: z.string().trim().min(1, "Bắt buộc có file âm thanh audioUrl"),
  audioPublicId: z.string().trim().optional().default(""),
  transcript: z.string().trim().min(1, "Bắt buộc có nội dung transcript").max(5000, "Transcript tối đa 5000 ký tự"),
  imageUrl: z.string().trim().optional().default(""),
  imagePublicId: z.string().trim().optional().default(""),
  order: z.number().min(0).optional().default(0),
});

export const updateListeningGroupSchema = createListeningGroupSchema.partial().omit({ setId: true });

// Schema Option cho ListeningQuestion
const optionSchema = z.object({
  key: z.string().trim().min(1, "Key đáp án không được rỗng (ví dụ: A, B, C, D)"),
  text: z.string().trim().default(""),
  isCorrect: z.boolean().default(false),
});

// Base raw object schema cho ListeningQuestion (dùng được với .partial())
const baseListeningQuestionSchema = z.object({
  setId: objectIdString,
  groupId: objectIdString.nullable().optional().default(null),
  part: z.number().int().min(1).max(4),
  audioUrl: z.string().trim().optional().default(""),
  audioPublicId: z.string().trim().optional().default(""),
  imageUrl: z.string().trim().optional().default(""),
  imagePublicId: z.string().trim().optional().default(""),
  transcript: z.string().trim().optional().default(""),
  questionText: z.string().trim().optional().default(""),
  options: z.array(optionSchema).min(3, "Tối thiểu phải có 3 lựa chọn").max(4, "Tối đa 4 lựa chọn"),
  explanation: z.string().trim().max(3000).optional().default(""),
  order: z.number().optional().default(0),
});

// Refinement validation cho Create ListeningQuestion
export const createListeningQuestionSchema = baseListeningQuestionSchema.superRefine((data, ctx) => {
  // Đếm số đáp án đúng (isCorrect = true)
  if (Array.isArray(data.options)) {
    const correctCount = data.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phải chọn duy nhất đúng 1 đáp án đúng (isCorrect = true)",
        path: ["options"],
      });
    }
  }

  // Part 1 rules
  if (data.part === 1) {
    if (!data.imageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Part 1 bắt buộc phải có ảnh (imageUrl)",
        path: ["imageUrl"],
      });
    }
    if (!data.audioUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Part 1 bắt buộc phải có file âm thanh (audioUrl)",
        path: ["audioUrl"],
      });
    }
    if (!data.transcript) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Part 1 bắt buộc phải nhập transcript",
        path: ["transcript"],
      });
    }
    if (data.options && data.options.length !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Part 1 bắt buộc có đúng 4 đáp án (A, B, C, D)",
        path: ["options"],
      });
    }
  }

  // Part 2 rules
  if (data.part === 2) {
    if (!data.audioUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Part 2 bắt buộc phải có file âm thanh (audioUrl)",
        path: ["audioUrl"],
      });
    }
    if (!data.transcript) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Part 2 bắt buộc phải nhập transcript",
        path: ["transcript"],
      });
    }
    if (data.options && data.options.length !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Part 2 bắt buộc có đúng 3 đáp án (A, B, C)",
        path: ["options"],
      });
    }
  }

  // Part 3 & 4 rules
  if (data.part === 3 || data.part === 4) {
    if (!data.groupId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Part 3 & 4 bắt buộc phải gắn với một Audio Group (groupId)",
        path: ["groupId"],
      });
    }
    if (!data.questionText || data.questionText.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Part 3 & 4 bắt buộc phải có nội dung câu hỏi (questionText)",
        path: ["questionText"],
      });
    }
    // Mỗi option phải có text
    if (Array.isArray(data.options)) {
      data.options.forEach((opt, idx) => {
        if (!opt.text || opt.text.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Đáp án ${opt.key || idx + 1} của Part 3 & 4 không được để trống`,
            path: ["options", idx, "text"],
          });
        }
      });
    }
  }
});

// Update schema bằng cách gọi .partial() trên raw object schema
export const updateListeningQuestionSchema = baseListeningQuestionSchema.partial().omit({ setId: true, part: true });

// Reorder schema
export const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: objectIdString,
        order: z.number().min(0),
      })
    )
    .min(1, "Danh sách sắp xếp không được rỗng"),
});

// Submit Attempt schema
export const submitListeningAttemptSchema = z.object({
  setId: objectIdString,
  durationSeconds: z.number().min(0).optional().default(0),
  answers: z
    .array(
      z.object({
        questionId: objectIdString,
        selectedKey: z.string().trim().min(1, "Vui lòng chọn 1 đáp án"),
      })
    )
    .min(1, "Vui lòng trả lời ít nhất 1 câu hỏi"),
});
