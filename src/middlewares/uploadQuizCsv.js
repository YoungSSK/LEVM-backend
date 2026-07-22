import multer from "multer";
import AppError from "../utils/AppError.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ok =
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype === "application/csv" ||
    file.mimetype === "text/plain";
  if (ok) {
    cb(null, true);
  } else {
    cb(new AppError("Chỉ hỗ trợ file CSV", 400), false);
  }
};

const uploadQuizCsv = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export default uploadQuizCsv;
