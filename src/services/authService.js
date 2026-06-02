import User from "../models/User.js";
import Session from "../models/Session.js";
import AppError from "../utils/AppError.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Biến cấu hình thời gian sống của token
const ACCESS_TOKEN_TTL = "30m"; // thời gian sống của access token
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // thời gian sống của refresh token (14 ngày)
// Service đăng ký
export const register = async (data) => {
  const { username, email, password } = data;
  //kiểm tra xem username đã tồn tại chưa
  const duplicateUsername = await User.findOne({ username });
  if (duplicateUsername) {
    throw new AppError("Tên người dùng đã tồn tại", 400);
  }
  //kiểm tra xem Email đã rồn tại chưa
  const duplicateEmail = await User.findOne({ email });
  if (duplicateEmail) {
    throw new AppError("Email đã được đăng ký", 400);
  }
  // mã hóa password
  const hashPassword = await bcrypt.hash(password, 10);
  // tạo User mới
  await User.create({
    username,
    displayName: username,
    email,
    hashPassword,
  });
};
// Service đăng nhập
export const login = async (data, ipAddress, userAgent) => {
  const { email, password } = data;
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new AppError("Username hoặc Password không đúng", 401);
  }
  const isMatch = await bcrypt.compare(password, user.hashPassword);
  if (!isMatch) {
    throw new AppError("Username hoặc Password không đúng", 401);
  }
  // Tạo access Token
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
  // Tạo refresh Token
  const refreshToken = crypto.randomBytes(64).toString("hex");
  // lưu refreshToken
  await Session.create({
    userId: user._id,
    refreshToken,
    ipAddress,
    userAgent,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
  });

  return { accessToken, refreshToken, user };
};
// Service đăng xuất
export const logout = async (refreshToken) => {
  if (!refreshToken) return;

  await Session.updateOne(
    { refreshToken, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        loggedOutAt: new Date(),
      },
    },
  );
};
// Service xử lý việc tạo mới accessToken
export const refreshToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Token không tồn tại", 401);
  }
  const session = await Session.findOne({
    refreshToken: refreshToken,
    isRevoked: false,
  });
  if (!session || session.expiresAt < new Date()) {
    throw new AppError("Token không hợp lệ hoặc hết hạn", 401);
  }
  const accessToken = jwt.sign(
    { userId: session.userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
  return { accessToken };
};
