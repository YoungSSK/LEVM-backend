import multer from "multer";
import path from "path";
import AppError from "../utils/AppError.js";

const ALLOWED_FORMATS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_FORMATS.includes(ext)) {
    return cb(
      new AppError(
        `Định dạng không được hỗ trợ. Cho phép: ${ALLOWED_FORMATS.join(", ")}`,
        400
      ),
      false
    );
  }
  
  cb(null, true);
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE,
  },
});

export default uploadAvatar.single("avatar");
