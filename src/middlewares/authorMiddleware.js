export const authorMiddleware = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Chưa xác thực" });
      }
      const userRole = req.user.role;
      if (!roles.includes(userRole)) {
        return res.status(403).json({ message: "Không đủ quyền truy cập" });
      }
      next();
    } catch (error) {
      console.error("Lỗi Authorization: ", error);
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }
  };
};
