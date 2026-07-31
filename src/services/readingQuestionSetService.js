import ReadingQuestionSet from "../models/ReadingQuestionSet.js";
import ReadingQuestion from "../models/ReadingQuestion.js";
import ReadingPassage from "../models/ReadingPassage.js";
import AppError from "../utils/AppError.js";

/**
 * Cập nhật questionCount của một question set.
 * Đếm số câu hỏi active trong set.
 */
export const updateQuestionCount = async (setId) => {
  const count = await ReadingQuestion.countDocuments({
    questionSetId: setId,
    isActive: true,
  });
  await ReadingQuestionSet.findByIdAndUpdate(setId, { questionCount: count });
  return count;
};

/**
 * Đảm bảo passage tồn tại và active.
 */
const ensurePassageExists = async (passageId) => {
  const passage = await ReadingPassage.findById(passageId).select("_id status hasQuestions").lean();
  if (!passage) throw new AppError("Bài đọc không tồn tại", 404);
  return passage;
};

// ============ CRUD ============

export const createQuestionSet = async (passageId, data) => {
  await ensurePassageExists(passageId);

  const set = await ReadingQuestionSet.create({
    passageId,
    title: data.title || "Default Question Set",
    setType: data.setType || "practice",
    description: data.description || "",
    order: data.order || 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    xpReward: data.xpReward !== undefined ? data.xpReward : null,
    passThreshold: data.passThreshold !== undefined ? data.passThreshold : null,
    timeLimit: data.timeLimit !== undefined ? data.timeLimit : null,
  });

  return set;
};

export const updateQuestionSet = async (setId, data) => {
  const set = await ReadingQuestionSet.findById(setId);
  if (!set) throw new AppError("Bộ câu hỏi không tồn tại", 404);

  const fields = ["title", "setType", "description", "order", "isActive", "xpReward", "passThreshold", "timeLimit"];
  for (const field of fields) {
    if (data[field] !== undefined) set[field] = data[field];
  }

  await set.save();
  return set;
};

export const deleteQuestionSet = async (setId) => {
  const set = await ReadingQuestionSet.findById(setId);
  if (!set) throw new AppError("Bộ câu hỏi không tồn tại", 404);

  const passageId = set.passageId;

  // Xóa tất cả câu hỏi trong set
  await ReadingQuestion.deleteMany({ questionSetId: setId });
  await set.deleteOne();

  // Cập nhật hasQuestions cho passage
  const remaining = await ReadingQuestion.countDocuments({
    passageId,
    isActive: true,
  });
  await ReadingPassage.findByIdAndUpdate(passageId, {
    hasQuestions: remaining > 0,
  });

  return set;
};

export const getQuestionSetsByPassage = async (passageId) => {
  await ensurePassageExists(passageId);

  let sets = await ReadingQuestionSet.find({ passageId, isActive: true })
    .sort({ order: 1 })
    .lean();

  if (sets.length === 0) {
    const defaultSet = await ReadingQuestionSet.create({
      passageId,
      title: "Bộ câu hỏi mặc định",
      setType: "practice",
      order: 0,
    });
    sets = [defaultSet.toObject ? defaultSet.toObject() : defaultSet];
  }

  return sets;
};

/**
 * Lấy question set mặc định (đầu tiên theo order).
 * Nếu không có, tự động tạo set mặc định.
 */
export const getOrCreateDefaultQuestionSet = async (passageId) => {
  await ensurePassageExists(passageId);

  let set = await ReadingQuestionSet.findOne({ passageId, isActive: true })
    .sort({ order: 1 })
    .lean();

  if (!set) {
    set = await ReadingQuestionSet.create({
      passageId,
      title: "Practice Questions",
      setType: "practice",
      order: 0,
    });
  }

  return set;
};
