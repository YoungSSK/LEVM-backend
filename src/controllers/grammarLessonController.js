import * as grammarLessonService from "../services/grammarLessonService.js";
import * as grammarDocumentService from "../services/grammarDocumentService.js";

// Tạo bài học ngữ pháp mới
export const createGrammarLesson = async (req, res) => {
  try {
    const lesson = await grammarLessonService.createGrammarLesson(
      req.validatedData || req.body,
    );

    return res.status(201).json({
      success: true,
      message: "Tạo bài học ngữ pháp thành công",
      data: lesson,
    });
  } catch (error) {
    console.error("Lỗi createGrammarLesson:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Cập nhật bài học ngữ pháp
export const updateGrammarLesson = async (req, res) => {
  try {
    const lesson = await grammarLessonService.updateGrammarLesson(
      req.params.id,
      req.validatedData || req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật bài học ngữ pháp thành công",
      data: lesson,
    });
  } catch (error) {
    console.error("Lỗi updateGrammarLesson:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Xóa bài học ngữ pháp
export const deleteGrammarLesson = async (req, res) => {
  try {
    await grammarLessonService.deleteGrammarLesson(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Xóa bài học ngữ pháp thành công",
    });
  } catch (error) {
    console.error("Lỗi deleteGrammarLesson:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Cập nhật nội dung lý thuyết (autosave editor)
export const updateGrammarLessonContent = async (req, res) => {
  try {
    const result = await grammarLessonService.updateGrammarLessonContent(
      req.params.id,
      req.validatedData || req.body,
      req.user?._id,
    );

    return res.status(200).json({
      success: true,
      message: "Đã lưu nội dung",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi updateGrammarLessonContent:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy chi tiết bài học ngữ pháp theo ID
export const getGrammarLessonById = async (req, res) => {
  try {
    const lesson = await grammarLessonService.getGrammarLessonById(
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error("Lỗi getGrammarLessonById:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy chi tiết bài học ngữ pháp theo Slug
export const getGrammarLessonBySlug = async (req, res) => {
  try {
    const lesson = await grammarLessonService.getGrammarLessonBySlug(
      req.params.slug,
    );

    return res.status(200).json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error("Lỗi getGrammarLessonBySlug:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy danh sách tất cả bài học ngữ pháp
export const getAllGrammarLessons = async (req, res) => {
  try {
    const options = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      search: req.query.search || "",
      topicId: req.query.topicId || undefined,
      sortBy: req.query.sortBy || "order",
      sortOrder: req.query.sortOrder || "asc",
    };

    if (req.query.isActive !== undefined) {
      options.isActive = req.query.isActive === "true";
    }

    if (req.query.isPublished !== undefined) {
      options.isPublished = req.query.isPublished === "true";
    }

    const result = await grammarLessonService.getAllGrammarLessons(options);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi getAllGrammarLessons:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy danh sách bài học theo chủ đề
export const getLessonsByTopic = async (req, res) => {
  try {
    const options = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sortBy: req.query.sortBy || "order",
      sortOrder: req.query.sortOrder || "asc",
    };

    if (req.query.isActive !== undefined) {
      options.isActive = req.query.isActive === "true";
    }

    if (req.query.isPublished !== undefined) {
      options.isPublished = req.query.isPublished === "true";
    }

    const result = await grammarLessonService.getLessonsByTopic(
      req.params.topicId,
      options,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi getLessonsByTopic:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Tìm kiếm bài học ngữ pháp
export const searchGrammarLessons = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const options = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      topicId: req.query.topicId || undefined,
    };

    if (req.query.isActive !== undefined) {
      options.isActive = req.query.isActive === "true";
    }

    if (req.query.isPublished !== undefined) {
      options.isPublished = req.query.isPublished === "true";
    }

    const result = await grammarLessonService.searchGrammarLessons(
      keyword,
      options,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi searchGrammarLessons:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Thay đổi thứ tự bài học
export const changeLessonOrder = async (req, res) => {
  try {
    const lesson = await grammarLessonService.changeLessonOrder(
      req.params.id,
      req.body.order,
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật thứ tự thành công",
      data: lesson,
    });
  } catch (error) {
    console.error("Lỗi changeLessonOrder:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Cập nhật trạng thái xuất bản
export const changePublishStatus = async (req, res) => {
  try {
    const lesson = await grammarLessonService.changePublishStatus(
      req.params.id,
      req.body.isPublished,
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái xuất bản thành công",
      data: lesson,
    });
  } catch (error) {
    console.error("Lỗi changePublishStatus:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Cập nhật trạng thái hoạt động
export const changeLessonStatus = async (req, res) => {
  try {
    const lesson = await grammarLessonService.changeLessonStatus(
      req.params.id,
      req.body.isActive,
    );

    return res.status(200).json({
      success: true,
      message: "Thay đổi trạng thái thành công",
      data: lesson,
    });
  } catch (error) {
    console.error("Lỗi changeLessonStatus:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy danh sách bài học đang được xuất bản (Mobile App)
export const getPublishedLessons = async (req, res) => {
  try {
    const lessons = await grammarLessonService.getPublishedLessons();

    return res.status(200).json({
      success: true,
      data: lessons,
    });
  } catch (error) {
    console.error("Lỗi getPublishedLessons:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy danh sách bài học đang hoạt động theo chủ đề (Mobile App)
export const getActiveLessonsByTopic = async (req, res) => {
  try {
    const result = await grammarLessonService.getActiveLessonsByTopic(
      req.params.topicId,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi getActiveLessonsByTopic:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy bài học kế tiếp trong cùng chủ đề
export const getNextLesson = async (req, res) => {
  try {
    const result = await grammarLessonService.getNextLesson(req.params.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi getNextLesson:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy bài học trước đó trong cùng chủ đề (Mobile App)
export const getPreviousLesson = async (req, res) => {
  try {
    const result = await grammarLessonService.getPreviousLesson(req.params.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi getPreviousLesson:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Tạo bài học ngữ pháp mới từ tài liệu Word (DOCX)
export const createGrammarLessonFromDocument = async (req, res) => {
  try {
    const documentResult = await grammarDocumentService.uploadGrammarDocument(
      req.file,
    );

    const validatedData = req.validatedData || req.body;
    const lessonData = {
      ...validatedData,
      htmlContent: documentResult.htmlContent,
      plainTextContent: documentResult.plainTextContent,
    };

    const lesson = await grammarLessonService.createGrammarLesson(lessonData);

    return res.status(201).json({
      success: true,
      message: "Tạo bài học từ tài liệu thành công",
      data: lesson,
    });
  } catch (error) {
    console.error("Lỗi createGrammarLessonFromDocument:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Upload file và cập nhật nội dung bài học đã tồn tại
export const updateGrammarLessonFromDocument = async (req, res) => {
  try {
    const documentResult = await grammarDocumentService.uploadGrammarDocument(
      req.file,
    );

    const validatedData = req.validatedData || {};
    const updateData = {
      ...validatedData,
      htmlContent: documentResult.htmlContent,
      plainTextContent: documentResult.plainTextContent,
    };

    const lesson = await grammarLessonService.updateGrammarLesson(
      req.params.id,
      updateData,
    );

    return res.status(200).json({
      success: true,
      message: "Upload và cập nhật nội dung thành công",
      data: lesson,
    });
  } catch (error) {
    console.error("Lỗi updateGrammarLessonFromDocument:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

