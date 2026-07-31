import * as readingCategoryService from "../services/readingCategoryService.js";

export const createReadingCategory = async (req, res) => {
  try {
    const category = await readingCategoryService.createReadingCategory(
      req.validatedData || req.body,
    );
    return res.status(201).json({
      success: true,
      message: "Tạo danh mục Reading thành công",
      data: category,
    });
  } catch (error) {
    console.error("Lỗi createReadingCategory:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const updateReadingCategory = async (req, res) => {
  try {
    const category = await readingCategoryService.updateReadingCategory(
      req.params.id,
      req.validatedData || req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật danh mục thành công",
      data: category,
    });
  } catch (error) {
    console.error("Lỗi updateReadingCategory:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const deleteReadingCategory = async (req, res) => {
  try {
    await readingCategoryService.deleteReadingCategory(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Xóa danh mục thành công",
    });
  } catch (error) {
    console.error("Lỗi deleteReadingCategory:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getReadingCategoryById = async (req, res) => {
  try {
    const category = await readingCategoryService.getReadingCategoryById(
      req.params.id,
    );
    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    console.error("Lỗi getReadingCategoryById:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getReadingCategoryBySlug = async (req, res) => {
  try {
    const category = await readingCategoryService.getReadingCategoryBySlug(
      req.params.slug,
    );
    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    console.error("Lỗi getReadingCategoryBySlug:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const getAllReadingCategories = async (req, res) => {
  try {
    const options = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search || "",
      sortBy: req.query.sortBy || "order",
      sortOrder: req.query.sortOrder || "asc",
    };
    if (req.query.isActive !== undefined) {
      options.isActive = req.query.isActive === "true";
    }
    const result = await readingCategoryService.getAllReadingCategories(options);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi getAllReadingCategories:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const toggleCategoryStatus = async (req, res) => {
  try {
    const { isActive } = req.validatedData || req.body;
    const category = await readingCategoryService.toggleCategoryStatus(
      req.params.id,
      isActive,
    );
    return res.status(200).json({
      success: true,
      message: `Danh mục đã ${isActive ? "kích hoạt" : "ẩn"}`,
      data: { categoryId: category._id, isActive: category.isActive },
    });
  } catch (error) {
    console.error("Lỗi toggleCategoryStatus:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
