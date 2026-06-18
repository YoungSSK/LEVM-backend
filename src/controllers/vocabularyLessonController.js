import * as vocabularyLessonService from "../services/vocabularyLessonService.js";

// Tạo bài học mới
export const createVocabularyLesson = async (req, res) => {
  try {
    const lesson = await vocabularyLessonService.createLesson({
      ...req.validatedData,
      topicId: req.params.topicId,
    });
    return res
      .status(201)
      .json({ success: true, message: "Tạo bài học thành công", data: lesson });
  } catch (error) {
    console.error("Lỗi createLesson: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
//Lấy chi tiết bài học
export const getVocabularyLessonById = async (req, res) => {
  try {
    const lesson = await vocabularyLessonService.getById(req.params.id);
    return res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    console.error("Lỗi getVocabularyLesson: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
//Lấy danh sách theo topic
export const getVocabularyLessonByTopic = async (req, res) => {
  try {
    const lessons = await vocabularyLessonService.getByTopic(
      req.params.topicId,
    );
    return res.status(200).json({ success: true, data: lessons });
  } catch (error) {
    console.error("Lỗi getLessonByTopic: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
//cập nhật bài học
export const updateVocabularyLesson = async (req, res) => {
  try {
    const lesson = await vocabularyLessonService.updateLesson(
      req.params.id,
      req.validatedData,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật bài học thành công",
      data: lesson,
    });
  } catch (error) {
    console.error("Lỗi updateVocabularyLesson: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
//Xóa bài học
export const deleteVocabularyLesson = async (req, res) => {
  try {
    await vocabularyLessonService.deleteLesson(req.params.id);
    return res
      .status(200)
      .json({ success: true, message: "Xóa bài học thành công" });
  } catch (error) {
    console.error("Lỗi deleteVocabularyLesson: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
//Thêm từ vào bài học
export const addWordToLesson = async (req, res) => {
  try {
    await vocabularyLessonService.addWord(
      req.params.lessonId,
      req.body.wordId,
      req.body.wordMeaningId,
    );
    return res
      .status(200)
      .json({ success: true, message: "Thêm từ vào bài học thành công" });
  } catch (error) {
    console.error("Lỗi addWordToLesson: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
//Xóa từ khỏi bài học
export const removeWordFromLesson = async (req, res) => {
  try {
    await vocabularyLessonService.removeWord(
      req.params.lessonId,
      req.params.wordId,
    );
    return res
      .status(200)
      .json({ success: true, message: "Xóa bài học thành công" });
  } catch (error) {
    console.error("Lỗi removeWordFromLesson: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
//Lấy danh sách từ trong bài học
export const getLessonWords = async (req, res) => {
  try {
    const words = await vocabularyLessonService.getWord(req.params.lessonId);
    return res.status(200).json({ success: true, data: words });
  } catch (error) {
    console.error("Lỗi getLessonWords:", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
//Thay đổi thứ tự bài học
export const changeLessonOrder = async (req, res) => {
  try {
    await vocabularyLessonService.changeOrder(
      req.params.topicId,
      req.body.orders,
    );
    return res
      .status(200)
      .json({ success: true, message: "Cập nhật thứ tự thành công" });
  } catch (error) {
    console.error("Lỗi changeLessonOrder:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
// Thay đổi trạng thái bài học
export const changeLessonStatus = async (req, res) => {
  try {
    const result = await vocabularyLessonService.changeStatus(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Thay đổi trạng thái thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi changeLessonStatus:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
