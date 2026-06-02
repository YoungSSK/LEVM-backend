import * as authService from "../services/authService.js";
//Hàm đăng ký
export const Register = async (req, res) => {
  try {
    await authService.register(req.validatedData);
    return res
      .status(201)
      .json({ success: true, message: "Đăng ký tài khoản thành công" });
  } catch (error) {
    console.error("Lỗi đăng ký tài khoản: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
// Hàm đăng nhập
export const Login = async (req, res) => {
  try {
    const ipAddress =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip;
    const userAgent = req.headers["user-agent"];
    const { accessToken, refreshToken, user } = await authService.login(
      req.validatedData,
      ipAddress,
      userAgent,
    );

    // set refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });
    const displayName = user.displayName || user.username;
    return res.status(200).json({
      success: true,
      message: `User ${displayName} đã đăng nhập với vai trò ${user.role}`,
      accessToken,
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập: ", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};

//Hàm đăng xuất
export const Logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    await authService.logout(refreshToken);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Lỗi khi đăng xuất", error);
    return res
      .status(error.statusCode || 500)
      .json({ succes: false, message: error.message || "Lỗi hệ thống" });
  }
};

// tạo access Token bằng refresh Token
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const { accessToken } = await authService.refreshToken(refreshToken);
    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    console.error("Lỗi khi tạo accessToken mới ");
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
