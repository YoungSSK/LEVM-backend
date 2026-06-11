import { success } from "zod";
import * as vocabularyTopicService from "../services/vocabularyTopicService.js";
// Tạo chủ đề mới
export const createVocabularyTopic = async (req, res) => {
  try {
    const newTopic = await vocabularyTopicService.createTopic(
      req.validatedData,
    );
    return res.status(201).json({
      success: true,
      message: "Thêm chủ đề thành công",
      data: newTopic,
    });
  } catch (error) {
    console.error("Lỗi createVocabulary: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
// Lấy danh sách chủ đề
export const getAllVocabularyTopic = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await vocabularyTopicService.getAllTopic(page, limit);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi getAllTopic: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
// Lấy chi tiết chủ đề
export const getVocabularyTopicById = async (req, res) => {
  try {
    const topic = await vocabularyTopicService.getTopicById(req.params.id);
    return res.status(200).json({ success: true, data: topic });
  } catch (error) {
    console.error("Lỗi getTopicById: ");
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
// Cập nhật chủ đề
export const updatedVocabularyTopic = async (req, res) => {
  try {
    const updateTopic = await vocabularyTopicService.updateTopic(
      req.params.id,
      req.validatedData,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật chủ đề thành công",
      data: updateTopic,
    });
  } catch (error) {
    console.error("Lỗi updateTopic:", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
// Hàm xóa cứng
export const deletedVocabularyTopic = async (req, res) => {
  try {
    await vocabularyTopicService.deletedTopic(req.params.id);
    return res
      .status(200)
      .json({ success: true, message: "Xóa chủ đề thành công" });
  } catch (error) {
    console.error("Lỗi deletedTopic: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
// Hàm xóa mềm
export const changeStatus = async (req, res) => {
  try {
    const topic = await vocabularyTopicService.changeStatus(
      req.params.id,
      req.body.isActive,
    );
    return res.status(200).json({
      success: true,
      message: "Thay đổi trạng thái thành công",
      data: topic,
    });
  } catch (error) {
    console.error("Lỗi changeStatus:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
