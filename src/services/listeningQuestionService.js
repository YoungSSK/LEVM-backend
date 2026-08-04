import ListeningSet from "../models/ListeningSet.js";
import ListeningAudioGroup from "../models/ListeningAudioGroup.js";
import ListeningQuestion from "../models/ListeningQuestion.js";
import * as cloudinaryService from "./cloudinaryService.js";
import AppError from "../utils/AppError.js";

// ================= AUDIO GROUPS (Part 3 & 4) =================

/**
 * Create a new audio group for Part 3 & 4
 */
export const createAudioGroup = async (groupData) => {
  const set = await ListeningSet.findById(groupData.setId);
  if (!set) {
    throw new AppError("Không tìm thấy bài luyện nghe", 404);
  }
  if (set.part !== 3 && set.part !== 4) {
    throw new AppError("Audio Group chỉ áp dụng cho Part 3 và Part 4", 400);
  }

  const group = await ListeningAudioGroup.create(groupData);
  return group;
};

/**
 * Update an existing audio group
 */
export const updateAudioGroup = async (groupId, updateData) => {
  const group = await ListeningAudioGroup.findById(groupId);
  if (!group) {
    throw new AppError("Không tìm thấy Audio Group", 404);
  }

  // If audioPublicId changed, cleanup old Cloudinary file
  if (updateData.audioPublicId && group.audioPublicId && updateData.audioPublicId !== group.audioPublicId) {
    cloudinaryService.deleteFile(group.audioPublicId, "video").catch(() => {});
  }
  // If imagePublicId changed, cleanup old Cloudinary file
  if (updateData.imagePublicId && group.imagePublicId && updateData.imagePublicId !== group.imagePublicId) {
    cloudinaryService.deleteFile(group.imagePublicId, "image").catch(() => {});
  }

  Object.assign(group, updateData);
  await group.save();
  return group;
};

/**
 * Delete audio group with cascade delete of child questions and Cloudinary media
 */
export const deleteAudioGroup = async (groupId) => {
  const group = await ListeningAudioGroup.findById(groupId);
  if (!group) {
    throw new AppError("Không tìm thấy Audio Group", 404);
  }

  // Clean Cloudinary media
  if (group.audioPublicId) {
    cloudinaryService.deleteFile(group.audioPublicId, "video").catch(() => {});
  }
  if (group.imagePublicId) {
    cloudinaryService.deleteFile(group.imagePublicId, "image").catch(() => {});
  }

  // Find child questions to clean their Cloudinary media
  const childQuestions = await ListeningQuestion.find({ groupId }).lean();
  for (const q of childQuestions) {
    if (q.audioPublicId) cloudinaryService.deleteFile(q.audioPublicId, "video").catch(() => {});
    if (q.imagePublicId) cloudinaryService.deleteFile(q.imagePublicId, "image").catch(() => {});
  }

  await Promise.all([
    ListeningQuestion.deleteMany({ groupId }),
    ListeningAudioGroup.findByIdAndDelete(groupId),
  ]);

  return { success: true, message: "Đã xóa Audio Group và toàn bộ câu hỏi liên quan" };
};

// ================= LISTENING QUESTIONS =================

/**
 * Create a new listening question
 */
export const createQuestion = async (questionData) => {
  const set = await ListeningSet.findById(questionData.setId);
  if (!set) {
    throw new AppError("Không tìm thấy bài luyện nghe", 404);
  }

  // Validate groupId matches set if Part 3 or 4
  if (set.part === 3 || set.part === 4) {
    if (!questionData.groupId) {
      throw new AppError("Part 3 & Part 4 yêu cầu phải chỉ định Audio Group (groupId)", 400);
    }
    const group = await ListeningAudioGroup.findById(questionData.groupId);
    if (!group || String(group.setId) !== String(set._id)) {
      throw new AppError("Audio Group không hợp lệ hoặc không thuộc về bài nghe này", 400);
    }
  }

  // Auto-calculate order if not provided
  if (questionData.order === undefined || questionData.order === null) {
    const filter = questionData.groupId ? { groupId: questionData.groupId } : { setId: questionData.setId };
    const maxOrderQ = await ListeningQuestion.findOne(filter).sort({ order: -1 }).select("order").lean();
    questionData.order = maxOrderQ ? maxOrderQ.order + 1 : 1;
  }

  const question = await ListeningQuestion.create({
    ...questionData,
    part: set.part,
  });

  return question;
};

/**
 * Update an existing listening question
 */
export const updateQuestion = async (questionId, updateData) => {
  const question = await ListeningQuestion.findById(questionId);
  if (!question) {
    throw new AppError("Không tìm thấy câu hỏi", 404);
  }

  // If Cloudinary publicIds updated, clean old files
  if (updateData.audioPublicId && question.audioPublicId && updateData.audioPublicId !== question.audioPublicId) {
    cloudinaryService.deleteFile(question.audioPublicId, "video").catch(() => {});
  }
  if (updateData.imagePublicId && question.imagePublicId && updateData.imagePublicId !== question.imagePublicId) {
    cloudinaryService.deleteFile(question.imagePublicId, "image").catch(() => {});
  }

  Object.assign(question, updateData);
  await question.save();
  return question;
};

/**
 * Delete a listening question
 */
export const deleteQuestion = async (questionId) => {
  const question = await ListeningQuestion.findById(questionId);
  if (!question) {
    throw new AppError("Không tìm thấy câu hỏi", 404);
  }

  if (question.audioPublicId) {
    cloudinaryService.deleteFile(question.audioPublicId, "video").catch(() => {});
  }
  if (question.imagePublicId) {
    cloudinaryService.deleteFile(question.imagePublicId, "image").catch(() => {});
  }

  await ListeningQuestion.findByIdAndDelete(questionId);
  return { success: true, message: "Xóa câu hỏi thành công" };
};

/**
 * Get questions for a specific audio group (Admin CMS)
 */
export const getQuestionsByGroupId = async (groupId) => {
  const questions = await ListeningQuestion.find({ groupId, isActive: true })
    .sort({ order: 1, createdAt: 1 })
    .lean();
  return questions;
};

/**
 * Get questions for a specific set (Admin CMS)
 */
export const getQuestionsBySetId = async (setId) => {
  const questions = await ListeningQuestion.find({ setId, isActive: true })
    .sort({ order: 1, createdAt: 1 })
    .lean();
  return questions;
};

/**
 * SECURITY CRITICAL: Get play payload for Learner.
 * STRIPS OUT `isCorrect` field from options array!
 */
export const getPlayPayload = async (setId) => {
  const set = await ListeningSet.findOne({ _id: setId, status: "published" }).lean();
  if (!set) {
    throw new AppError("Bài nghe không tồn tại hoặc chưa được xuất bản", 404);
  }

  let groups = [];
  if (set.part === 3 || set.part === 4) {
    groups = await ListeningAudioGroup.find({ setId, isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select("-createdAt -updatedAt -__v")
      .lean();
  }

  const rawQuestions = await ListeningQuestion.find({ setId, isActive: true })
    .sort({ order: 1, createdAt: 1 })
    .select("-createdAt -updatedAt -__v")
    .lean();

  // Strip `isCorrect` and `explanation` from each question's options for learner play mode
  const safeQuestions = rawQuestions.map((q) => {
    const { explanation, ...safeQ } = q;
    return {
      ...safeQ,
      options: safeQ.options.map((opt) => ({
        key: opt.key,
        text: opt.text,
        // CRITICAL: `isCorrect` IS OMITTED HERE
      })),
    };
  });

  return {
    set: {
      _id: set._id,
      title: set.title,
      part: set.part,
      difficulty: set.difficulty,
      passThreshold: set.passThreshold,
      xpReward: set.xpReward,
    },
    groups,
    questions: safeQuestions,
  };
};
