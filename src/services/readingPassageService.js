import ReadingCategory from "../models/ReadingCategory.js";
import ReadingPassage from "../models/ReadingPassage.js";
import ReadingQuestionSet from "../models/ReadingQuestionSet.js";
import ReadingQuestion from "../models/ReadingQuestion.js";
import ReadingAttempt from "../models/ReadingAttempt.js";
import AppError from "../utils/AppError.js";
import { updatePassageCount } from "./readingCategoryService.js";
import slugify from "slugify";

// ===== Helpers =====

/**
 * Strip HTML về plain text — dùng để index tìm kiếm.
 */
const stripHtmlToPlain = (html) => {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

/**
 * Đếm số từ từ plain text.
 */
const countWords = (text) => {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
};

/**
 * Sanitize HTML — loại bỏ script/iframe/event handlers để ngăn XSS.
 * Tái sử dụng logic từ grammarLessonService.js.
 */
const DANGEROUS_TAGS = [
  "script", "iframe", "object", "embed", "form", "input", "button",
  "select", "textarea", "style", "link", "meta", "base", "svg", "math",
];

const sanitizeHtml = (html) => {
  if (!html || typeof html !== "string") return "";
  let result = html;

  for (const tag of DANGEROUS_TAGS) {
    result = result.replace(
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"),
      "",
    );
    result = result.replace(new RegExp(`<${tag}[^>]*\/?>`, "gi"), "");
  }

  result = result.replace(/<!--[\s\S]*?-->/g, "");
  result = result.replace(
    /\s+(on\w+|javascript:|data:(?!image\/(png|jpeg|gif|webp);base64))(\s*=\s*["'][^"']*["'])?/gi,
    "",
  );
  result = result.replace(/expression\s*\([^)]*\)/gi, "");
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
      return "";
    },
  );

  return result.trim();
};

/**
 * Sinh slug duy nhất cho ReadingPassage.
 */
const generateUniquePassageSlug = async (title) => {
  const baseSlug = slugify(title, { lower: true, strict: true, trim: true });
  let slug = baseSlug;
  let counter = 1;
  while (await ReadingPassage.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

// ===== CRUD =====

export const createReadingPassage = async (data, createdByUserId) => {
  const {
    categoryId,
    title,
    description,
    thumbnail,
    htmlContent,
    plainText,
    difficulty,
    cefrLevel,
    readingType,
    tags,
    estimatedTime,
    order,
    xpReward,
    passThreshold,
  } = data;

  // Kiểm tra category tồn tại
  const category = await ReadingCategory.findById(categoryId);
  if (!category) {
    throw new AppError("Danh mục không tồn tại", 404);
  }

  // Kiểm tra trùng tên trong cùng category
  const duplicate = await ReadingPassage.findOne({ categoryId, title });
  if (duplicate) {
    throw new AppError("Bài đọc với tiêu đề này đã tồn tại trong danh mục", 400);
  }

  const slug = await generateUniquePassageSlug(title);
  const safeHtml = sanitizeHtml(htmlContent);
  const plain = plainText && plainText.trim() ? plainText : stripHtmlToPlain(safeHtml);
  const wc = countWords(plain);

  const passage = await ReadingPassage.create({
    categoryId,
    createdBy: createdByUserId,
    title,
    slug,
    description: description || "",
    thumbnail: thumbnail || "",
    htmlContent: safeHtml,
    plainText: plain,
    wordCount: wc,
    difficulty: difficulty || "intermediate",
    cefrLevel: cefrLevel || "B1",
    readingType: readingType || "article",
    tags: tags || [],
    estimatedTime: estimatedTime || 0,
    order: order || 0,
    xpReward: xpReward !== undefined ? xpReward : 15,
    passThreshold: passThreshold !== undefined ? passThreshold : 70,
    status: "draft",
  });

  // Cập nhật passageCount trong category
  await updatePassageCount(categoryId);

  return passage;
};

export const updateReadingPassage = async (passageId, data, updatedByUserId) => {
  const passage = await ReadingPassage.findById(passageId);
  if (!passage) {
    throw new AppError("Bài đọc không tồn tại", 404);
  }

  const updatedData = { updatedBy: updatedByUserId };
  const oldCategoryId = passage.categoryId;

  if (data.categoryId !== undefined) {
    const category = await ReadingCategory.findById(data.categoryId);
    if (!category) {
      throw new AppError("Danh mục không tồn tại", 404);
    }
    updatedData.categoryId = data.categoryId;
  }

  const effectiveCategoryId = data.categoryId || passage.categoryId;

  if (data.title !== undefined) {
    const duplicate = await ReadingPassage.findOne({
      categoryId: effectiveCategoryId,
      title: data.title,
      _id: { $ne: passageId },
    });
    if (duplicate) {
      throw new AppError("Bài đọc với tiêu đề này đã tồn tại trong danh mục", 400);
    }
    const slug = await generateUniquePassageSlug(data.title);
    updatedData.title = data.title;
    updatedData.slug = slug;
  }

  const simpleFields = [
    "description", "thumbnail", "difficulty", "cefrLevel",
    "readingType", "tags", "estimatedTime", "order", "xpReward", "passThreshold",
  ];
  for (const field of simpleFields) {
    if (data[field] !== undefined) updatedData[field] = data[field];
  }

  if (data.htmlContent !== undefined) {
    const safeHtml = sanitizeHtml(data.htmlContent);
    const plain =
      data.plainText && data.plainText.trim()
        ? data.plainText
        : stripHtmlToPlain(safeHtml);
    updatedData.htmlContent = safeHtml;
    updatedData.plainText = plain;
    updatedData.wordCount = countWords(plain);
    updatedData.contentUpdatedAt = new Date();
    if (updatedByUserId) updatedData.contentUpdatedBy = updatedByUserId;
  }

  const updated = await ReadingPassage.findByIdAndUpdate(passageId, updatedData, { new: true });

  // Nếu đổi category thì cập nhật passageCount cho cả hai
  if (data.categoryId && data.categoryId.toString() !== oldCategoryId.toString()) {
    await updatePassageCount(oldCategoryId);
    await updatePassageCount(data.categoryId);
  }

  return updated;
};

export const deleteReadingPassage = async (passageId) => {
  const passage = await ReadingPassage.findById(passageId);
  if (!passage) {
    throw new AppError("Bài đọc không tồn tại", 404);
  }

  const categoryId = passage.categoryId;

  // Xóa toàn bộ question sets và questions liên quan
  const sets = await ReadingQuestionSet.find({ passageId }).select("_id").lean();
  const setIds = sets.map((s) => s._id);
  if (setIds.length > 0) {
    await ReadingQuestion.deleteMany({ questionSetId: { $in: setIds } });
    await ReadingQuestionSet.deleteMany({ passageId });
  }

  // Xóa attempts liên quan
  await ReadingAttempt.deleteMany({ passageId });

  await passage.deleteOne();

  // Cập nhật passageCount
  await updatePassageCount(categoryId);

  return passage;
};

export const getReadingPassageById = async (passageId) => {
  const passage = await ReadingPassage.findById(passageId)
    .populate("categoryId", "name slug")
    .populate("createdBy", "username displayName")
    .populate("updatedBy", "username displayName")
    .lean();

  if (!passage) {
    throw new AppError("Bài đọc không tồn tại", 404);
  }

  return passage;
};

export const getReadingPassageBySlug = async (slug) => {
  const passage = await ReadingPassage.findOne({ slug })
    .populate("categoryId", "name slug")
    .populate("createdBy", "username displayName")
    .lean();

  if (!passage) {
    throw new AppError("Bài đọc không tồn tại", 404);
  }

  return passage;
};

export const getAllReadingPassages = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    categoryId,
    status,
    difficulty,
    cefrLevel,
    readingType,
    tags,
    sortBy = "order",
    sortOrder = "asc",
  } = options;

  const skip = (page - 1) * limit;
  const filter = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (categoryId) filter.categoryId = categoryId;
  if (status) filter.status = status;
  if (difficulty) filter.difficulty = difficulty;
  if (cefrLevel) filter.cefrLevel = cefrLevel;
  if (readingType) filter.readingType = readingType;
  if (tags && tags.length > 0) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [passages, total] = await Promise.all([
    ReadingPassage.find(filter)
      .populate("categoryId", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    ReadingPassage.countDocuments(filter),
  ]);

  return {
    passages,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getPassagesByCategory = async (categoryId, options = {}) => {
  const category = await ReadingCategory.findById(categoryId).lean();
  if (!category) {
    throw new AppError("Danh mục không tồn tại", 404);
  }

  const {
    page = 1,
    limit = 10,
    status,
    sortBy = "order",
    sortOrder = "asc",
  } = options;

  const skip = (page - 1) * limit;
  const filter = { categoryId };
  if (status) filter.status = status;

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [passages, total] = await Promise.all([
    ReadingPassage.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ReadingPassage.countDocuments(filter),
  ]);

  return {
    category,
    passages,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ===== Status Management =====

export const changePassageStatus = async (passageId, newStatus, userId) => {
  const passage = await ReadingPassage.findById(passageId);
  if (!passage) {
    throw new AppError("Bài đọc không tồn tại", 404);
  }

  const oldStatus = passage.status;
  passage.status = newStatus;
  passage.updatedBy = userId;

  if (newStatus === "published" && oldStatus !== "published") {
    passage.publishedAt = new Date();
  }

  await passage.save();

  // Cập nhật passageCount (vì archived không được đếm)
  await updatePassageCount(passage.categoryId);

  return passage;
};

export const changePassageOrder = async (passageId, newOrder) => {
  const passage = await ReadingPassage.findById(passageId);
  if (!passage) {
    throw new AppError("Bài đọc không tồn tại", 404);
  }
  passage.order = newOrder;
  await passage.save();
  return passage;
};

// ===== Content Autosave =====

/**
 * Autosave nội dung HTML của bài đọc.
 * Hỗ trợ optimistic locking qua lastKnownContentUpdatedAt.
 */
export const updatePassageContent = async (passageId, data, updatedByUserId) => {
  const passage = await ReadingPassage.findById(passageId);
  if (!passage) {
    throw new AppError("Bài đọc không tồn tại", 404);
  }

  // Optimistic locking
  if (data.lastKnownContentUpdatedAt && passage.contentUpdatedAt) {
    const clientTs = new Date(data.lastKnownContentUpdatedAt).getTime();
    const serverTs = new Date(passage.contentUpdatedAt).getTime();
    if (!Number.isNaN(clientTs) && !Number.isNaN(serverTs) && clientTs !== serverTs) {
      throw new AppError(
        "Nội dung đã được cập nhật bởi người khác. Vui lòng tải lại trước khi lưu.",
        409,
      );
    }
  }

  const safeHtml = sanitizeHtml(data.htmlContent);
  const plain =
    data.plainText && data.plainText.trim()
      ? data.plainText
      : stripHtmlToPlain(safeHtml);

  passage.htmlContent = safeHtml;
  passage.plainText = plain;
  passage.wordCount = countWords(plain);
  passage.contentUpdatedAt = new Date();
  passage.contentUpdatedBy = updatedByUserId || null;

  await passage.save();

  return {
    _id: passage._id,
    wordCount: passage.wordCount,
    contentUpdatedAt: passage.contentUpdatedAt,
    contentUpdatedBy: passage.contentUpdatedBy,
  };
};

// ===== Clone =====

/**
 * Clone một passage cùng với toàn bộ question sets và questions.
 * Passage mới có status = "draft" và title = "<title> (Copy)".
 */
export const clonePassage = async (passageId, userId) => {
  const original = await ReadingPassage.findById(passageId).lean();
  if (!original) {
    throw new AppError("Bài đọc không tồn tại", 404);
  }

  // Tạo tiêu đề mới
  const newTitle = `${original.title} (Copy)`;

  // Kiểm tra xem title mới có trùng không
  const duplicate = await ReadingPassage.findOne({
    categoryId: original.categoryId,
    title: newTitle,
  });
  if (duplicate) {
    throw new AppError(
      "Bài đọc copy đã tồn tại. Vui lòng xóa bản copy cũ hoặc đổi tên trước.",
      400,
    );
  }

  const newSlug = await generateUniquePassageSlug(newTitle);

  // Tạo passage mới
  const cloned = await ReadingPassage.create({
    ...original,
    _id: undefined,
    title: newTitle,
    slug: newSlug,
    status: "draft",
    publishedAt: null,
    clonedFrom: original._id,
    createdBy: userId,
    updatedBy: null,
    hasQuestions: false,
    passageCount: 0,
    contentUpdatedAt: null,
    contentUpdatedBy: null,
    createdAt: undefined,
    updatedAt: undefined,
  });

  // Clone question sets và questions
  const sets = await ReadingQuestionSet.find({ passageId }).lean();
  for (const set of sets) {
    const newSet = await ReadingQuestionSet.create({
      ...set,
      _id: undefined,
      passageId: cloned._id,
      questionCount: 0,
      createdAt: undefined,
      updatedAt: undefined,
    });

    const questions = await ReadingQuestion.find({ questionSetId: set._id }).lean();
    if (questions.length > 0) {
      const clonedQuestions = questions.map((q) => ({
        ...q,
        _id: undefined,
        questionSetId: newSet._id,
        passageId: cloned._id,
        createdAt: undefined,
        updatedAt: undefined,
      }));
      await ReadingQuestion.insertMany(clonedQuestions, { ordered: false });

      // Cập nhật questionCount cho set mới
      await ReadingQuestionSet.findByIdAndUpdate(newSet._id, {
        questionCount: questions.length,
      });
    }
  }

  // Cập nhật hasQuestions nếu có câu hỏi
  if (sets.length > 0) {
    const totalQuestions = await ReadingQuestion.countDocuments({
      passageId: cloned._id,
      isActive: true,
    });
    if (totalQuestions > 0) {
      await ReadingPassage.findByIdAndUpdate(cloned._id, { hasQuestions: true });
    }
  }

  // Cập nhật passageCount của category
  await updatePassageCount(original.categoryId);

  return ReadingPassage.findById(cloned._id).populate("categoryId", "name slug").lean();
};

// ===== Mobile / User API =====

export const getPublishedPassages = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    categoryId,
    difficulty,
    cefrLevel,
    sortBy = "publishedAt",
    sortOrder = "desc",
  } = options;

  const skip = (page - 1) * limit;
  const filter = { status: "published" };

  if (categoryId) filter.categoryId = categoryId;
  if (difficulty) filter.difficulty = difficulty;
  if (cefrLevel) filter.cefrLevel = cefrLevel;

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [passages, total] = await Promise.all([
    ReadingPassage.find(filter)
      .populate("categoryId", "name slug color thumbnail")
      .select("-htmlContent -plainText")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    ReadingPassage.countDocuments(filter),
  ]);

  return {
    passages,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};
