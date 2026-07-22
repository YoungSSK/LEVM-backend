import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // lấy token từ header
    const authHeader = req.headers["authorization"];
    console.log("[AuthMiddleware] authHeader:", authHeader ? "present" : "missing");
    if (!authHeader) {
      console.log("[AuthMiddleware] No auth header - returning 401");
      return res.status(401).json({ message: "Không tìm thấy Access token" });
    }
    const [schema, token] = authHeader.split(" "); // Bear <token>
    if (schema !== "Bearer") {
      console.log("[AuthMiddleware] Wrong schema:", schema);
      return res.status(401).json({ message: "Cấu trúc token không hợp lệ" });
    }
    if (!token) {
      console.log("[AuthMiddleware] No token");
      return res.status(401).json({ message: "Không tìm thấy Accesstoken" });
    }
    // xác minh token
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          console.log("[AuthMiddleware] Token verify error:", err.message);
          return reject(err);
        }
        resolve(decoded);
      });
    });
    console.log("[AuthMiddleware] Token verified, userId:", decoded.userId);
    // tìm user
    const user = await User.findById(decoded.userId).select("-hashPassword");
    if (!user) {
      console.log("[AuthMiddleware] User not found");
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
