import GrammarTopic from "../models/GrammarTopic.js";
import GrammarLesson from "../models/GrammarLesson.js";
import AppError from "../utils/AppError.js";
import slugify from "slugify";
// TẠO CHỦ ĐỀ NGỮ PHÁP MỚI
export const createGrammarTopic = async (data) => {
  const { name, slug, description, order, lessonCount, isActive } = data;
  //Kiểm tra trùng tên
  const duplicateName = await GrammarTopic.findOne({ name });
  if (duplicateName) {
    throw new AppError("Tên chủ đề đã tồn tại", 400);
  }
  //Tạo slug
  const slug = slugify(name, { lower: true, strict: true, locale: "vi" });
  const newTopic = await GrammarTopic.create({
    name,
    slug,
    description,
    order,
    isActive,
  });
  return newTopic;
};

// CẬP NHẬT THÔNG TIN CHỦ ĐỀ NGỮ PHÁP
export const updateGrammarTopic = async (topicId, data) => {
  const topicExist = GrammarTopic.findById(topicId);
  if (!topicExist) {
    throw new AppError("Chủ đề không tồn tại", 404);
  }
  const updatedData = {};
  if (data.name !== undefined) {
    const duplicateName = await GrammarTopic.findOne({
      name: data.name,
      _id: { $ne: topicId },
    });
    if (duplicateName) {
      throw new AppError("Tên chủ đề đã tồn tại", 400);
    }
    const slug = slugify(data.name, {
      lower: true,
      strict: true,
      locale: "vi",
    });
    const duplicateSlug = await GrammarTopic.findOne({
      slug,
      _id: { $ne: topicId },
    });
    if (duplicateSlug) {
      throw new AppError("Slug đã tồn tại", 400);
    }
    updatedData.name = data.name;
    updatedData.slug = data.slug;
  }
  if (data.description !== undefined) {
    updatedData.description = data.description;
  }
  if (data.order !== undefined) {
    updatedData.order = order;
  }
  if (data.isActive !== undefined) {
    updatedData.isActive = data.isActive;
  }
  const updatedTopic = await GrammarTopic.findByIdAndUpdate(
    topicId,
    updatedData,
    { new: true },
  );
  return updatedTopic;
};

// XÓA CHỦ ĐỀ NGỮ PHÁP
export const deleteGrammarTopic = async (topicId) => {
  const topic = await GrammarTopic.findById(topicId);
  if (!topic) {
    throw new AppError("Chủ đề không tồn tại", 404);
  }
  const lessonCount = await GrammarLesson.countDocuments({ topicId });
  if (lessonCount > 0) {
    throw new AppError("Không thể xóa chủ đề đang chứa bài học", 400);
  }
  await topic.deleteOne();
  return topic;
};

// LẤY CHI TIẾT CHỦ ĐỀ NGỮ PHÁP THEO ID
export const getGrammarTopicById = async (topicId) => {
  const topic = await GrammarTopic.findById(topicId).lean();
  if (!topic) {
    throw new AppError("Chủ đề không tồn tại", 404);
  }
  const lesson = await GrammarLesson.find({ topicId, isActive: true })
    .sort({
      order: 1,
    })
    .lean();
};

// LẤY CHI TIẾT CHỦ ĐỀ NGỮ PHÁP THEO SLUG
export const getGrammarTopicBySlug = async (slug) => {
  const topic = await GrammarTopic.findOne({ slug, isActive: true }).lean();
};

// LẤY DANH SÁCH TẤT CẢ CHỦ ĐỀ NGỮ PHÁP
// Hỗ trợ phân trang, sắp xếp, lọc
export const getAllGrammarTopics = async (options = {}) => {};

// TÌM KIẾM CHỦ ĐỀ NGỮ PHÁP
export const searchGrammarTopics = async (keyword, options = {}) => {};

// THAY ĐỔI THỨ TỰ HIỂN THỊ CHỦ ĐỀ
export const changeTopicOrder = async (topicId, newOrder) => {};

// CẬP NHẬT TRẠNG THÁI HOẠT ĐỘNG
export const changeTopicStatus = async (topicId, isActive) => {};

// CẬP NHẬT SỐ LƯỢNG BÀI HỌC TRONG CHỦ ĐỀ
// Thường được gọi sau khi tạo/xóa lesson
export const updateLessonCount = async (topicId) => {};

// LẤY DANH SÁCH CHỦ ĐỀ ĐANG HOẠT ĐỘNG
// Dùng cho Mobile App User
export const getActiveGrammarTopics = async () => {};

// LẤY DANH SÁCH CHỦ ĐỀ KÈM TIẾN ĐỘ HỌC CỦA MỘT USER
export const getGrammarTopicsWithProgress = async (userId) => {};
