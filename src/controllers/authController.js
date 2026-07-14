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

    // set refresh token in cookie (works for browser clients)
    const cookieOptions = req.app.locals.refreshCookieOptions;
    res.cookie("refreshToken", refreshToken, cookieOptions);
    const displayName = user.displayName || user.username;
    return res.status(200).json({
      success: true,
      message: `User ${displayName} đã đăng nhập với vai trò ${user.role}`,
      accessToken,
      refreshToken,
      role: user.role,
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
    // Lấy refreshToken từ cookie hoặc body (mobile không gửi cookie)
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken || null;
    await authService.logout(refreshToken);
    // Xoá cookie nếu có
    const cookieOptions = req.app.locals.refreshCookieOptions;
    res.clearCookie("refreshToken", cookieOptions);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Lỗi khi đăng xuất", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};

// tạo access Token bằng refresh Token
// Accepts the refresh token from (in priority order):
//   1. `req.body.refreshToken`  — used by mobile clients
//   2. `Authorization: Bearer <rt>` header — used by mobile clients as fallback
//   3. `req.cookies.refreshToken` — used by browser clients
export const refreshToken = async (req, res) => {
  try {
    let refreshToken =
      req.body?.refreshToken ||
      req.headers["x-refresh-token"] ||
      req.cookies?.refreshToken ||
      null;

    if (!refreshToken) {
      const authHeader = req.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        // Only treat as refresh token if it doesn't look like a JWT
        // (JWTs contain dots). Encrypted refresh tokens are 128-char hex.
        refreshToken = authHeader.substring(7);
      }
    }

    const { accessToken } = await authService.refreshToken(refreshToken);
    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    console.error("Lỗi khi tạo accessToken mới ");
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi hệ thống" });
  }
};
