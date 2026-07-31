import ReadingCategory from "../models/ReadingCategory.js";
import ReadingPassage from "../models/ReadingPassage.js";
import AppError from "../utils/AppError.js";
import slugify from "slugify";

/**
 * Sinh slug duy nhất cho ReadingCategory.
 * Nếu slug đã tồn tại thì thêm suffix -1, -2, ...
 */
const generateUniqueCategorySlug = async (name) => {
  const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
  let slug = baseSlug;
  let counter = 1;
  while (await ReadingCategory.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

/**
 * Cập nhật passageCount của một category.
 * Đếm số passage active (chưa archived) trong category.
 * Được gọi nội bộ sau khi tạo/xóa/thay đổi category của passage.
 */
export const updatePassageCount = async (categoryId) => {
  const count = await ReadingPassage.countDocuments({
    categoryId,
    status: { $ne: "archived" },
  });
  await ReadingCategory.findByIdAndUpdate(categoryId, { passageCount: count });
};

// ============ CRUD ============

export const createReadingCategory = async (data) => {
  const { name, description, thumbnail, color, order, isActive } = data;

  // Kiểm tra trùng tên
  const existing = await ReadingCategory.findOne({ name });
  if (existing) {
    throw new AppError("Danh mục đã tồn tại với tên này", 400);
  }

  const slug = await generateUniqueCategorySlug(name);

  const category = await ReadingCategory.create({
    name,
    slug,
    description: description || "",
    thumbnail: thumbnail || "",
    color: color || "",
    order: order || 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  return category;
};

export const updateReadingCategory = async (categoryId, data) => {
  const category = await ReadingCategory.findById(categoryId);
  if (!category) {
    throw new AppError("Danh mục không tồn tại", 404);
  }

  const updatedData = {};

  if (data.name !== undefined) {
    // Kiểm tra trùng tên (trừ chính nó)
    const duplicate = await ReadingCategory.findOne({
      name: data.name,
      _id: { $ne: categoryId },
    });
    if (duplicate) {
      throw new AppError("Tên danh mục đã được sử dụng", 400);
    }
    const slug = await generateUniqueCategorySlug(data.name);
    updatedData.name = data.name;
    updatedData.slug = slug;
  }

  if (data.description !== undefined) updatedData.description = data.description;
  if (data.thumbnail !== undefined) updatedData.thumbnail = data.thumbnail;
  if (data.color !== undefined) updatedData.color = data.color;
  if (data.order !== undefined) updatedData.order = data.order;
  if (data.isActive !== undefined) updatedData.isActive = data.isActive;

  const updated = await ReadingCategory.findByIdAndUpdate(
    categoryId,
    updatedData,
    { new: true },
  );

  return updated;
};

export const deleteReadingCategory = async (categoryId) => {
  const category = await ReadingCategory.findById(categoryId);
  if (!category) {
    throw new AppError("Danh mục không tồn tại", 404);
  }

  // Không cho xóa nếu còn passage (kể cả draft/archived)
  const passageCount = await ReadingPassage.countDocuments({ categoryId });
  if (passageCount > 0) {
    throw new AppError(
      `Không thể xóa danh mục đang có ${passageCount} bài đọc. Hãy xóa hoặc chuyển bài đọc sang danh mục khác trước.`,
      400,
    );
  }

  await category.deleteOne();
  return category;
};

export const getReadingCategoryById = async (categoryId) => {
  const category = await ReadingCategory.findById(categoryId).lean();
  if (!category) {
    throw new AppError("Danh mục không tồn tại", 404);
  }
  return category;
};

export const getReadingCategoryBySlug = async (slug) => {
  const category = await ReadingCategory.findOne({ slug }).lean();
  if (!category) {
    throw new AppError("Danh mục không tồn tại", 404);
  }
  return category;
};

export const getAllReadingCategories = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
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

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [categories, total] = await Promise.all([
    ReadingCategory.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ReadingCategory.countDocuments(filter),
  ]);

  return {
    categories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const toggleCategoryStatus = async (categoryId, isActive) => {
  const category = await ReadingCategory.findById(categoryId);
  if (!category) {
    throw new AppError("Danh mục không tồn tại", 404);
  }
  category.isActive = isActive;
  await category.save();
  return category;
};
