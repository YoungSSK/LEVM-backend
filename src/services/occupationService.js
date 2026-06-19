import Occupation from "../models/Occupation.js";
import OccupationCategory from "../models/OccupationCategory.js";
import AppError from "../utils/AppError.js";

// Hàm lấy danh sách nghề nghiệp
export const getByCategoryId = async (categoryId) => {
  const catagory = await OccupationCategory.findById(categoryId);
  if (!catagory) {
    throw new AppError("Nhóm ngành không tồn tại", 404);
  }
  return await Occupation.find({
    categoryId,
    isActive: true,
  }).sort({ name: 1 });
};
//Hàm tạo occupation
export const create = async (data) => {
  const { catagoryId, name, description } = data;
  const catagory = await OccupationCategory.findById(catagoryId);
  if (!catagory) {
    throw new AppError("Nhóm ngành nghề không tồn tại", 404);
  }
  const duplicateOccupation = await Occupation.findOne({ catagoryId, name });
  if (duplicateOccupation) {
    throw new AppError("Ngành nghề đã tồn tại trong nhóm ngành", 400);
  }
  const occupation = await Occupation.create({
    categoryId,
    name,
    description,
    isActive: true,
  });
};
//Hàm update ngành nghề
export const update = async (id, data) => {
  const occupation = await Occupation.findById(id);

  if (!occupation) {
    throw new AppError("Ngành nghề không tồn tại", 404);
  }

  const { categoryId, name, description, isActive } = data;

  if (categoryId !== undefined || name !== undefined) {
    const duplicate = await Occupation.findOne({
      categoryId: categoryId ?? occupation.categoryId,

      name: name ?? occupation.name,

      _id: { $ne: id },
    });

    if (duplicate) {
      throw new AppError("Ngành nghề đã tồn tại trong nhóm này", 400);
    }
  }

  const updateData = {};

  if (categoryId !== undefined) {
    updateData.categoryId = categoryId;
  }

  if (name !== undefined) {
    updateData.name = name;
  }

  if (description !== undefined) {
    updateData.description = description;
  }

  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }

  return await Occupation.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};
