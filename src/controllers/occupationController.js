import * as occupationService from "../services/occupationService.js";

// GET /api/occupations - Lấy tất cả occupations
export const getAllOccupations = async (req, res) => {
  try {
    const occupations = await occupationService.getAll();
    return res.status(200).json({
      success: true,
      data: occupations,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getOccupationsByCategory = async (req, res) => {
  try {
    const occupations = await occupationService.getByCategoryId(
      req.params.categoryId,
    );

    return res.status(200).json({
      success: true,
      data: occupations,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
export const createOccupation = async (req, res) => {
  try {
    const occupation = await occupationService.create(req.validatedData);

    return res.status(201).json({
      success: true,
      message: "Tạo ngành nghề thành công",
      data: occupation,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
export const updateOccupation = async (req, res) => {
  try {
    const occupation = await occupationService.update(
      req.params.id,
      req.validatedData,
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
      data: occupation,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
