import ListeningSet from "../models/ListeningSet.js";
import ListeningAudioGroup from "../models/ListeningAudioGroup.js";
import ListeningQuestion from "../models/ListeningQuestion.js";
import ListeningAttempt from "../models/ListeningAttempt.js";
import * as cloudinaryService from "./cloudinaryService.js";
import AppError from "../utils/AppError.js";

/**
 * Get list of listening sets with filtering & pagination
 */
export const getListeningSets = async (query = {}) => {
  const { part, status, difficulty, page = 1, limit = 20 } = query;
  const filter = {};

  if (part) filter.part = Number(part);
  if (status) filter.status = status;
  if (difficulty) filter.difficulty = difficulty;

  const skip = (Number(page) - 1) * Number(limit);

  const [sets, total] = await Promise.all([
    ListeningSet.find(filter)
      .populate({ path: "allowedPackageIds", select: "name slug level price" })
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    ListeningSet.countDocuments(filter),
  ]);

  // Attach total questions count for each set
  const setIds = sets.map((s) => s._id);
  const questionCounts = await ListeningQuestion.aggregate([
    { $match: { setId: { $in: setIds }, isActive: true } },
    { $group: { _id: "$setId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(questionCounts.map((q) => [String(q._id), q.count]));

  const data = sets.map((set) => ({
    ...set,
    questionCount: countMap.get(String(set._id)) || 0,
  }));

  return {
    sets: data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Get full listening set details for Admin (including groups & questions)
 */
export const getListeningSetByIdAdmin = async (setId) => {
  const set = await ListeningSet.findById(setId).lean();
  if (!set) {
    throw new AppError("Không tìm thấy bài luyện nghe", 404);
  }

  // Fetch groups if Part 3 or 4
  let groups = [];
  if (set.part === 3 || set.part === 4) {
    groups = await ListeningAudioGroup.find({ setId })
      .sort({ order: 1, createdAt: 1 })
      .lean();
  }

  // Fetch all questions
  const questions = await ListeningQuestion.find({ setId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return {
    ...set,
    groups,
    questions,
  };
};

/**
 * Create a new listening set
 */
export const createListeningSet = async (setData, userId) => {
  const newSet = await ListeningSet.create({
    ...setData,
    createdBy: userId,
    updatedBy: userId,
  });
  return newSet;
};

/**
 * Update an existing listening set
 */
export const updateListeningSet = async (setId, updateData, userId) => {
  const set = await ListeningSet.findById(setId);
  if (!set) {
    throw new AppError("Không tìm thấy bài luyện nghe", 404);
  }

  Object.assign(set, updateData, { updatedBy: userId });
  await set.save();
  return set;
};

/**
 * Delete listening set with cascade delete & Cloudinary cleanup
 * Rule: If set is published and has attempts, prevent hard delete (recommend archiving instead).
 */
export const deleteListeningSet = async (setId) => {
  const set = await ListeningSet.findById(setId);
  if (!set) {
    throw new AppError("Không tìm thấy bài luyện nghe", 404);
  }

  // Check if attempts exist for this set
  const attemptCount = await ListeningAttempt.countDocuments({ setId });
  if (attemptCount > 0 && set.status === "published") {
    throw new AppError(
      `Bài nghe này đã có ${attemptCount} lượt học viên làm bài. Không thể xóa cứng! Vui lòng chuyển trạng thái bài nghe sang "archived" (lưu trữ) để giữ nguyên lịch sử làm bài.`,
      400
    );
  }

  // Find all groups and questions to cleanup Cloudinary files
  const [groups, questions] = await Promise.all([
    ListeningAudioGroup.find({ setId }).lean(),
    ListeningQuestion.find({ setId }).lean(),
  ]);

  // Clean Cloudinary media
  const cloudinaryDeletePromises = [];

  // Group media
  for (const group of groups) {
    if (group.audioPublicId) {
      cloudinaryDeletePromises.push(cloudinaryService.deleteFile(group.audioPublicId, "video").catch(() => {}));
    }
    if (group.imagePublicId) {
      cloudinaryDeletePromises.push(cloudinaryService.deleteFile(group.imagePublicId, "image").catch(() => {}));
    }
  }

  // Question media
  for (const q of questions) {
    if (q.audioPublicId) {
      cloudinaryDeletePromises.push(cloudinaryService.deleteFile(q.audioPublicId, "video").catch(() => {}));
    }
    if (q.imagePublicId) {
      cloudinaryDeletePromises.push(cloudinaryService.deleteFile(q.imagePublicId, "image").catch(() => {}));
    }
  }

  await Promise.all(cloudinaryDeletePromises);

  // Cascade delete DB documents
  await Promise.all([
    ListeningQuestion.deleteMany({ setId }),
    ListeningAudioGroup.deleteMany({ setId }),
    ListeningSet.findByIdAndDelete(setId),
  ]);

  return { success: true, message: "Đã xóa thành công bài nghe và toàn bộ tài nguyên liên quan" };
};

/**
 * Reorder audio groups within a set
 */
export const reorderGroups = async (setId, items) => {
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id, setId },
      update: { $set: { order: item.order } },
    },
  }));

  if (bulkOps.length > 0) {
    await ListeningAudioGroup.bulkWrite(bulkOps);
  }
  return { success: true };
};

/**
 * Reorder questions within a set/group
 */
export const reorderQuestions = async (setId, items) => {
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id, setId },
      update: { $set: { order: item.order } },
    },
  }));

  if (bulkOps.length > 0) {
    await ListeningQuestion.bulkWrite(bulkOps);
  }
  return { success: true };
};
