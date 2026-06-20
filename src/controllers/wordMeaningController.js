import * as wordMeaningService from "../services/wordMeaningService.js";

// Tạo nghĩa mới
export const createMeaning = async (req, res) => {
  try {
    const meaning = await wordMeaningService.createMeaning({
      ...req.validatedData,
      wordId: req.params.wordId,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo nghĩa thành công",
      data: meaning,
    });
  } catch (error) {
    console.error("Lỗi createMeaning:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Cập nhật thông tin nghĩa
export const updateMeaning = async (req, res) => {
  try {
    const meaning = await wordMeaningService.updateMeaning(
      req.params.id,
      req.validatedData,
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật nghĩa thành công",
      data: meaning,
    });
  } catch (error) {
    console.error("Lỗi updateMeaning:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Xóa nghĩa
export const deleteMeaning = async (req, res) => {
  try {
    await wordMeaningService.deleteMeaning(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Xóa nghĩa thành công",
    });
  } catch (error) {
    console.error("Lỗi deleteMeaning:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy thông tin nghĩa theo ID
export const getMeaningById = async (req, res) => {
  try {
    const meaning = await wordMeaningService.getMeaningById(req.params.id);

    return res.status(200).json({
      success: true,
      data: meaning,
    });
  } catch (error) {
    console.error("Lỗi getMeaningById:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy danh sách nghĩa của một từ vựng
export const getMeaningByWord = async (req, res) => {
  try {
    const meanings = await wordMeaningService.getMeaningByWord(
      req.params.wordId,
    );

    return res.status(200).json({
      success: true,
      data: meanings,
    });
  } catch (error) {
    console.error("Lỗi getMeaningByWord:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Đặt nghĩa chính cho từ vựng
export const setPrimary = async (req, res) => {
  try {
    const meaning = await wordMeaningService.setPrimary(
      req.params.wordId,
      req.params.meaningId,
    );

    return res.status(200).json({
      success: true,
      message: "Đặt nghĩa chính thành công",
      data: meaning,
    });
  } catch (error) {
    console.error("Lỗi setPrimary:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Thay đổi trạng thái nghĩa
export const changeMeaningStatus = async (req, res) => {
  try {
    const result = await wordMeaningService.changeMeaningStatus(
      req.params.id,
      req.validatedData?.isActive,
    );

    return res.status(200).json({
      success: true,
      message: "Thay đổi trạng thái nghĩa thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi changeMeaningStatus:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
