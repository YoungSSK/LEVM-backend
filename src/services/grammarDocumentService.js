import mammoth from "mammoth";
import AppError from "../utils/AppError.js";

// Upload file và chuyển đổi sang HTML
export const uploadGrammarDocument = async (file) => {
  if (!file) {
    throw new AppError("Vui lòng chọn file DOCX", 400);
  }

  try {
    const result = await mammoth.convertToHtml({
      buffer: file.buffer,
    });

    // Loại bỏ HTML để phục vụ tìm kiếm
    const plainTextContent = result.value.replace(
      /<[^>]*>/g,
      " "
    );

    return {
      htmlContent: result.value,
      plainTextContent,
      warnings: result.messages,
    };
  } catch (error) {
    throw new AppError(
      "Không thể chuyển đổi file DOCX",
      500
    );
  }
};