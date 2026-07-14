import { success } from "zod";
import * as userService from "../services/userService.js";

export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng gửi file avatar",
      });
    }

    const user = await userService.updateAvatar(req.user._id, req.file.path);

    return res.status(200).json({
      success: true,
      message: "Cập nhật avatar thành công.",
      data: {
        avatar: {
          publicId: user.avatar.publicId,
          secureUrl: user.avatar.secureUrl,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật avatar:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const fetchMe = async (req, res) => {
  try {
    const user = await userService.fetchMe(req.user._id);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Lỗi FetchMe: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await userService.updateProfile(
      req.user._id,
      req.validatedData,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      data: user,
    });
  } catch (error) {
    console.error("Lỗi cập nhật thông tin: ", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};
export const changePassword = async (req, res) => {
  try {
    await userService.changePassword(req.user._id, req.validatedData);
    return res
      .status(200)
      .json({ success: true, message: "Cập nhật mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật mật khẩu: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
