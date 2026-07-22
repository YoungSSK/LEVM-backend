import GrammarQuizQuestion from "../models/GrammarQuizQuestion.js";
import GrammarLesson from "../models/GrammarLesson.js";
import mongoose from "mongoose";
import { parse } from "csv-parse/sync";
import AppError from "../utils/AppError.js";
import {
  grantRewardsIfFirstPass,
  saveQuizAttempt,
} from "./gamificationService.js";

const MAX_QUESTIONS_PER_IMPORT = 500;

// Header CSV theo format: Question, Option A, Option B, Option C, Option D,
// Correct Option, Explanation. correctOption là chữ cái (A/B/C/D) hoặc số 1..4.
const CSV_HEADERS_LOWER = [
  "question",
  "option a",
  "option b",
  "option c",
  "option d",
  "correct option",
  "explanation",
];

// Map "Correct Option" -> index 0..3. Chấp nhận "A".."D" hoặc "1".."4".
const CORRECT_OPTION_BY_KEY = {
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
};

/**
 * Decode buffer CSV về string UTF-8.
 * Hỗ trợ:
 *   - UTF-8 BOM / UTF-16 LE BOM / UTF-16 BE BOM
 *   - UTF-8 thuần (có thể có dấu tiếng Việt)
 *   - Fallback latin1 (Windows-1252) khi user save từ Excel Windows — vẫn
 *     giữ được phần lớn ký tự tiếng Việt thường gặp.
 */
const decodeCsvBuffer = (buffer) => {
  // UTF-8 BOM: EF BB BF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    return new TextDecoder("utf-8").decode(buffer.subarray(3));
  }
  // UTF-16 LE BOM: FF FE
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buffer.subarray(2));
  }
  // UTF-16 BE BOM: FE FF
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buffer.subarray(2));
  }
  // Thử UTF-8 fatal trước (chính xác nhất)
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    // Fallback: latin1 — vẫn đọc được nội dung CSV, ký tự ngoài latin1 sẽ
    // hiển thị lỗi nhẹ nhưng header + câu hỏi ASCII vẫn parse được.
    return new TextDecoder("latin1").decode(buffer);
  }
};

const validateCsvStructure = (records, rawHeader) => {
  const headerLower = rawHeader.map((h) => String(h).trim().toLowerCase());
  const missing = CSV_HEADERS_LOWER.filter((h) => !headerLower.includes(h));
  if (missing.length > 0) {
    throw new AppError(
      `CSV thiếu cột bắt buộc: ${missing.join(", ")}. ` +
        `Yêu cầu: ${CSV_HEADERS_LOWER.join(", ")}`,
      400,
    );
  }

  if (records.length > MAX_QUESTIONS_PER_IMPORT) {
    throw new AppError(
      `Vượt quá giới hạn ${MAX_QUESTIONS_PER_IMPORT} câu hỏi mỗi lần import. ` +
        `File của bạn có ${records.length} dòng.`,
      400,
    );
  }

  if (records.length === 0) {
    throw new AppError("CSV rỗng — không có dòng dữ liệu nào", 400);
  }
};

/**
 * Helper: chuẩn hoá 1 record từ CSV.
 * Header kỳ vọng (không phân biệt hoa thường):
 *   Question, Option A, Option B, Option C, Option D, Correct Option, Explanation
 * - Correct Option: chữ cái (A/B/C/D) hoặc số 1..4.
 * - Cả 4 cột Option A..D đều phải có nội dung.
 * - Escaped commas/quotes trong CSV được xử lý bởi csv-parse (bật relax_quotes).
 * Trả về shape phù hợp với GrammarQuizQuestion.
 * Validate: question không rỗng, 4 option không rỗng, đúng 1 isCorrect.
 */
const normalizeCsvRecord = (raw, rowIndex) => {
  const lower = {};
  Object.keys(raw).forEach((k) => {
    if (k) lower[k.trim().toLowerCase()] = raw[k];
  });

  const question = (lower.question || "").trim();
  if (!question) {
    throw new AppError(
      `Dòng ${rowIndex + 2}: thiếu cột "Question" hoặc Question rỗng`,
      400,
    );
  }

  // Cố định 4 option A..D, tất cả phải có nội dung.
  const optionCols = ["option a", "option b", "option c", "option d"].map((k) =>
    (lower[k] || "").trim(),
  );

  for (let i = 0; i < optionCols.length; i++) {
    if (!optionCols[i]) {
      const letter = String.fromCharCode(65 + i); // A, B, C, D
      throw new AppError(
        `Dòng ${rowIndex + 2}: cột "Option ${letter}" không được trống`,
        400,
      );
    }
  }

  const correctRaw = (lower["correct option"] || "").trim();
  const correctIdx0 = CORRECT_OPTION_BY_KEY[correctRaw.toLowerCase()];
  if (correctIdx0 === undefined) {
    throw new AppError(
      `Dòng ${rowIndex + 2}: "Correct Option" phải là A/B/C/D hoặc 1..4`,
      400,
    );
  }

  const options = optionCols.map((text, i) => ({
    text,
    isCorrect: i === correctIdx0,
  }));

  if (options.filter((o) => o.isCorrect).length !== 1) {
    throw new AppError(
      `Dòng ${rowIndex + 2}: validate đáp án đúng thất bại`,
      400,
    );
  }

  return {
    questionText: question,
    options,
    explanation: (lower.explanation || "").trim(),
  };
};

const ensureLessonExists = async (lessonId) => {
  const lesson = await GrammarLesson.findById(lessonId).select(
    "_id hasQuiz topicId title",
  );
  if (!lesson) throw new AppError("Bài học không tồn tại", 404);
  return lesson;
};

// ============ Admin CRUD ============

export const listQuizQuestionsByLesson = async (
  lessonId,
  { includeAnswers = false } = {},
) => {
  await ensureLessonExists(lessonId);
  const docs = await GrammarQuizQuestion.find({ lessonId, isActive: true })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  if (includeAnswers) return docs;

  // Ẩn isCorrect và explanation khi trả cho app client (Bước 4 sẽ dùng).
  return docs.map((d) => ({
    _id: d._id,
    lessonId: d.lessonId,
    questionText: d.questionText,
    options: d.options.map((o) => ({ text: o.text })),
    order: d.order,
  }));
};

export const createQuizQuestion = async (lessonId, data) => {
  await ensureLessonExists(lessonId);

  // Nếu FE không gửi order -> lấy max(order) + 1.
  let order = data.order;
  if (order === undefined || order === null) {
    const last = await GrammarQuizQuestion.findOne({ lessonId })
      .sort({ order: -1 })
      .select("order")
      .lean();
    order = last ? (last.order || 0) + 1 : 0;
  }

  const doc = await GrammarQuizQuestion.create({
    lessonId,
    questionText: data.questionText,
    options: data.options,
    explanation: data.explanation || "",
    order,
    isActive: data.isActive !== undefined ? data.isActive : true,
  });

  // Bật hasQuiz trên lesson.
  await GrammarLesson.updateOne({ _id: lessonId }, { $set: { hasQuiz: true } });

  return doc;
};

export const updateQuizQuestion = async (questionId, data) => {
  const doc = await GrammarQuizQuestion.findById(questionId);
  if (!doc) throw new AppError("Câu hỏi không tồn tại", 404);

  if (data.questionText !== undefined) doc.questionText = data.questionText;
  if (data.options !== undefined) doc.options = data.options;
  if (data.explanation !== undefined) doc.explanation = data.explanation;
  if (data.order !== undefined) doc.order = data.order;
  if (data.isActive !== undefined) doc.isActive = data.isActive;

  await doc.save();
  return doc;
};

export const deleteQuizQuestion = async (questionId) => {
  const doc = await GrammarQuizQuestion.findById(questionId);
  if (!doc) throw new AppError("Câu hỏi không tồn tại", 404);
  await doc.deleteOne();

  // Nếu sau khi xoá, lesson không còn câu nào active -> tắt hasQuiz.
  const remaining = await GrammarQuizQuestion.countDocuments({
    lessonId: doc.lessonId,
    isActive: true,
  });
  if (remaining === 0) {
    await GrammarLesson.updateOne(
      { _id: doc.lessonId },
      { $set: { hasQuiz: false } },
    );
  }

  return { _id: questionId };
};

export const reorderQuizQuestions = async (lessonId, orders) => {
  await ensureLessonExists(lessonId);

  if (!orders || orders.length === 0) {
    throw new AppError("Danh sách thứ tự không được rỗng", 400);
  }

  // Validate: order bắt đầu từ 1, liên tục, không trùng, không thiếu/thừa.
  const ordersSet = new Set(orders.map((o) => o.order));
  const idsSet = new Set(orders.map((o) => String(o.questionId)));

  if (ordersSet.size !== orders.length) {
    throw new AppError("Giá trị order không được trùng nhau", 400);
  }

  const minOrder = Math.min(...orders.map((o) => o.order));
  const maxOrder = Math.max(...orders.map((o) => o.order));
  if (minOrder < 1) {
    throw new AppError("Giá trị order phải bắt đầu từ 1", 400);
  }
  if (maxOrder - minOrder + 1 !== orders.length) {
    throw new AppError(
      "Giá trị order phải liên tục (không thiếu, không thừa)",
      400,
    );
  }

  // Verify all IDs belong to this lesson and exist.
  const existingDocs = await GrammarQuizQuestion.find({
    _id: { $in: orders.map((o) => o.questionId) },
    lessonId,
  })
    .select("_id")
    .lean();

  if (existingDocs.length !== orders.length) {
    throw new AppError(
      "Một số câu hỏi không tồn tại hoặc không thuộc bài học này",
      400,
    );
  }

  const ops = orders.map((o) => ({
    updateOne: {
      filter: { _id: o.questionId, lessonId },
      update: { $set: { order: o.order } },
    },
  }));

  const result = await GrammarQuizQuestion.bulkWrite(ops);
  return { updated: result.modifiedCount || 0 };
};

export const importQuizFromCsv = async (lessonId, fileBuffer) => {
  await ensureLessonExists(lessonId);

  // 1. Decode buffer về string UTF-8 (hỗ trợ BOM UTF-8/UTF-16, fallback latin1).
  const rawText = decodeCsvBuffer(fileBuffer);

  let records, rawHeader;
  try {
    rawHeader = rawText
      .split(/\r?\n/)[0]
      .split(",")
      .map((h) => h.trim());
    const parsed = parse(rawText, {
      columns: (header) => header.map((h) => h.trim()),
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });
    records = parsed;
  } catch (err) {
    throw new AppError(`CSV không hợp lệ: ${err.message}`, 400);
  }

  // 2. Validate cấu trúc CSV (header, giới hạn, rỗng).
  validateCsvStructure(records, rawHeader);

  // 3. Validate từng dòng — toàn bộ phải hợp lệ mới insert.
  const errors = [];
  const validDocs = [];

  records.forEach((raw, idx) => {
    try {
      const normalized = normalizeCsvRecord(raw, idx);
      validDocs.push(normalized);
    } catch (err) {
      errors.push({ row: idx + 2, message: err.message });
    }
  });

  if (validDocs.length === 0) {
    throw new AppError(
      `Không import được câu nào. Lỗi: ${JSON.stringify(errors.slice(0, 5))}`,
      400,
    );
  }

  // 4. Insert với transaction nếu MongoDB hỗ trợ (replica set).
  const session = await getMongoSession();
  const lastOrder = await GrammarQuizQuestion.findOne({ lessonId })
    .sort({ order: -1 })
    .select("order")
    .lean()
    .session(session);

  let nextOrder = lastOrder ? (lastOrder.order || 0) + 1 : 0;
  const docsToInsert = validDocs.map((d) => ({
    ...d,
    lessonId,
    order: nextOrder++,
    isActive: true,
  }));

  const created = await GrammarQuizQuestion.insertMany(docsToInsert, {
    ordered: false,
    session,
  });

  // 5. Bật hasQuiz.
  await GrammarLesson.updateOne(
    { _id: lessonId },
    { $set: { hasQuiz: true } },
  ).session(session);

  return {
    inserted: created.length,
    failed: errors.length,
    errors: errors.slice(0, 5), // trả tối đa 5 lỗi
    total: records.length,
  };
};

/**
 * Lấy MongoDB session cho transaction (replica set).
 * Nếu không phải replica set → trả null (insertMany sẽ không dùng session).
 */
const getMongoSession = async () => {
  try {
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

export const getCsvTemplate = () => {
  // Trả buffer cho controller stream xuống FE.
  // Header PHẢI khớp validateCsvStructure (CSV_HEADERS_LOWER):
  // Question, Option A, Option B, Option C, Option D, Correct Option, Explanation
  // Dùng ký tự ASCII cho sample rows để tránh corrupt khi round-trip blob.
  const header =
    "Question,Option A,Option B,Option C,Option D,Correct Option,Explanation";
  const sample1 =
    '"What is the past tense of ""go""?","goed","went","gone","going",B,"""Went"" is the past tense of ""go""."';
  const sample2 =
    '"Choose the correct article: ___ apple a day keeps the doctor away.","a","an","the","some",B,"Use ""an"" before a vowel sound."';
  return Buffer.from(`${header}\n${sample1}\n${sample2}\n`, "utf-8");
};

/**
 ============ Submit quiz (user/mobile) ============

 * @param {string} userId
 * @param {string} lessonId
 * @param {Array<{questionId, selectedOptionIndex}>} submittedAnswers
 * Trả về:
 * {
 *   score, isPassed, passThreshold,
 *   xpEarned, newXp, newStreak, longestStreak, streakUpdated, isFirstCompletionToday, alreadyPassed,
 *   result: [
 *     { questionId, isCorrect, correctIndex, explanation, selectedIndex }
 *   ]
 * }
 */
export const submitQuizAttempt = async (userId, lessonId, submittedAnswers) => {
  const lesson = await GrammarLesson.findById(lessonId);
  if (!lesson) throw new AppError("Bài học không tồn tại", 404);

  // Validation: lesson phải active, published, và có quiz mới cho submit.
  if (!lesson.isActive) {
    throw new AppError("Bài học hiện không hoạt động", 403);
  }
  if (!lesson.isPublished) {
    throw new AppError("Bài học chưa được xuất bản", 403);
  }
  if (!lesson.hasQuiz) {
    throw new AppError("Bài học chưa có câu hỏi trắc nghiệm", 400);
  }

  const questions = await GrammarQuizQuestion.find({
    lessonId,
    isActive: true,
  })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  if (questions.length === 0) {
    throw new AppError("Bài học chưa có câu hỏi nào", 400);
  }

  // Map câu trả lời của user theo questionId.
  const answerMap = new Map();
  for (const a of submittedAnswers || []) {
    answerMap.set(String(a.questionId), a.selectedOptionIndex);
  }

  let correctCount = 0;
  const result = questions.map((q) => {
    const selectedIndex = answerMap.has(String(q._id))
      ? answerMap.get(String(q._id))
      : -1;
    const correctIndex = q.options.findIndex((o) => o.isCorrect === true);
    const isCorrect = selectedIndex !== -1 && selectedIndex === correctIndex;
    if (isCorrect) correctCount++;
    return {
      questionId: String(q._id),
      selectedIndex,
      correctIndex,
      isCorrect,
      explanation: q.explanation || "",
    };
  });

  const total = questions.length;
  const score = Math.round((correctCount / total) * 100 * 100) / 100;
  const passThreshold = lesson.passThreshold ?? 70;
  const isPassed = score >= passThreshold;

  // Áp dụng thưởng nếu pass (idempotent — không cộng 2 lần cùng lesson).
  let rewards = {
    isPassed,
    xpEarned: 0,
    newXp: undefined,
    newStreak: undefined,
    longestStreak: undefined,
    streakUpdated: false,
    isFirstCompletionToday: false,
    alreadyPassed: false,
  };

  if (isPassed) {
    const r = await grantRewardsIfFirstPass(userId, lesson, true);
    rewards = {
      isPassed: true,
      xpEarned: r.xpEarned,
      newXp: r.newXp,
      newStreak: r.newStreak,
      longestStreak: r.longestStreak,
      streakUpdated: r.streakUpdated,
      isFirstCompletionToday: r.isFirstCompletionToday,
      alreadyPassed: r.isFirstCompletionToday === false && r.xpEarned === 0,
    };
  }

  // Lưu attempt (kể cả fail — phục vụ thống kê).
  await saveQuizAttempt({
    userId,
    lessonId,
    answers: result.map((r) => ({
      questionId: r.questionId,
      selectedOptionIndex: r.selectedIndex,
      isCorrect: r.isCorrect,
    })),
    score,
    isPassed,
    xpEarned: rewards.xpEarned,
    isFirstCompletionToday: rewards.isFirstCompletionToday,
  });

  return {
    lessonId: String(lesson._id),
    score,
    passThreshold,
    isPassed,
    result,
    ...rewards,
  };
};
