import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // lấy token từ header
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "Không tìm thấy Access token" });
    }
    const [schema, token] = authHeader.split(" "); // Bear <token>
    if (schema !== "Bearer") {
      return res.status(401).json({ message: "Cấu trúc token không hợp lệ" });
    }
    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy Accesstoken" });
    }
    // xác minh token
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });
    // tìm user
    const user = await User.findById(decoded.userId).select("-hashPassword");
    if (!user) {
      return res.status(401).json({ message: "User không tồn tại" });
    }
    //lưu user vào request
    req.user = user;
    next();
  } catch (error) {
    console.error("Lỗi khi xác minh JWT trong authMiddleware", error);
    return res.status(401).json({ message: "Lỗi hệ thống" });
  }
};
