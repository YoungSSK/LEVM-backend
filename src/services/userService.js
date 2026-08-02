import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import bcrypt from "bcryptjs";
import * as cloudinaryService from "./cloudinaryService.js";
import fs from "fs";

/// Trả về plain object user kèm `occupationCategoryName` (populate thủ công
/// từ `OccupationCategory`) để client hiển thị mà không cần gọi thêm API.
const populateOccupationCategoryName = async (userDoc) => {
  if (!userDoc) return userDoc;
  const plain =
    typeof userDoc.toObject === "function" ? userDoc.toObject() : userDoc;
  if (!plain.occupationCategoryId) {
    return { ...plain, occupationCategoryName: null };
  }

  try {
    const { default: OccupationCategory } = await import(
      "../models/OccupationCategory.js"
    );
    const cat = await OccupationCategory.findById(plain.occupationCategoryId)
      .select("name")
      .lean();
    return {
      ...plain,
      occupationCategoryName: cat ? cat.name : null,
    };
  } catch {
    return { ...plain, occupationCategoryName: null };
  }
};

// lấy thông tin người dùng
export const fetchMe = async (userId) => {
  const user = await User.findById(userId)
    .select("-hashPassword")
    .populate("currentPackageId", "name slug level price");
  if (!user) {
    throw new AppError("User không tồn tại", 404);
  }

  const plainUser = user.toObject();
  const withCategoryName = await populateOccupationCategoryName(plainUser);
  return {
    ...withCategoryName,
    displayName: withCategoryName.displayName || withCategoryName.username,
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
  if (data.bio !== undefined) payload.bio = data.bio;
  if (data.occupationId !== undefined) payload.occupationId = data.occupationId;
  if (data.occupationCategoryId !== undefined) {
    payload.occupationCategoryId = data.occupationCategoryId;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: payload },
    { new: true, runValidators: true },
  ).select("-hashPassword");
  return populateOccupationCategoryName(updatedUser);
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

// Cập nhật avatar
export const updateAvatar = async (userId, filePath) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User không tồn tại", 404);
  }

  // Xóa avatar cũ trên Cloudinary nếu có
  if (user.avatar?.publicId) {
    try {
      await cloudinaryService.deleteFile(user.avatar.publicId, "image");
    } catch (error) {
      console.error("Lỗi xóa avatar cũ:", error);
    }
  }

  // Upload avatar mới lên Cloudinary
  const uploadResult = await cloudinaryService.uploadImage(filePath, {
    folder: "avatars",
  });

  // Cập nhật user với avatar mới
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        avatar: {
          publicId: uploadResult.publicId,
          secureUrl: uploadResult.secureUrl,
        },
      },
    },
    { new: true, runValidators: true }
  ).select("-hashPassword");

  // Xóa file tạm trên local
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Lỗi xóa file tạm:", error);
  }

  return updatedUser;
};
