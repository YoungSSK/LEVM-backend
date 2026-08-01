import ReadingQuestion from "../models/ReadingQuestion.js";
import ReadingQuestionSet from "../models/ReadingQuestionSet.js";
import ReadingPassage from "../models/ReadingPassage.js";
import { processCsvBuffer } from "../utils/csv/index.js";
import AppError from "../utils/AppError.js";
import { updateQuestionCount } from "./readingQuestionSetService.js";
import { parse } from "csv-parse/sync";

// ===== Constants =====

const MAX_QUESTIONS_PER_IMPORT = 500;

// Question types nhóm theo cách xử lý answer trong CSV
const MC_TYPES = ["multiple_choice", "multiple_answer"];
const TF_TYPES = ["true_false", "true_false_not_given", "yes_no_not_given"];
const MATCHING_TYPES = [
  "matching_heading", "matching_information",
  "matching_feature", "matching_sentence_ending",
];
const COMPLETION_TYPES = [
  "sentence_completion", "summary_completion", "note_completion",
  "table_completion", "flow_chart_completion", "diagram_completion",
  "short_answer", "fill_in_blank",
];

// CSV header bắt buộc (lowercase)
const CSV_REQUIRED_HEADERS = [
  "question type",
  "question text",
  "correct answer",
];

// ===== Helpers =====

// Shared CSV Engine (processCsvBuffer) được sử dụng để tự động detect & decode Win-1258/UTF-8/UTF-16.

/**
 * Normalize một record CSV thành ReadingQuestion document.
 * CSV columns (case-insensitive):
 *   Question Type, Question Text, Context, Option A, Option B, Option C, Option D,
 *   Correct Key, Correct Match, Correct Answer, Explanation, Points, Location
 */
const normalizeCsvRecord = (raw, rowIndex) => {
  const r = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k) r[k.trim().toLowerCase()] = (v || "").trim();
  }

  // Smart Aliases
  const questionType = (
    r["question type"] || r["type"] || r["dạng bài"] || "multiple_choice"
  ).trim().toLowerCase();

  const allTypes = [...MC_TYPES, ...TF_TYPES, ...MATCHING_TYPES, ...COMPLETION_TYPES];
  if (!allTypes.includes(questionType)) {
    throw new AppError(
      `Dòng ${rowIndex + 2}: "Question Type" không hợp lệ: "${questionType}"`,
      400,
    );
  }

  const questionText = (
    r["question text"] || r["question"] || r["câu hỏi"] || r["đề bài"] || ""
  ).trim();

  if (!questionText) {
    throw new AppError(
      `Dòng ${rowIndex + 2}: Thiếu cột "Question Text" hoặc Question rỗng`,
      400,
    );
  }

  const doc = {
    questionType,
    questionText,
    contextText: r["context"] || "",
    explanation: r["explanation"] || r["giải thích"] || "",
    locationInPassage: r["location"] || "",
    points: r["points"] ? Number(r["points"]) || 1 : 1,
    options: [],
    leftItems: [],
    rightItems: [],
    correctMatches: [],
    correctAnswer: null,
    isActive: true,
  };

  // Multiple Choice / Multiple Answer
  if (MC_TYPES.includes(questionType)) {
    const optionKeys = ["option a", "option b", "option c", "option d"];
    const correctKey = (
      r["correct key"] || r["correct option"] || r["correct answer"] || r["correct"] || r["đáp án đúng"] || r["đáp án"] || ""
    ).toLowerCase();

    const keyMap = { a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
    const options = optionKeys.map((k, i) => ({
      key: String.fromCharCode(65 + i),
      text: r[k] || "",
      isCorrect: false,
    })).filter((o) => o.text);

    if (options.length < 2) {
      throw new AppError(
        `Dòng ${rowIndex + 2}: Phải có ít nhất 2 options (Option A, Option B, ...)`,
        400,
      );
    }

    if (questionType === "multiple_choice") {
      const idx = keyMap[correctKey];
      if (idx === undefined) {
        throw new AppError(
          `Dòng ${rowIndex + 2}: "Correct Option / Correct Key" phải là A/B/C/D hoặc 1/2/3/4`,
          400,
        );
      }
      if (idx >= options.length) {
        throw new AppError(
          `Dòng ${rowIndex + 2}: "Correct Key" trỏ đến option không tồn tại`,
          400,
        );
      }
      options[idx].isCorrect = true;
    } else {
      // multiple_answer: correct keys cách nhau bằng dấu ";"
      const keys = (r["correct key"] || "").split(";").map((k) => k.trim().toLowerCase());
      for (const key of keys) {
        const idx = keyMap[key];
        if (idx !== undefined && idx < options.length) {
          options[idx].isCorrect = true;
        }
      }
      if (!options.some((o) => o.isCorrect)) {
        throw new AppError(
          `Dòng ${rowIndex + 2}: Multiple Answer phải có ít nhất 1 đáp án đúng`,
          400,
        );
      }
    }

    doc.options = options;
  }

  // True/False/Not Given
  if (TF_TYPES.includes(questionType)) {
    const answer = r["correct answer"] || "";
    const validMap = {
      true_false: ["True", "False"],
      true_false_not_given: ["True", "False", "Not Given"],
      yes_no_not_given: ["Yes", "No", "Not Given"],
    };
    const valid = validMap[questionType];
    const normalized = valid.find((v) => v.toLowerCase() === answer.toLowerCase());
    if (!normalized) {
      throw new AppError(
        `Dòng ${rowIndex + 2}: "Correct Answer" phải là một trong: ${valid.join(", ")}`,
        400,
      );
    }
    doc.correctAnswer = normalized;
  }

  // Matching types — format: "A:2|B:1|C:3" trong Correct Match column
  if (MATCHING_TYPES.includes(questionType)) {
    const correctMatchRaw = r["correct match"] || "";
    if (!correctMatchRaw) {
      throw new AppError(
        `Dòng ${rowIndex + 2}: Matching type cần cột "Correct Match" (vd: A:2|B:1|C:3)`,
        400,
      );
    }
    const matches = correctMatchRaw.split("|").map((pair) => {
      const [left, right] = pair.split(":").map((s) => s.trim());
      if (!left || !right) {
        throw new AppError(
          `Dòng ${rowIndex + 2}: "Correct Match" không đúng format. Dùng "leftId:rightId|leftId:rightId"`,
          400,
        );
      }
      return { leftId: left, rightId: right };
    });
    doc.correctMatches = matches;
    // Note: leftItems và rightItems cần được nhập qua form UI, không qua CSV
  }

  // Completion / Short Answer / Fill in Blank
  if (COMPLETION_TYPES.includes(questionType)) {
    const answer = r["correct answer"] || "";
    if (!answer) {
      throw new AppError(
        `Dòng ${rowIndex + 2}: "Correct Answer" không được để trống cho loại câu hỏi này`,
        400,
      );
    }
    // Nhiều đáp án chấp nhận cách nhau bằng ";"
    const answers = answer.split(";").map((a) => a.trim()).filter(Boolean);
    doc.correctAnswer = answers.length === 1 ? answers[0] : answers;
  }

  return doc;
};

/**
 * Lấy MongoDB session cho transaction (replica set).
 */
const getMongoSession = async () => {
  try {
    const { default: mongoose } = await import("mongoose");
    const conn = mongoose.connection;
    if (conn.readyState !== 1) return null;
    const replSet = conn.client?.topology?.constructor.name;
    if (replSet === "ReplSet" || replSet === "MongoClient") {
      return conn.startSession();
    }
    return null;
  } catch {
    return null;
  }
};

// ===== CRUD =====

const ensureSetExists = async (questionSetId) => {
  const set = await ReadingQuestionSet.findById(questionSetId)
    .select("_id passageId questionCount")
    .lean();
  if (!set) throw new AppError("Bộ câu hỏi không tồn tại", 404);
  return set;
};

export const getQuestionsBySet = async (questionSetId, { includeAnswers = false } = {}) => {
  await ensureSetExists(questionSetId);

  const docs = await ReadingQuestion.find({ questionSetId, isActive: true })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  if (includeAnswers) return docs;

  // Ẩn đáp án khi trả cho Mobile App
  return docs.map((q) => ({
    _id: q._id,
    questionSetId: q.questionSetId,
    passageId: q.passageId,
    questionText: q.questionText,
    questionType: q.questionType,
    contextText: q.contextText,
    locationInPassage: q.locationInPassage,
    points: q.points,
    order: q.order,
    wordLimit: q.wordLimit,
    // Ẩn isCorrect và correctAnswer
    options: q.options?.map((o) => ({ key: o.key, text: o.text })),
    leftItems: q.leftItems,
    rightItems: q.rightItems,
  }));
};

/**
 * Lấy tất cả câu hỏi của một passage (gộp từ tất cả sets) — dùng cho Mobile App.
 * Không trả về correctAnswer.
 */
export const getQuestionsByPassage = async (passageId) => {
  // Lấy tất cả set active của passage
  const sets = await ReadingQuestionSet.find({ passageId, isActive: true })
    .sort({ order: 1 })
    .select("_id")
    .lean();

  if (sets.length === 0) return [];

  const setIds = sets.map((s) => s._id);

  const docs = await ReadingQuestion.find({
    questionSetId: { $in: setIds },
    isActive: true,
  })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  // Ẩn đáp án
  return docs.map((q) => ({
    _id: q._id,
    questionSetId: q.questionSetId,
    passageId: q.passageId,
    questionText: q.questionText,
    questionType: q.questionType,
    contextText: q.contextText,
    locationInPassage: q.locationInPassage,
    points: q.points,
    order: q.order,
    wordLimit: q.wordLimit,
    options: q.options?.map((o) => ({ key: o.key, text: o.text })),
    leftItems: q.leftItems,
    rightItems: q.rightItems,
  }));
};



export const createQuestion = async (questionSetId, data) => {
  const set = await ensureSetExists(questionSetId);

  // Lấy order tự động nếu FE không gửi
  let order = data.order;
  if (order === undefined || order === null) {
    const last = await ReadingQuestion.findOne({ questionSetId })
      .sort({ order: -1 })
      .select("order")
      .lean();
    order = last ? (last.order || 0) + 1 : 0;
  }

  const doc = await ReadingQuestion.create({
    questionSetId,
    passageId: set.passageId,
    questionText: data.questionText,
    questionType: data.questionType,
    contextText: data.contextText || "",
    options: data.options || [],
    leftItems: data.leftItems || [],
    rightItems: data.rightItems || [],
    correctMatches: data.correctMatches || [],
    correctAnswer: data.correctAnswer !== undefined ? data.correctAnswer : null,
    wordLimit: data.wordLimit || null,
    caseSensitive: data.caseSensitive || false,
    explanation: data.explanation || "",
    locationInPassage: data.locationInPassage || "",
    order,
    points: data.points !== undefined ? data.points : 1,
    isActive: data.isActive !== undefined ? data.isActive : true,
  });

  // Cập nhật counter cache và hasQuestions
  await updateQuestionCount(questionSetId);
  await ReadingPassage.updateOne(
    { _id: set.passageId },
    { $set: { hasQuestions: true } },
  );

  return doc;
};

export const updateQuestion = async (questionId, data) => {
  const doc = await ReadingQuestion.findById(questionId);
  if (!doc) throw new AppError("Câu hỏi không tồn tại", 404);

  const fields = [
    "questionText", "questionType", "contextText",
    "options", "leftItems", "rightItems", "correctMatches",
    "correctAnswer", "wordLimit", "caseSensitive",
    "explanation", "locationInPassage", "order", "points", "isActive",
  ];

  for (const field of fields) {
    if (data[field] !== undefined) doc[field] = data[field];
  }

  await doc.save();
  await updateQuestionCount(doc.questionSetId);

  return doc;
};

export const deleteQuestion = async (questionId) => {
  const doc = await ReadingQuestion.findById(questionId);
  if (!doc) throw new AppError("Câu hỏi không tồn tại", 404);

  const { questionSetId, passageId } = doc;
  await doc.deleteOne();

  // Cập nhật counter và hasQuestions
  const remaining = await updateQuestionCount(questionSetId);
  if (remaining === 0) {
    // Kiểm tra xem còn set nào có câu hỏi không
    const totalActive = await ReadingQuestion.countDocuments({
      passageId,
      isActive: true,
    });
    if (totalActive === 0) {
      await ReadingPassage.updateOne({ _id: passageId }, { $set: { hasQuestions: false } });
    }
  }

  return { _id: questionId };
};

export const reorderQuestions = async (questionSetId, orders) => {
  await ensureSetExists(questionSetId);

  if (!orders || orders.length === 0) {
    throw new AppError("Danh sách thứ tự không được rỗng", 400);
  }

  // Validate không trùng order
  const orderValues = orders.map((o) => o.order);
  if (new Set(orderValues).size !== orderValues.length) {
    throw new AppError("Giá trị order không được trùng nhau", 400);
  }

  // Verify tất cả questions thuộc set này
  const existingDocs = await ReadingQuestion.find({
    _id: { $in: orders.map((o) => o.questionId) },
    questionSetId,
  })
    .select("_id")
    .lean();

  if (existingDocs.length !== orders.length) {
    throw new AppError(
      "Một số câu hỏi không tồn tại hoặc không thuộc bộ câu hỏi này",
      400,
    );
  }

  const ops = orders.map((o) => ({
    updateOne: {
      filter: { _id: o.questionId, questionSetId },
      update: { $set: { order: o.order } },
    },
  }));

  const result = await ReadingQuestion.bulkWrite(ops);
  return { updated: result.modifiedCount || 0 };
};

// ===== CSV Import =====

/**
 * Parse và validate CSV — trả kết quả preview mà không lưu DB.
 */
export const previewQuestionsFromCsv = async (fileBuffer) => {
  let records;
  try {
    const csvResult = processCsvBuffer(fileBuffer);
    records = csvResult.records;
  } catch (err) {
    throw new AppError(`CSV không hợp lệ: ${err.message}`, 400);
  }

  if (records.length === 0) {
    throw new AppError("CSV rỗng — không có dòng dữ liệu nào", 400);
  }

  if (records.length > MAX_QUESTIONS_PER_IMPORT) {
    throw new AppError(
      `Vượt quá giới hạn ${MAX_QUESTIONS_PER_IMPORT} câu hỏi mỗi lần import`,
      400,
    );
  }

  // Kiểm tra header bắt buộc
  const headerKeys = Object.keys(records[0] || {}).map((k) => k.toLowerCase());
  const hasQuestionText = headerKeys.some((k) =>
    ["question text", "question", "câu hỏi", "đề bài"].includes(k),
  );

  if (!hasQuestionText) {
    throw new AppError(
      `CSV thiếu cột câu hỏi (Yêu cầu cột "Question Text" hoặc "Question")`,
      400,
    );
  }

  const valid = [];
  const errors = [];

  records.forEach((raw, idx) => {
    try {
      const normalized = normalizeCsvRecord(raw, idx);
      valid.push({ row: idx + 2, data: normalized });
    } catch (err) {
      errors.push({ row: idx + 2, message: err.message });
    }
  });

  return {
    total: records.length,
    validCount: valid.length,
    errorCount: errors.length,
    valid,
    errors,
  };
};

/**
 * Import câu hỏi từ CSV vào database.
 * Chỉ import nếu toàn bộ dòng valid (strict mode).
 * Nếu có lỗi: trả error list, không insert.
 */
export const importQuestionsFromCsv = async (questionSetId, fileBuffer) => {
  const set = await ensureSetExists(questionSetId);
  const preview = await previewQuestionsFromCsv(fileBuffer);

  if (preview.errorCount > 0) {
    return {
      inserted: 0,
      failed: preview.errorCount,
      errors: preview.errors,
      total: preview.total,
    };
  }

  if (preview.validCount === 0) {
    throw new AppError("Không có câu hỏi hợp lệ để import", 400);
  }

  // Lấy order bắt đầu
  const lastDoc = await ReadingQuestion.findOne({ questionSetId })
    .sort({ order: -1 })
    .select("order")
    .lean();
  let nextOrder = lastDoc ? (lastDoc.order || 0) + 1 : 0;

  const docsToInsert = preview.valid.map(({ data }) => ({
    ...data,
    questionSetId,
    passageId: set.passageId,
    order: nextOrder++,
    isActive: true,
  }));

  const session = await getMongoSession();
  const insertOptions = session ? { ordered: false, session } : { ordered: false };

  const created = await ReadingQuestion.insertMany(docsToInsert, insertOptions);

  // Cập nhật counter và hasQuestions
  await updateQuestionCount(questionSetId);
  await ReadingPassage.updateOne(
    { _id: set.passageId },
    { $set: { hasQuestions: true } },
  );

  return {
    inserted: created.length,
    failed: 0,
    errors: [],
    total: preview.total,
  };
};

// ===== CSV Export + Template =====

/**
 * Export câu hỏi của một question set ra CSV buffer.
 */
export const exportQuestionsToCsv = async (questionSetId) => {
  await ensureSetExists(questionSetId);

  const questions = await ReadingQuestion.find({ questionSetId, isActive: true })
    .sort({ order: 1 })
    .lean();

  const header = "Question Type,Question Text,Context,Option A,Option B,Option C,Option D,Correct Key,Correct Match,Correct Answer,Explanation,Points,Location";

  const rows = questions.map((q) => {
    const optMap = {};
    q.options?.forEach((o) => { optMap[o.key] = o.text; });
    const correctKeys = q.options?.filter((o) => o.isCorrect).map((o) => o.key).join(";") || "";
    const correctMatch = q.correctMatches?.map((m) => `${m.leftId}:${m.rightId}`).join("|") || "";
    const correctAnswer = Array.isArray(q.correctAnswer)
      ? q.correctAnswer.join(";")
      : q.correctAnswer || "";

    const cols = [
      q.questionType,
      `"${(q.questionText || "").replace(/"/g, '""')}"`,
      `"${(q.contextText || "").replace(/"/g, '""')}"`,
      `"${(optMap["A"] || "").replace(/"/g, '""')}"`,
      `"${(optMap["B"] || "").replace(/"/g, '""')}"`,
      `"${(optMap["C"] || "").replace(/"/g, '""')}"`,
      `"${(optMap["D"] || "").replace(/"/g, '""')}"`,
      correctKeys,
      correctMatch,
      `"${correctAnswer.replace(/"/g, '""')}"`,
      `"${(q.explanation || "").replace(/"/g, '""')}"`,
      q.points || 1,
      `"${(q.locationInPassage || "").replace(/"/g, '""')}"`,
    ];

    return cols.join(",");
  });

  const csvContent = [header, ...rows].join("\n");
  return Buffer.from(csvContent, "utf-8");
};

/**
 * Tạo CSV template để hướng dẫn Admin điền câu hỏi.
 */
export const getCsvTemplate = () => {
  const header = "Question Type,Question Text,Context,Option A,Option B,Option C,Option D,Correct Key,Correct Match,Correct Answer,Explanation,Points,Location";

  const examples = [
    'multiple_choice,"Which statement about the author is TRUE?","","He was born in France","He studied in London","He wrote 3 novels","He won a Nobel Prize",B,"","","The correct answer can be found in paragraph 2.",1,"Para 2"',
    'multiple_answer,"Which TWO factors contributed to the decline?","","Cost","Location","Weather","Competition","A;D","","","Both factors are mentioned in paragraph 3.",1,"Para 3"',
    'true_false_not_given,"Global temperatures have risen by 2°C since 1900.","","","","","","","","True","See paragraph 1, line 3.",1,"Para 1"',
    'yes_no_not_given,"The writer agrees that technology improves education.","","","","","","","","Yes","Writer\'s opinion in conclusion.",1,"Conclusion"',
    'fill_in_blank,"The experiment was conducted over a period of ___ months.","","","","","","","","six;6","Both numeric and word forms accepted.",1,"Para 4"',
    'short_answer,"What was the main purpose of the study?","","","","","","","","to investigate the effects of diet","Keep answer under 5 words.",1,"Abstract"',
    'matching_heading,"Match paragraph headings.","Paragraphs: A, B, C. Headings: 1, 2, 3","","","","","","A:2|B:3|C:1","","",1,""',
    'sentence_completion,"Scientists discovered that the process requires ___.","","","","","","","","high temperatures;heat","Either phrase is accepted.",1,"Para 5"',
  ];

  return Buffer.from(`${header}\n${examples.join("\n")}\n`, "utf-8");
};
