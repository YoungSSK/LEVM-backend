import Package from "../models/Package.js";
import AppError from "../utils/AppError.js";

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export const getAllPackages = async ({ includeInactive = false } = {}) => {
  const filter = includeInactive ? {} : { isActive: true };
  return Package.find(filter).sort({ level: 1 }).lean();
};

export const getPackageById = async (id) => {
  const pkg = await Package.findById(id).lean();
  if (!pkg) throw new AppError("Không tìm thấy gói thành viên", 404);
  return pkg;
};

export const createPackage = async (data) => {
  const { name, slug, level, price, currency, durationInDays, description, features } = data;

  // Kiểm tra slug trùng
  const existing = await Package.findOne({ slug });
  if (existing) throw new AppError("Slug gói thành viên đã tồn tại", 400);

  return Package.create({
    name,
    slug,
    level: level ?? 1,
    price: price ?? 0,
    currency: currency ?? "VND",
    durationInDays: durationInDays ?? null,
    description: description ?? "",
    features: features ?? [],
    isActive: true,
  });
};

export const updatePackage = async (id, data) => {
  const pkg = await Package.findById(id);
  if (!pkg) throw new AppError("Không tìm thấy gói thành viên", 404);

  // Không cho sửa slug của gói Free (slug = "free" là điểm neo của hệ thống)
  if (pkg.slug === "free" && data.slug && data.slug !== "free") {
    throw new AppError("Không thể đổi slug của gói Free", 400);
  }

  // Nếu muốn đổi slug, kiểm tra trùng
  if (data.slug && data.slug !== pkg.slug) {
    const duplicate = await Package.findOne({ slug: data.slug });
    if (duplicate) throw new AppError("Slug gói thành viên đã tồn tại", 400);
  }

  Object.assign(pkg, data);
  return pkg.save();
};

export const deletePackage = async (id) => {
  const pkg = await Package.findById(id);
  if (!pkg) throw new AppError("Không tìm thấy gói thành viên", 404);
  if (pkg.slug === "free") throw new AppError("Không thể xoá gói Free", 400);

  // Soft delete: chỉ set isActive = false, giữ lại để references không vỡ
  pkg.isActive = false;
  return pkg.save();
};
