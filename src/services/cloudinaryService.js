import cloudinary from "../libs/cloudinary.js";
import AppError from "../utils/AppError.js";

// Allowed file formats
const ALLOWED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "svg"];
const ALLOWED_AUDIO_FORMATS = ["mp3"];

// Maximum file sizes (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 15 * 1024 * 1024; // 15MB

/**
 * Extract standard response data from Cloudinary result
 * @param {Object} result - Cloudinary upload result
 * @returns {Object} Standardized response object
 */
const extractResponseData = (result) => {
  const data = {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    resourceType: result.resource_type,
    format: result.format,
    bytes: result.bytes,
    createdAt: result.created_at,
  };

  // Add image-specific fields
  if (result.resource_type === "image") {
    data.width = result.width;
    data.height = result.height;
  }

  // Add audio-specific fields if available
  if (result.duration) {
    data.duration = result.duration;
  }

  return data;
};

/**
 * Validate image file format
 * @param {string} format - File format
 * @throws {AppError} If format is not allowed
 */
const validateImageFormat = (format) => {
  const normalizedFormat = format.toLowerCase();
  if (!ALLOWED_IMAGE_FORMATS.includes(normalizedFormat)) {
    throw new AppError(
      `Định dạng ảnh không được hỗ trợ. Cho phép: ${ALLOWED_IMAGE_FORMATS.join(", ")}`,
      400
    );
  }
};

/**
 * Validate audio file format
 * @param {string} format - File format
 * @throws {AppError} If format is not allowed
 */
const validateAudioFormat = (format) => {
  const normalizedFormat = format.toLowerCase();
  if (!ALLOWED_AUDIO_FORMATS.includes(normalizedFormat)) {
    throw new AppError(
      `Định dạng âm thanh không được hỗ trợ. Cho phép: ${ALLOWED_AUDIO_FORMATS.join(", ")}`,
      400
    );
  }
};

/**
 * Validate file size
 * @param {number} bytes - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes
 * @param {string} type - File type for error message
 * @throws {AppError} If size exceeds limit
 */
const validateFileSize = (bytes, maxSize, type) => {
  if (bytes > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    throw new AppError(
      `Kích thước file ${type} vượt quá giới hạn. Tối đa: ${maxMB}MB`,
      400
    );
  }
};

/**
 * Upload image file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with standard response data
 */
export const uploadImage = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "image",
      folder: options.folder || "general",
      transformation: options.transformation || [],
      ...options,
    });

    validateImageFormat(result.format);
    validateFileSize(result.bytes, MAX_IMAGE_SIZE, "ảnh");

    return extractResponseData(result);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Upload ảnh thất bại: ${error.message}`, 500);
  }
};

/**
 * Upload audio file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with standard response data
 */
export const uploadAudio = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "video", // Cloudinary uses 'video' resource type for audio files
      folder: options.folder || "audio",
      transformation: options.transformation || [],
      ...options,
    });

    validateAudioFormat(result.format);
    validateFileSize(result.bytes, MAX_AUDIO_SIZE, "audio");

    return extractResponseData(result);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Upload audio thất bại: ${error.message}`, 500);
  }
};

/**
 * Upload file from Buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} resourceType - Resource type ('image' or 'video' for audio)
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with standard response data
 */
export const uploadBuffer = async (buffer, resourceType = "image", options = {}) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: resourceType,
            folder: options.folder || "general",
            ...options,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    if (resourceType === "image") {
      validateImageFormat(result.format);
      validateFileSize(result.bytes, MAX_IMAGE_SIZE, "ảnh");
    } else {
      validateAudioFormat(result.format);
      validateFileSize(result.bytes, MAX_AUDIO_SIZE, "audio");
    }

    return extractResponseData(result);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Upload buffer thất bại: ${error.message}`, 500);
  }
};

/**
 * Upload file directly from URL to Cloudinary
 * @param {string} url - Source URL of the file
 * @param {string} resourceType - Resource type ('image' or 'video')
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with standard response data
 */
export const uploadFromUrl = async (url, resourceType = "image", options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(url, {
      resource_type: resourceType,
      folder: options.folder || "general",
      ...options,
    });

    if (resourceType === "image") {
      validateImageFormat(result.format);
      validateFileSize(result.bytes, MAX_IMAGE_SIZE, "ảnh");
    } else {
      validateAudioFormat(result.format);
      validateFileSize(result.bytes, MAX_AUDIO_SIZE, "audio");
    }

    return extractResponseData(result);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Upload từ URL thất bại: ${error.message}`, 500);
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Resource type ('image', 'video', 'raw')
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFile = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== "ok") {
      throw new AppError(`Xóa file thất bại: ${result.result}`, 400);
    }

    return {
      success: true,
      publicId,
      message: "Xóa file thành công",
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Xóa file thất bại: ${error.message}`, 500);
  }
};

/**
 * Rename file in Cloudinary
 * @param {string} oldPublicId - Current public ID
 * @param {string} newPublicId - New public ID
 * @param {string} resourceType - Resource type
 * @returns {Promise<Object>} Rename result
 */
export const renameFile = async (oldPublicId, newPublicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.rename(oldPublicId, newPublicId, {
      resource_type: resourceType,
      overwrite: false,
    });

    return {
      success: true,
      oldPublicId,
      newPublicId: result.public_id,
      secureUrl: result.secure_url,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Đổi tên file thất bại: ${error.message}`, 500);
  }
};

/**
 * Get file metadata from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Resource type
 * @returns {Promise<Object>} File metadata
 */
export const getFileInfo = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });

    return extractResponseData(result);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Lấy thông tin file thất bại: ${error.message}`, 500);
  }
};

/**
 * Generate transformed URL for existing file
 * @param {string} publicId - Public ID of the file
 * @param {Array} transformations - Array of transformation objects
 * @param {string} resourceType - Resource type
 * @returns {string} Transformed URL
 */
export const generateTransformUrl = (publicId, transformations = [], resourceType = "image") => {
  try {
    const url = cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      transformation: transformations,
    });

    return url;
  } catch (error) {
    throw new AppError(`Tạo URL transform thất bại: ${error.message}`, 500);
  }
};

/**
 * Batch delete multiple files
 * @param {Array<string>} publicIds - Array of public IDs
 * @param {string} resourceType - Resource type
 * @returns {Promise<Object>} Batch deletion result
 */
export const deleteMultipleFiles = async (publicIds, resourceType = "image") => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
    });

    return {
      success: true,
      deleted: Object.keys(result.deleted || {}).length,
      details: result.deleted,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Xóa nhiều file thất bại: ${error.message}`, 500);
  }
};
