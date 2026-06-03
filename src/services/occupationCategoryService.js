import AppError from "../utils/AppError.js";
import OccupationCategory from "../models/OccupationCategory.js";
// Hàm tạo mới nhóm ngành
export const create = async (data) => {
  const { name, description } = data;
  const duplicate = await OccupationCategory.findOne({ name });
  if (duplicate) {
    throw new AppError("Nhóm ngành đã tồn tại", 400);
  }
  const newCategory = await OccupationCategory.create({
    name,
    description,
    isActive: true,
  });
  return newCategory;
};
// Hàm lấy danh sách nhóm  ngành
export const getAll = async () => {
  return await OccupationCategory.find();
};
// Hàm cập nhật lại nhóm ngành nghề
export const update = async (data) => {
  const { _id, name, description, isActive } = data;
  const existCategory = await OccupationCategory.findById(_id);
  if (!existCategory) {
    throw new AppError("Nhóm ngành nghề này không tồn tại", 400);
  }
  if (name !== undefined) {
    const duplicateName = await OccupationCategory.findOne({
      name,
      _id: { $ne: _id },
    });
    if (duplicateName) {
      throw new AppError("Tên nhóm ngành nghề đã tồn tại", 400);
    }
  }
  const updateData = {};
  if (name !== undefined) {
    updateData.name = name;
  }
  if (description != undefined) {
    updateData.description = description;
  }
  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }
  const updatedCategory = await OccupationCategory.findByIdAndUpdate(
    _id,
    updateData,
    {
      new: true,
    },
  );
  return updatedCategory;
};
