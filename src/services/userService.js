import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import bcrypt from "bcryptjs";
// lấy thông tin người dùng
export const fetchMe = async (userId) => {
  const user = await User.findById(userId).select("-hashPassword");
  if (!user) {
    throw new AppError("User không tồn tại", 404);
  }

  const plainUser = user.toObject();
  return {
    ...plainUser,
    displayName: plainUser.displayName || plainUser.username,
  };
};

//Hàm update profile
export const updateProfile = async (userId, data) => {
  if (Object.keys(data).length === 0) {
    throw new AppError("Vui lòng gửi ít nhất một trường để cập nhật ", 400);
  }
  const currentUser = await User.findById(userId);
  if (!currentUser) {
    throw new AppError("User không tồn tại", 404);
  }
  const payload = {};
  if (data.displayName !== undefined) payload.displayName = data.displayName;
  if (data.avatar !== undefined) payload.avatar = data.avatar;
  if (data.bio !== undefined) payload.bio = data.bio;
  if (data.occupationId !== undefined) payload.occupationId = data.occupationId;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: payload },
    { new: true, runValidators: true },
  ).select("-hashPassword");
  return updatedUser;
};
// Hàm change Password
export const changePassword = async (userId, data) => {
  const { oldPassword, newPassword } = data;
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User không tồn tại", 404);
  }
  const isMatch = await bcrypt.compare(oldPassword, user.hashPassword);
  if (!isMatch) {
    throw new AppError("Mật khẩu hiện tại không đúng", 401);
  }
  const isSamePassword = await bcrypt.compare(newPassword, user.hashPassword);
  if (isSamePassword) {
    throw new AppError("Mật khẩu mới phải khác mật khẩu hiện tại", 400);
  }
  const hashPassword = await bcrypt.hash(newPassword, 10);

  user.hashPassword = hashPassword;
  await user.save();
};
