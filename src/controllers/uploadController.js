import * as cloudinaryService from "../services/cloudinaryService.js";

/**
 * Handle image upload
 * POST /api/upload/image
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng gửi file ảnh",
      });
    }

    const folder = req.body.folder || "general";
    const result = await cloudinaryService.uploadImage(req.file.path, { folder });

    return res.status(201).json({
      success: true,
      message: "Upload ảnh thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi upload ảnh:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

/**
 * Handle audio upload
 * POST /api/upload/audio
 */
export const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng gửi file audio",
      });
    }

    const folder = req.body.folder || "audio";
    const result = await cloudinaryService.uploadAudio(req.file.path, { folder });

    return res.status(201).json({
      success: true,
      message: "Upload audio thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi upload audio:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

/**
 * Handle upload from URL
 * POST /api/upload/url
 */
export const uploadFromUrl = async (req, res) => {
  try {
    const { url, resourceType, folder } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp URL",
      });
    }

    const type = resourceType || "image";
    const uploadFolder = folder || "general";

    const result = await cloudinaryService.uploadFromUrl(url, type, { folder: uploadFolder });

    return res.status(201).json({
      success: true,
      message: "Upload từ URL thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi upload từ URL:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

/**
 * Delete file
 * DELETE /api/upload/:publicId
 */
export const deleteFile = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType } = req.query;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp publicId",
      });
    }

    const type = resourceType || "image";
    const result = await cloudinaryService.deleteFile(publicId, type);

    return res.status(200).json({
      success: true,
      message: "Xóa file thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi xóa file:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

/**
 * Get file info
 * GET /api/upload/info/:publicId
 */
export const getFileInfo = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType } = req.query;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp publicId",
      });
    }

    const type = resourceType || "image";
    const result = await cloudinaryService.getFileInfo(publicId, type);

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin file thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin file:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

/**
 * Generate transformed URL
 * GET /api/upload/transform
 */
export const generateTransformUrl = async (req, res) => {
  try {
    const { publicId, resourceType, transformations } = req.query;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp publicId",
      });
    }

    const type = resourceType || "image";
    const transforms = transformations ? JSON.parse(transformations) : [];

    const url = cloudinaryService.generateTransformUrl(publicId, transforms, type);

    return res.status(200).json({
      success: true,
      message: "Tạo URL transform thành công",
      data: { url },
    });
  } catch (error) {
    console.error("Lỗi tạo URL transform:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
