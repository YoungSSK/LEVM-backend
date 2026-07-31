import * as readingPassageService from "../services/readingPassageService.js";
import * as grammarDocumentService from "../services/grammarDocumentService.js";

// ===== Read =====

export const getAllReadingPassages = async (req, res) => {
  try {
    const options = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      search: req.query.search || "",
      categoryId: req.query.categoryId || undefined,
      status: req.query.status || undefined,
      difficulty: req.query.difficulty || undefined,
      cefrLevel: req.query.cefrLevel || undefined,
      readingType: req.query.readingType || undefined,
      tags: req.query.tags || undefined,
      sortBy: req.query.sortBy || "order",
      sortOrder: req.query.sortOrder || "asc",
    };
    const result = await readingPassageService.getAllReadingPassages(options);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi getAllReadingPassages:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getReadingPassageById = async (req, res) => {
  try {
    const passage = await readingPassageService.getReadingPassageById(
      req.params.id,
    );
    return res.status(200).json({ success: true, data: passage });
  } catch (error) {
    console.error("Lỗi getReadingPassageById:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getReadingPassageBySlug = async (req, res) => {
  try {
    const passage = await readingPassageService.getReadingPassageBySlug(
      req.params.slug,
    );
    return res.status(200).json({ success: true, data: passage });
  } catch (error) {
    console.error("Lỗi getReadingPassageBySlug:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getPassagesByCategory = async (req, res) => {
  try {
    const options = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      status: req.query.status || undefined,
      sortBy: req.query.sortBy || "order",
      sortOrder: req.query.sortOrder || "asc",
    };
    const result = await readingPassageService.getPassagesByCategory(
      req.params.categoryId,
      options,
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi getPassagesByCategory:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getPublishedPassages = async (req, res) => {
  try {
    const options = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      categoryId: req.query.categoryId || undefined,
      difficulty: req.query.difficulty || undefined,
      cefrLevel: req.query.cefrLevel || undefined,
      sortBy: req.query.sortBy || "publishedAt",
      sortOrder: req.query.sortOrder || "desc",
    };
    const result = await readingPassageService.getPublishedPassages(options);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi getPublishedPassages:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// ===== Create =====

export const createReadingPassage = async (req, res) => {
  try {
    const passage = await readingPassageService.createReadingPassage(
      req.validatedData || req.body,
      req.user?._id,
    );
    return res.status(201).json({
      success: true,
      message: "Tạo bài đọc thành công",
      data: passage,
    });
  } catch (error) {
    console.error("Lỗi createReadingPassage:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

/**
 * Preview DOCX — parse file, trả HTML + text mà KHÔNG lưu DB.
 * FE dùng để preview trước khi confirm tạo passage.
 */
export const previewDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload file DOCX",
      });
    }
    const result = await grammarDocumentService.uploadGrammarDocument(req.file);
    return res.status(200).json({
      success: true,
      message: "Parse DOCX thành công",
      data: {
        htmlContent: result.htmlContent,
        plainText: result.plainTextContent || "",
        wordCount: (result.plainTextContent || "")
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 0).length,
        warnings: result.warnings || [],
      },
    });
  } catch (error) {
    console.error("Lỗi previewDocument:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const createReadingPassageFromDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload file DOCX",
      });
    }
    const docResult = await grammarDocumentService.uploadGrammarDocument(
      req.file,
    );
    const passageData = {
      ...(req.validatedData || req.body),
      htmlContent: docResult.htmlContent,
      plainText: docResult.plainTextContent || "",
    };
    const passage = await readingPassageService.createReadingPassage(
      passageData,
      req.user?._id,
    );
    return res.status(201).json({
      success: true,
      message: "Tạo bài đọc từ DOCX thành công",
      data: passage,
    });
  } catch (error) {
    console.error("Lỗi createReadingPassageFromDocument:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const updateReadingPassageFromDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload file DOCX",
      });
    }
    const docResult = await grammarDocumentService.uploadGrammarDocument(
      req.file,
    );

    // Lấy dữ liệu metadata từ body (nếu có), rồi merge với htmlContent mới
    const updateData = {
      ...(req.validatedData || {}),
      htmlContent: docResult.htmlContent,
      plainText: docResult.plainTextContent || "",
    };

    const passage = await readingPassageService.updateReadingPassage(
      req.params.id,
      updateData,
      req.user?._id,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật nội dung từ DOCX thành công",
      data: passage,
    });
  } catch (error) {
    console.error("Lỗi updateReadingPassageFromDocument:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// ===== Update =====

export const updateReadingPassage = async (req, res) => {
  try {
    const passage = await readingPassageService.updateReadingPassage(
      req.params.id,
      req.validatedData || req.body,
      req.user?._id,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật bài đọc thành công",
      data: passage,
    });
  } catch (error) {
    console.error("Lỗi updateReadingPassage:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const updateReadingPassageContent = async (req, res) => {
  try {
    const result = await readingPassageService.updatePassageContent(
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
    console.error("Lỗi updateReadingPassageContent:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const changePassageStatus = async (req, res) => {
  try {
    const { status } = req.validatedData || req.body;
    const passage = await readingPassageService.changePassageStatus(
      req.params.id,
      status,
      req.user?._id,
    );
    return res.status(200).json({
      success: true,
      message: `Đã chuyển trạng thái bài đọc sang "${status}"`,
      data: {
        passageId: passage._id,
        status: passage.status,
        publishedAt: passage.publishedAt,
      },
    });
  } catch (error) {
    console.error("Lỗi changePassageStatus:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const changePassageOrder = async (req, res) => {
  try {
    const { order } = req.validatedData || req.body;
    const passage = await readingPassageService.changePassageOrder(
      req.params.id,
      order,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật thứ tự thành công",
      data: { passageId: passage._id, order: passage.order },
    });
  } catch (error) {
    console.error("Lỗi changePassageOrder:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const clonePassage = async (req, res) => {
  try {
    const cloned = await readingPassageService.clonePassage(
      req.params.id,
      req.user?._id,
    );
    return res.status(201).json({
      success: true,
      message: "Clone bài đọc thành công",
      data: cloned,
    });
  } catch (error) {
    console.error("Lỗi clonePassage:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// ===== Delete =====

export const deleteReadingPassage = async (req, res) => {
  try {
    await readingPassageService.deleteReadingPassage(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Xóa bài đọc thành công",
    });
  } catch (error) {
    console.error("Lỗi deleteReadingPassage:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
