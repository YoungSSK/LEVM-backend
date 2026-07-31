import multer from "multer";
import AppError from "../utils/AppError.js";

// Lưu file trong RAM — không ghi ra disk
const storage = multer.memoryStorage();

// Chỉ chấp nhận file DOCX
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Chỉ hỗ trợ file DOCX (.docx)", 400), false);
  }
};

const uploadReadingDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export default uploadReadingDocument;
