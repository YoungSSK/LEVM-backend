import GrammarTopic from "../models/GrammarTopic.js";
import GrammarLesson from "../models/GrammarLesson.js";
import UserGrammarProgress from "../models/UserGrammarProgress.js";
import { updateLessonCount } from "../services/grammarTopicService.js";
import AppError from "../utils/AppError.js";
import slugify from "slugify";

/**
 * Strip HTML → plain text. Dùng khi autosave để cập nhật lại plainTextContent.
 */
const stripHtmlToPlain = (html) => {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
};

/**
 * Sanitize HTML trước khi lưu xuống DB.
 * Mục tiêu: ngăn XSS bằng cách loại bỏ:
 *  - <script>, <iframe>, <object>, <embed>, <form>, <input>, <button>
 *  - attribute javascript:, data: (trừ data:image/png;base64 cho ảnh embed)
 *  - on* event handlers (onclick, onerror, onload, v.v.)
 *  - expression() (IE CSS)
 * Giữ nguyên các tag TipTap hợp lệ: p, h1-h6, ul, ol, li, blockquote,
 *  strong, em, s, u, hr, br, code, pre, span (không có event).
 */
const DANGEROUS_TAGS = [
  "script", "iframe", "object", "embed", "form", "input", "button",
  "select", "textarea", "style", "link", "meta", "base", "svg", "math",
];

const DANGEROUS_ATTR_PREFIXES = [
  "on",            // onload, onclick, onerror, v.v.
  "javascript:",
  "data:",         // data:application, data:javascript, v.v.
];

const ALLOWED_TAGS = new Set([
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "strong", "b", "em", "i", "s", "u", "mark", "code", "pre",
  "blockquote",
  "span", "div",
  "a",            // href được kiểm tra riêng
  "img",          // src được kiểm tra riêng
  "table", "thead", "tbody", "tr", "th", "td",
]);

const sanitizeHtml = (html) => {
  if (!html || typeof html !== "string") return "";

  let result = html;

  // 1. Loại bỏ toàn bộ tag nguy hiểm (cùng nội dung bên trong).
  for (const tag of DANGEROUS_TAGS) {
    result = result.replace(
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"),
      "",
    );
    result = result.replace(
      new RegExp(`<${tag}[^>]*/?>`, "gi"),
      "",
    );
  }

  // 2. Loại bỏ comment HTML (có thể chứa IE conditional comments).
  result = result.replace(/<!--[\s\S]*?-->/g, "");

  // 3. Loại bỏ attribute nguy hiểm (on* event handlers, javascript:, data: URI không an toàn).
  result = result.replace(
    /\s+(on\w+|javascript:|data:(?!image\/(png|jpeg|gif|webp);base64))(\s*=\s*["'][^"']*["'])?/gi,
    "",
  );

  // 4. Loại bỏ expression() trong CSS (IE).
  result = result.replace(/expression\s*\([^)]*\)/gi, "");

  // 5. Chuẩn hóa href/src — chỉ cho phép http, https, mailto, / (relative).
  result = result.replace(
    /\s+(href|src)\s*=\s*["']([^"']*)["']/gi,
    (match, attr, value) => {
      const trimmed = value.trim();
      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("mailto:") ||
        trimmed.startsWith("/") ||
        trimmed === "#"
      ) {
        return ` ${attr}="${trimmed}"`;
      }
      return ""; // loại bỏ nếu không hợp lệ
    },
  );

  return result.trim();
};

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
    allowedPackageIds: data.allowedPackageIds || [],
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

  if (data.allowedPackageIds !== undefined) {
    updatedData.allowedPackageIds = data.allowedPackageIds;
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
  ).populate("allowedPackageIds", "name slug level");

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
    .populate("allowedPackageIds", "name slug level")
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
    .populate("allowedPackageIds", "name slug level")
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
      .populate("allowedPackageIds", "name slug level")
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
    .select("_id title slug shortDescription thumbnailUrl estimatedTime order lessonType parentLessonId xpReward passThreshold hasQuiz contentUpdatedAt")
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

/**
 * CẬP NHẬT NỘI DUNG LÝ THUYẾT (autosave)
 * Body: { htmlContent, plainTextContent?, lastKnownContentUpdatedAt? }
 * - Cập nhật htmlContent + plainTextContent (strip HTML tự động nếu FE không gửi).
 * - Set contentUpdatedAt = now(), contentUpdatedBy = req.user._id.
 * - Optimistic locking: nếu FE gửi lastKnownContentUpdatedAt mà không khớp với
 *   contentUpdatedAt hiện tại trong DB -> trả về AppError 409.
 *   (Trường hợp lastKnownContentUpdatedAt = null tức là lesson chưa bao giờ
 *    được autosave trước đó; chỉ khoá khi DB cũng có timestamp.)
 */
export const updateGrammarLessonContent = async (
  lessonId,
  data,
  updatedByUserId,
) => {
  const lesson = await GrammarLesson.findById(lessonId);
  if (!lesson) {
    throw new AppError("Bài học không tồn tại", 404);
  }

  // Optimistic locking nhẹ (Bước 2 — không làm real-time collab).
  if (
    data.lastKnownContentUpdatedAt &&
    lesson.contentUpdatedAt
  ) {
    const clientTs = new Date(data.lastKnownContentUpdatedAt).getTime();
    const serverTs = new Date(lesson.contentUpdatedAt).getTime();
    if (!Number.isNaN(clientTs) && !Number.isNaN(serverTs) && clientTs !== serverTs) {
      throw new AppError(
        "Nội dung đã được cập nhật bởi người khác. Vui lòng tải lại trước khi lưu.",
        409,
      );
    }
  }

  const plain =
    data.plainTextContent !== undefined && data.plainTextContent !== ""
      ? data.plainTextContent
      : stripHtmlToPlain(data.htmlContent);

  // Sanitize htmlContent trước khi lưu (ngăn XSS).
  const safeHtml = sanitizeHtml(data.htmlContent);

  lesson.htmlContent = safeHtml;
  lesson.plainTextContent = plain;
  lesson.contentUpdatedAt = new Date();
  lesson.contentUpdatedBy = updatedByUserId || null;

  await lesson.save();

  return {
    _id: lesson._id,
    contentUpdatedAt: lesson.contentUpdatedAt,
    contentUpdatedBy: lesson.contentUpdatedBy,
    plainTextContent: lesson.plainTextContent,
  };
};
