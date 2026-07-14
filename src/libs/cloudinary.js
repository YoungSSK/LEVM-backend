import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// ⚠️ Bắt buộc load `.env` TRƯỚC khi gọi `cloudinary.config()` vì
// `cloudinary.config()` đọc `process.env` ngay tại thời điểm được gọi.
// Nếu chỉ gọi `dotenv.config()` ở `server.js` (sau các import), config
// sẽ thất bại trên mọi module import `cloudinary` gián tiếp (vd upload
// avatar) với lỗi `Must supply api_key`.
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
