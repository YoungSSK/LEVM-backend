import VocabularyTopic from "../models/VocabularyTopic.js";
import VocabularyLesson from "../models/VocabularyLesson.js";
import AppError from "../utils/AppError.js";
// Hàm tạo chủ đề mới
export const createTopic = async (data) => {
  const { name, description, thumbnail, lessonCount, wordCount, isActive } =
    data;
  const duplicateName = await VocabularyTopic.findOne({ name });
  if (duplicateName) {
    throw new AppError("Tên chủ đề đã tồn tại", 400);
  }
  const newTopic = await VocabularyTopic.create({
    name,
    description,
    thumbnail,
    lessonCount,
    wordCount,
    isActive,
  });
  return newTopic;
};
//Hàm lấy danh sách các topic
export const getAllTopic = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [topics, total] = await Promise.all([
    VocabularyTopic.find({ isActive: true })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VocabularyTopic.countDocuments({ isActive: true }),
  ]);
  return {
    topics,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};
//Hàm cập nhật lại chủ đề mới
export const updateTopic = async (topicId, data) => {
  const topicExist = await VocabularyTopic.findById(topicId);
  if (!topicExist) {
    throw new AppError("Topic không tồn tại", 404);
  }
  const { name, description, thumbnail } = data;
  if (name !== undefined) {
    const duplicateName = await VocabularyTopic.findOne({
      name,
      _id: { $ne: topicId },
    });
    if (duplicateName) {
      throw new AppError("Tên chủ đề đã tồn tại", 400);
    }
  }
  const updatedData = {};
  if (name !== undefined) {
    updatedData.name = name;
  }
  if (description !== undefined) {
    updatedData.description = description;
  }
  if (thumbnail !== undefined) {
    updatedData.thumbnail = thumbnail;
  }
  const updatedTopic = await VocabularyTopic.findByIdAndUpdate(
    topicId,
    updatedData,
    { new: true },
  );
  return updatedTopic;
};
//Hàm xóa chủ đề
export const deletedTopic = async (topicId) => {
  const topic = await VocabularyTopic.findByIdAndDelete(topicId);
  if (!topic) {
    throw new AppError("Topic không tồn tại", 404);
  }
  return topic;
};
//Hàm lấy chi tiết 1 chủ đề
export const getTopicById = async (topicId) => {
  const topic = await VocabularyTopic.findById(topicId).lean();
  if (!topic) {
    throw new AppError("Topic không tồn tại", 404);
  }
  return topic;
};
//Hàm thay đổi trạng thái
export const changeStatus = async (topicId, isActive) => {
  const topicExist = await VocabularyTopic.findById(topicId);
  if (!topicExist) {
    throw new AppError("Topic không tồn tại", 404);
  }

  topicExist.isActive = !isActive;

  await topicExist.save();

  return topicExist;
};
//Hàm lấy lessonCount và wordCount cả Active và Inactive
export const getTopicStatistics = async (topicId) => {
  const topic = await VocabularyTopic.findById(topicId);
  if (!topic) {
    throw new AppError("Topic không tồn tại", 404);
  }
  const totalLesson = await VocabularyLesson.countDocuments({ topicId });
  const activeLesson = await VocabularyLesson.countDocuments({
    topicId,
    isActive: true,
  });
  const lessons = await VocabularyLesson.find({ topicId }).select(
    "_id wordCount isActive",
  );
  const totalWord = lessons.reduce((sum, lesson) => sum + lesson.wordCount, 0);
  const activeWord = lessons
    .filter((lesson) => lesson.isActive)
    .reduce((sum, lesson) => sum + lesson.wordCount, 0);
  return {
    totalLesson,
    activeLesson,
    inactiveLesson: totalLesson - activeLesson,
    totalWord,
    activeWord,
    inactiveWord: totalWord - activeWord,
  };
};
