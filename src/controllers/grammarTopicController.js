import * as grammarTopicService from "../services/grammarTopicService.js";

// Tạo chủ đề ngữ pháp mới
export const createGrammarTopic = async (req, res) => {
  try {
    const topic = await grammarTopicService.createGrammarTopic(
      req.validatedData,
    );

    return res.status(201).json({
      success: true,
      message: "Tạo chủ đề ngữ pháp thành công",
      data: topic,
    });
  } catch (error) {
    console.error("Lỗi createGrammarTopic:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy danh sách chủ đề ngữ pháp
export const getAllGrammarTopics = async (req, res) => {
  try {
    const options = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      search: req.query.search || "",
      sortBy: req.query.sortBy || "order",
      sortOrder: req.query.sortOrder || "asc",
    };

    if (req.query.isActive !== undefined) {
      options.isActive = req.query.isActive === "true";
    }

    const result = await grammarTopicService.getAllGrammarTopics(options);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi getAllGrammarTopics:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy chi tiết chủ đề theo ID
export const getGrammarTopicById = async (req, res) => {
  try {
    const topic = await grammarTopicService.getGrammarTopicById(
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    console.error("Lỗi getGrammarTopicById:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy chi tiết chủ đề theo slug
export const getGrammarTopicBySlug = async (req, res) => {
  try {
    const topic = await grammarTopicService.getGrammarTopicBySlug(
      req.params.slug,
    );

    return res.status(200).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    console.error("Lỗi getGrammarTopicBySlug:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Cập nhật chủ đề ngữ pháp
export const updateGrammarTopic = async (req, res) => {
  try {
    const topic = await grammarTopicService.updateGrammarTopic(
      req.params.id,
      req.validatedData,
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật chủ đề ngữ pháp thành công",
      data: topic,
    });
  } catch (error) {
    console.error("Lỗi updateGrammarTopic:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Xóa chủ đề ngữ pháp
export const deleteGrammarTopic = async (req, res) => {
  try {
    await grammarTopicService.deleteGrammarTopic(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Xóa chủ đề ngữ pháp thành công",
    });
  } catch (error) {
    console.error("Lỗi deleteGrammarTopic:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Tìm kiếm chủ đề ngữ pháp
export const searchGrammarTopics = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";

    const options = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    };

    if (req.query.isActive !== undefined) {
      options.isActive = req.query.isActive === "true";
    }

    const result = await grammarTopicService.searchGrammarTopics(
      keyword,
      options,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi searchGrammarTopics:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Thay đổi thứ tự hiển thị
export const changeTopicOrder = async (req, res) => {
  try {
    const topic = await grammarTopicService.changeTopicOrder(
      req.params.id,
      req.body.order,
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật thứ tự thành công",
      data: topic,
    });
  } catch (error) {
    console.error("Lỗi changeTopicOrder:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Thay đổi trạng thái hoạt động
export const changeTopicStatus = async (req, res) => {
  try {
    const topic = await grammarTopicService.changeTopicStatus(
      req.params.id,
      req.body.isActive,
    );

    return res.status(200).json({
      success: true,
      message: "Thay đổi trạng thái thành công",
      data: topic,
    });
  } catch (error) {
    console.error("Lỗi changeTopicStatus:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Cập nhật số lượng bài học
export const updateLessonCount = async (req, res) => {
  try {
    const topic = await grammarTopicService.updateLessonCount(
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật số lượng bài học thành công",
      data: topic,
    });
  } catch (error) {
    console.error("Lỗi updateLessonCount:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy danh sách chủ đề đang hoạt động
export const getActiveGrammarTopics = async (req, res) => {
  try {
    const topics = await grammarTopicService.getActiveGrammarTopics();

    return res.status(200).json({
      success: true,
      data: topics,
    });
  } catch (error) {
    console.error("Lỗi getActiveGrammarTopics:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// Lấy danh sách chủ đề kèm tiến độ học tập
export const getGrammarTopicsWithProgress = async (req, res) => {
  try {
    const result =
      await grammarTopicService.getGrammarTopicsWithProgress(
        req.user._id,
      );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi getGrammarTopicsWithProgress:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};