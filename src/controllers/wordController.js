import * as wordService from "../services/wordService.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

//Create word
export const createWord = async (req, res) => {
  try {
    const word = await wordService.create(req.validatedData);

    return res.status(201).json({
      success: true,
      message: "Tạo từ vựng thành công",
      data: word,
    });
  } catch (error) {
    console.error("Lỗi createWord:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
//Update Data
export const updateWord = async (req, res) => {
  try {
    const word = await wordService.update(req.params.id, req.validatedData);
    return res.status(200).json({
      success: true,
      message: "Cập nhật từ vựng thành công",
      data: word,
    });
  } catch (error) {
    console.error("Lỗi updateWord:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
//Lấy word theo id hoặc slug
export const getWordById = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = objectIdRegex.test(id);
    const word = isObjectId
      ? await wordService.getById(id)
      : await wordService.getBySlug(id);
    return res.status(200).json({
      success: true,
      data: word,
    });
  } catch (error) {
    console.error("Lỗi getWordById:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
//Lấy word detail theo id hoặc slug
export const getWordDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = objectIdRegex.test(id);
    const word = isObjectId
      ? await wordService.getDetail(id)
      : await wordService.getDetailBySlug(id);
    return res.status(200).json({
      success: true,
      data: word,
    });
  } catch (error) {
    console.error("Lỗi getWordDetail:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
// Lay danh sach word
export const getAllWords = async (req, res) => {
  try {
    const page = req.validatedData?.page;
    const limit = req.validatedData?.limit;

    const result = await wordService.getAll(page, limit);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi getAllWords:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
// Tim kiem word
export const searchWords = async (req, res) => {
  try {
    const keyword = req.validatedData?.keyword;
    const words = await wordService.search(keyword);
    return res.status(200).json({
      success: true,
      data: words,
    });
  } catch (error) {
    console.error("Lỗi searchWords:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
// Thay doi trang thai word
export const changeWordStatus = async (req, res) => {
  try {
    // Service se dao trang thai theo gia tri hien tai client gui len
    const result = await wordService.changeStatus(
      req.params.id,
      req.validatedData?.isActive,
    );

    return res.status(200).json({
      success: true,
      message: "Thay đổi trạng thái thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi changeWordStatus:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Xoa tu vung
export const deleteWord = async (req, res) => {
  try {
    const word = await wordService.deleted(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Xóa từ vựng thành công",
      data: word,
    });
  } catch (error) {
    console.error("Lỗi deleteWord:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
