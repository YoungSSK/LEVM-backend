import multer from "multer";
import AppError from "../utils/AppError.js";

// Lưu file trong RAM
const storage = multer.memoryStorage();

// Kiểm tra định dạng file
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Chỉ hỗ trợ file DOCX", 400), false);
  }
};

const uploadGrammarDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export default uploadGrammarDocument;
