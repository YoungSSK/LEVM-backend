import GrammarTopic from "../models/GrammarTopic.js";
import GrammarLesson from "../models/GrammarLesson.js";
import UserGrammarProgress from "../models/UserGrammarProgress.js";
import AppError from "../utils/AppError.js";
import slugify from "slugify";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
// TẠO CHỦ ĐỀ NGỮ PHÁP MỚI
export const createGrammarTopic = async (data) => {
  const { name, description, thumbnail, order, lessonCount, isActive } = data;
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
    thumbnail,
    order,
    isActive,
  });
  return newTopic;
};

// CẬP NHẬT THÔNG TIN CHỦ ĐỀ NGỮ PHÁP
export const updateGrammarTopic = async (topicId, data) => {
  const topicExist = await GrammarTopic.findById(topicId);
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
    updatedData.slug = slug;
  }
  if (data.description !== undefined) {
    updatedData.description = data.description;
  }
  if (data.thumbnail !== undefined) {
    updatedData.thumbnail = data.thumbnail;
  }
  if (data.order !== undefined) {
    updatedData.order = data.order;
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

// LẤY CHI TIẾT CHỦ ĐỀ NGỮ PHÁP THEO ID HOẶC SLUG
// Accept cả ObjectId lẫn slug (grammarTopicIdParamsSchema đã được update để accept cả hai).
export const getGrammarTopicById = async (topicIdOrSlug) => {
  let topic;
  if (objectIdRegex.test(topicIdOrSlug)) {
    topic = await GrammarTopic.findById(topicIdOrSlug).lean();
  } else {
    topic = await GrammarTopic.findOne({ slug: topicIdOrSlug }).lean();
  }
  if (!topic) {
    throw new AppError("Chủ đề không tồn tại", 404);
  }
  const lessons = await GrammarLesson.find({ topicId: topic._id, isActive: true })
    .sort({ order: 1 })
    .lean();
  return { ...topic, lessons };
};

// LẤY CHI TIẾT CHỦ ĐỀ NGỮ PHÁP THEO SLUG
export const getGrammarTopicBySlug = async (slug) => {
  const topic = await GrammarTopic.findOne({ slug, isActive: true }).lean();
  if (!topic) {
    throw new AppError("Chủ đề không tồn tại", 404);
  }
  const lessons = await GrammarLesson.find({
    topicId: topic._id,
    isActive: true,
  })
    .sort({ order: 1 })
    .lean();
  return { ...topic, lessons };
};

// LẤY DANH SÁCH TẤT CẢ CHỦ ĐỀ NGỮ PHÁP
// Hỗ trợ phân trang, sắp xếp, lọc
export const getAllGrammarTopics = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    isActive,
    sortBy = "order",
    sortOrder = "asc",
  } = options;
  const skip = (page - 1) * limit;
  const filter = {};
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }
  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };
  const [topics, total] = await Promise.all([
    GrammarTopic.find(filter).sort(sort).skip(skip).limit(limit).lean(),

    GrammarTopic.countDocuments(filter),
  ]);
  return {
    topics,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// TÌM KIẾM CHỦ ĐỀ NGỮ PHÁP
export const searchGrammarTopics = async (keyword, options = {}) => {
  const { page = 1, limit = 10, isActive = true } = options;

  const skip = (page - 1) * limit;

  const filter = {
    name: {
      $regex: keyword,
      $options: "i",
    },
  };

  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  const [topics, total] = await Promise.all([
    GrammarTopic.find(filter)
      .sort({ order: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    GrammarTopic.countDocuments(filter),
  ]);

  return {
    topics,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// THAY ĐỔI THỨ TỰ HIỂN THỊ CHỦ ĐỀ
export const changeTopicOrder = async (topicId, newOrder) => {
  const topic = await GrammarTopic.findById(topicId);
  if (!topic) {
    throw new AppError("Chủ đề không tồn tại", 404);
  }
  topic.order = newOrder;
  await topic.save();
  return topic;
};

// CẬP NHẬT TRẠNG THÁI HOẠT ĐỘNG
export const changeTopicStatus = async (topicId, isActive) => {
  const topic = await GrammarTopic.findById(topicId);
  if (!topic) {
    throw new AppError("Chủ đề không tồn tại", 404);
  }
  topic.isActive = !isActive;
  await topic.save();
  return topic;
};

// CẬP NHẬT SỐ LƯỢNG BÀI HỌC TRONG CHỦ ĐỀ
// Thường được gọi sau khi tạo/xóa lesson
export const updateLessonCount = async (topicId) => {
  const topic = await GrammarTopic.findById(topicId);
  if (!topic) {
    throw new AppError("Chủ đề không tồn tại", 404);
  }
  const lessonCount = await GrammarLesson.countDocuments({
    topicId,
  });
  topic.lessonCount = lessonCount;
  await topic.save();
  return topic;
};

// LẤY DANH SÁCH CHỦ ĐỀ ĐANG HOẠT ĐỘNG
// Dùng cho Mobile App User
export const getActiveGrammarTopics = async () => {
  const topics = await GrammarTopic.find({
    isActive: true,
  })
    .sort({ order: 1, name: 1 })
    .lean();

  return topics;
};

// Lấy danh sách chủ đề kèm tiến độ học
export const getGrammarTopicsWithProgress = async (userId) => {
  const topics = await GrammarTopic.find({
    isActive: true,
  })
    .sort({ order: 1 })
    .lean();

  const progresses = await UserGrammarProgress.find({
    userId,
    isCompleted: true,
  })
    .select("lessonId")
    .lean();

  const completedLessonIds = new Set(
    progresses.map((p) => p.lessonId.toString()),
  );

  const result = [];

  for (const topic of topics) {
    const lessons = await GrammarLesson.find({
      topicId: topic._id,
      isActive: true,
      isPublished: true,
    })
      .select("_id")
      .lean();

    const totalLessons = lessons.length;

    const completedLessons = lessons.filter((lesson) =>
      completedLessonIds.has(lesson._id.toString()),
    ).length;

    const progressPercent =
      totalLessons === 0
        ? 0
        : Math.round((completedLessons / totalLessons) * 100);

    result.push({
      ...topic,
      totalLessons,
      completedLessons,
      progressPercent,
    });
  }

  return result;
};
