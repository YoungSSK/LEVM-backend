/**
 * Chuẩn hóa response khi có lỗi.
 * Dùng trong tất cả controller để đảm bảo format thống nhất:
 * {
 *   success: false,
 *   message: string,
 *   code?: string,       // mã lỗi tùy chỉnh (tuỳ mục đích)
 *   errors?: any,        // chi tiết validation errors (Zod/sequelize)
 * }
 *
 * @param {object} res     Express response
 * @param {Error}  error   AppError hoặc Error thường
 * @param {object} extras   Các trường bổ sung (code, errors, v.v.)
 */
export const sendError = (res, error, extras = {}) => {
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || "Lỗi hệ thống";

  const body = {
    success: false,
    message,
  };

  if (error.code && typeof error.code === "string") {
    body.code = error.code;
  }

  // Zod validation errors
  if (error.errors && Array.isArray(error.errors)) {
    body.errors = error.errors;
    body.code = body.code || "VALIDATION_ERROR";
  }

  // Sequelize / Mongoose validation errors
  if (error.name === "ValidationError" && error.errors) {
    body.errors = Object.values(error.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    body.code = body.code || "VALIDATION_ERROR";
  }

  // MongoDB duplicate key error
  if (error.code === 11000) {
    body.code = "DUPLICATE_KEY";
    body.message = "Dữ liệu đã tồn tại (trùng khóa)";
  }

  // Merge extras last (cho phép ghi đè code/message nếu cần)
  Object.assign(body, extras);

  return res.status(statusCode).json(body);
};

/**
 * Chuẩn hóa response thành công.
 * @param {object} res
 * @param {number} statusCode
 * @param {string} message
 * @param {any}    data
 */
export const sendSuccess = (res, statusCode = 200, message, data) => {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};
