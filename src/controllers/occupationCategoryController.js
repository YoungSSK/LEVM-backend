import * as occupationCategoryService from "../services/occupationCategoryService.js";

export const createOccupationCategory = async (req, res) => {
  try {
    const newCategory = await occupationCategoryService.create(
      req.validatedData,
    );
    return res.status(201).json({
      success: true,
      message: "Thêm mới nhóm ngành thành công",
      data: newCategory,
    });
  } catch (error) {
    console.error("Lỗi createOccupationCategory: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
export const getAllOccupationCategory = async (req, res) => {
  try {
    const result = await occupationCategoryService.getAll();
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi getAllOccupationCategory : ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
export const updateOccupationCategory = async (req, res) => {
  try {
    const updateCategory = await occupationCategoryService.update(
      req.validatedData,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật dữ liệu thành công",
      data: updateCategory,
    });
  } catch (error) {
    console.error("Lỗi updateOccupationCategory: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
