import GrammarTopic from "../models/GrammarTopic.js";
import GrammarLesson from "../models/GrammarLesson.js";
import UserGrammarProgress from "../models/UserGrammarProgress.js";
import { updateLessonCount } from "../services/grammarTopicService.js";
import AppError from "../utils/AppError.js";
import slugify from "slugify";

// Hàm sinh slug duy nhất
const generateUniqueSlug = async (title) => {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });
  let slug = baseSlug;
  let counter = 1;
  while (await GrammarLesson.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};
// TẠO BÀI HỌC NGỮ PHÁP MỚI
export const createGrammarLesson = async (data) => {
  const {
    topicId,
    title,
    shortDescription,
    htmlContent,
    plainTextContent,
    thumbnailUrl,
    estimatedTime,
    order,
    isPublished,
    isActive,
    lessonType,
    parentLessonId,
  } = data;
  // Kiểm tra topic tồn tại
  const topic = await GrammarTopic.findById(topicId);
  if (!topic) {
    throw new AppError("Chủ đề không tồn tại", 404);
  }
  // Kiểm tra trùng tên bài học trong cùng topic
  const duplicateLesson = await GrammarLesson.findOne({
    topicId,
    title,
  });

  if (duplicateLesson) {
    throw new AppError("Bài học đã tồn tại trong chủ đề này", 400);
  }
  // Tạo slug
  const slug = await generateUniqueSlug(title);

  // Tạo bài học
  const lesson = await GrammarLesson.create({
    topicId,
    title,
    slug,
    shortDescription: shortDescription || "",
    htmlContent,
    plainTextContent: plainTextContent || "",
    thumbnailUrl: thumbnailUrl || "",
    estimatedTime: estimatedTime || 0,
    order: order || 0,
    isPublished: isPublished !== undefined ? isPublished : true,
    isActive: isActive !== undefined ? isActive : true,
    lessonType: lessonType || "theory",
    parentLessonId: parentLessonId || null,
  });
  // Cập nhật số lượng bài học của chủ đề
  await updateLessonCount(topicId);

  return lesson;
};

// CẬP NHẬT THÔNG TIN BÀI HỌC NGỮ PHÁP
export const updateGrammarLesson = async (lessonId, data) => {
  const lessonExist = await GrammarLesson.findById(lessonId);
  if (!lessonExist) {
    throw new AppError("Bài học không tồn tại", 404);
  }
  const updatedData = {};
  // Xử lý topicId
  if (data.topicId !== undefined) {
    const topic = await GrammarTopic.findById(data.topicId);
    if (!topic) {
      throw new AppError("Chủ đề không tồn tại", 404);
    }
    updatedData.topicId = data.topicId;
  }
  const topicId = data.topicId || lessonExist.topicId;
  // Xử lý title
  if (data.title !== undefined) {
    const duplicateLesson = await GrammarLesson.findOne({
      topicId,
      title: data.title,
      _id: { $ne: lessonId },
    });
    if (duplicateLesson) {
      throw new AppError("Bài học đã tồn tại trong chủ đề này", 400);
    }
    const slug = await generateUniqueSlug(data.title);
    updatedData.title = data.title;
    updatedData.slug = slug;
  }

  if (data.shortDescription !== undefined) {
    updatedData.shortDescription = data.shortDescription;
  }

  if (data.htmlContent !== undefined) {
    updatedData.htmlContent = data.htmlContent;
  }

  if (data.plainTextContent !== undefined) {
    updatedData.plainTextContent = data.plainTextContent;
  }

  if (data.thumbnailUrl !== undefined) {
    updatedData.thumbnailUrl = data.thumbnailUrl;
  }

  if (data.estimatedTime !== undefined) {
    updatedData.estimatedTime = data.estimatedTime;
  }

  if (data.order !== undefined) {
    updatedData.order = data.order;
  }

  if (data.isPublished !== undefined) {
    updatedData.isPublished = data.isPublished;
  }

  if (data.isActive !== undefined) {
    updatedData.isActive = data.isActive;
  }

  if (data.lessonType !== undefined) {
    updatedData.lessonType = data.lessonType;
    if (data.lessonType !== "exercise") {
      updatedData.parentLessonId = null;
    }
  }

  if (data.parentLessonId !== undefined) {
    updatedData.parentLessonId = data.parentLessonId || null;
  }

  const updatedLesson = await GrammarLesson.findByIdAndUpdate(
    lessonId,
    updatedData,
    {
      new: true,
    },
  );

  // Nếu đổi topic thì cập nhật lại lessonCount
  if (
    data.topicId &&
    data.topicId.toString() !== lessonExist.topicId.toString()
  ) {
    await updateLessonCount(lessonExist.topicId);
    await updateLessonCount(data.topicId);
  }

  return updatedLesson;
};

// XÓA BÀI HỌC NGỮ PHÁP
export const deleteGrammarLesson = async (lessonId) => {
  const lesson = await GrammarLesson.findById(lessonId);
  if (!lesson) {
    throw new AppError("Bài học không tồn tại", 404);
  }
  const topicId = lesson.topicId;
  // Xóa toàn bộ tiến độ học liên quan
  await UserGrammarProgress.deleteMany({
    lessonId,
  });
  // Xóa bài học
  await lesson.deleteOne();
  // Cập nhật lại số lượng bài học của chủ đề
  await updateLessonCount(topicId);
  return lesson;
};

// LẤY CHI TIẾT BÀI HỌC THEO ID
export const getGrammarLessonById = async (lessonId) => {
  const lesson = await GrammarLesson.findById(lessonId)
    .populate("topicId", "name slug")
    .lean();

  if (!lesson) {
    throw new AppError("Bài học không tồn tại", 404);
  }

  const previousLesson = await GrammarLesson.findOne({
    topicId: lesson.topicId._id,
    order: { $lt: lesson.order },
    isActive: true,
    isPublished: true,
  })
    .sort({ order: -1 })
    .select("_id title slug")
    .lean();

  const nextLesson = await GrammarLesson.findOne({
    topicId: lesson.topicId._id,
    order: { $gt: lesson.order },
    isActive: true,
    isPublished: true,
  })
    .sort({ order: 1 })
    .select("_id title slug")
    .lean();

  return {
    ...lesson,
    previousLesson,
    nextLesson,
  };
};

// LẤY CHI TIẾT BÀI HỌC THEO SLUG
export const getGrammarLessonBySlug = async (slug) => {
  const lesson = await GrammarLesson.findOne({
    slug,
    isActive: true,
    isPublished: true,
  })
    .populate("topicId", "name slug")
    .lean();

  if (!lesson) {
    throw new AppError("Bài học không tồn tại", 404);
  }

  const previousLesson = await GrammarLesson.findOne({
    topicId: lesson.topicId._id,
    order: { $lt: lesson.order },
    isActive: true,
    isPublished: true,
  })
    .sort({ order: -1 })
    .select("_id title slug")
    .lean();

  const nextLesson = await GrammarLesson.findOne({
    topicId: lesson.topicId._id,
    order: { $gt: lesson.order },
    isActive: true,
    isPublished: true,
  })
    .sort({ order: 1 })
    .select("_id title slug")
    .lean();

  return {
    ...lesson,
    previousLesson,
    nextLesson,
  };
};

// LẤY DANH SÁCH TẤT CẢ BÀI HỌC
// Hỗ trợ phân trang, lọc, sắp xếp
export const getAllGrammarLessons = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    topicId,
    isActive,
    isPublished,
    sortBy = "order",
    sortOrder = "asc",
  } = options;

  const skip = (page - 1) * limit;

  const filter = {};

  // Tìm kiếm theo tiêu đề
  if (search) {
    filter.title = {
      $regex: search,
      $options: "i",
    };
  }

  // Lọc theo chủ đề
  if (topicId) {
    filter.topicId = topicId;
  }

  // Lọc trạng thái hoạt động
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  // Lọc trạng thái xuất bản
  if (isPublished !== undefined) {
    filter.isPublished = isPublished;
  }

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [lessons, total] = await Promise.all([
    GrammarLesson.find(filter)
      .populate("topicId", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    GrammarLesson.countDocuments(filter),
  ]);

  return {
    lessons,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// LẤY DANH SÁCH BÀI HỌC THEO CHỦ ĐỀ
export const getLessonsByTopic = async (topicId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    isActive,
    isPublished,
    sortBy = "order",
    sortOrder = "asc",
  } = options;

  const topic = await GrammarTopic.findById(topicId);

  if (!topic) {
    throw new AppError("Chủ đề không tồn tại", 404);
  }

  const skip = (page - 1) * limit;

  const filter = {
    topicId,
  };

  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  if (isPublished !== undefined) {
    filter.isPublished = isPublished;
  }

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [lessons, total] = await Promise.all([
    GrammarLesson.find(filter).sort(sort).skip(skip).limit(limit).lean(),

    GrammarLesson.countDocuments(filter),
  ]);

  return {
    topic: {
      _id: topic._id,
      name: topic.name,
      slug: topic.slug,
    },
    lessons,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// TÌM KIẾM BÀI HỌC NGỮ PHÁP
export const searchGrammarLessons = async (keyword, options = {}) => {
  const {
    page = 1,
    limit = 10,
    topicId,
    isActive = true,
    isPublished = true,
  } = options;

  const skip = (page - 1) * limit;

  const filter = {
    title: {
      $regex: keyword,
      $options: "i",
    },
  };

  if (topicId) {
    filter.topicId = topicId;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  if (isPublished !== undefined) {
    filter.isPublished = isPublished;
  }

  const [lessons, total] = await Promise.all([
    GrammarLesson.find(filter)
      .populate("topicId", "name slug")
      .sort({
        order: 1,
        title: 1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    GrammarLesson.countDocuments(filter),
  ]);

  return {
    lessons,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// THAY ĐỔI THỨ TỰ HIỂN THỊ BÀI HỌC
export const changeLessonOrder = async (lessonId, newOrder) => {
  const lesson = await GrammarLesson.findById(lessonId);
  if (!lesson) {
    throw new AppError("Bài học không tồn tại", 404);
  }
  lesson.order = newOrder;
  await lesson.save();
  return lesson;
};

// CẬP NHẬT TRẠNG THÁI XUẤT BẢN
export const changePublishStatus = async (lessonId, isPublished) => {
  const lesson = await GrammarLesson.findById(lessonId);
  if (!lesson) {
    throw new AppError("Bài học không tồn tại", 404);
  }
  lesson.isPublished = !isPublished;
  await lesson.save();
  return lesson;
};

// CẬP NHẬT TRẠNG THÁI HOẠT ĐỘNG
export const changeLessonStatus = async (lessonId, isActive) => {
  const lesson = await GrammarLesson.findById(lessonId);
  if (!lesson) {
    throw new AppError("Bài học không tồn tại", 404);
  }
  lesson.isActive = !isActive;
  await lesson.save();
  // Cập nhật lại số lượng bài học trong chủ đề
  await updateLessonCount(lesson.topicId);
  return lesson;
};

// LẤY DANH SÁCH BÀI HỌC ĐANG ĐƯỢC XUẤT BẢN
// Dùng cho Mobile App
export const getPublishedLessons = async () => {
  const lessons = await GrammarLesson.find({
    isActive: true,
    isPublished: true,
  })
    .populate("topicId", "name slug")
    .sort({
      order: 1,
      title: 1,
    })
    .lean();

  return lessons;
};

// LẤY DANH SÁCH BÀI HỌC ĐANG HOẠT ĐỘNG
// THEO CHỦ ĐỀ
// Dùng cho Mobile App
export const getActiveLessonsByTopic = async (topicId) => {
  const topic = await GrammarTopic.findOne({
    _id: topicId,
    isActive: true,
  }).lean();

  if (!topic) {
    throw new AppError("Chủ đề không tồn tại", 404);
  }

  const lessons = await GrammarLesson.find({
    topicId,
    isActive: true,
    isPublished: true,
  })
    .sort({
      order: 1,
      title: 1,
    })
    .select("_id title slug shortDescription thumbnailUrl estimatedTime order lessonType parentLessonId")
    .lean();

  return {
    topic,
    lessons,
  };
};

// LẤY BÀI HỌC KẾ TIẾP TRONG CÙNG CHỦ ĐỀ
export const getNextLesson = async (lessonId) => {
  const currentLesson = await GrammarLesson.findById(lessonId);

  if (!currentLesson) {
    throw new AppError("Bài học không tồn tại", 404);
  }

  const nextLesson = await GrammarLesson.findOne({
    topicId: currentLesson.topicId,
    order: { $gt: currentLesson.order },
    isActive: true,
    isPublished: true,
  })
    .sort({ order: 1 })
    .lean();

  return {
    hasNextLesson: !!nextLesson,
    nextLesson,
  };
};

// LẤY BÀI HỌC TRƯỚC ĐÓ TRONG CÙNG CHỦ ĐỀ
// DÙNG CHO APP MOBILE
export const getPreviousLesson = async (lessonId) => {
  const currentLesson = await GrammarLesson.findById(lessonId);

  if (!currentLesson) {
    throw new AppError("Bài học không tồn tại", 404);
  }

  const previousLesson = await GrammarLesson.findOne({
    topicId: currentLesson.topicId,
    order: { $lt: currentLesson.order },
    isActive: true,
    isPublished: true,
  })
    .sort({ order: -1 })
    .lean();

  return {
    hasPreviousLesson: !!previousLesson,
    previousLesson,
  };
};
