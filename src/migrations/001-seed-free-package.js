/**
 * Migration 001 — Seed Free Package & gán cho tất cả User hiện có
 *
 * Idempotent: chạy lại nhiều lần vẫn an toàn (upsert + bulkWrite skip đã set).
 *
 * Cách chạy:
 *   node src/migrations/001-seed-free-package.js
 *
 * Rollback (down):
 *   node src/migrations/001-seed-free-package.js --down
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load env từ root project
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Import models SAU khi dotenv đã load
const { default: Package } = await import("../models/Package.js");
const { default: User } = await import("../models/User.js");

const MONGO_URI =
  process.env.MONGODB_CONNECTIONSTRING ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("[Migration] ❌ Thiếu MONGODB_CONNECTIONSTRING / MONGO_URI trong .env");
  process.exit(1);
}

const isDown = process.argv.includes("--down");

async function up() {
  console.log("[Migration 001] ▶ Bắt đầu seed Free package...");

  // 1. Upsert gói Free (idempotent — tìm gói có price = 0 hoặc slug = free)
  const freePackage = await Package.findOneAndUpdate(
    { $or: [{ price: 0 }, { slug: "free" }] },
    {
      $setOnInsert: {
        name: "Free",
        slug: "free",
        level: 0,
        price: 0,
        currency: "VND",
        durationInDays: null,
        description: "Gói miễn phí — truy cập các bài học cơ bản.",
        features: [
          "Truy cập tất cả bài học Free",
          "Gamification (XP, streak)",
          "Lưu tiến trình học",
        ],
        isActive: true,
      },
    },
    { upsert: true, new: true },
  );

  console.log(`[Migration 001] ✓ Free package: ${freePackage._id}`);

  // 2. Gán currentPackageId = freePackage._id cho TẤT CẢ user chưa có gói
  const result = await User.updateMany(
    { currentPackageId: null },
    {
      $set: {
        currentPackageId: freePackage._id,
        packageExpiresAt: null, // Free = không hết hạn
      },
    },
  );

  console.log(
    `[Migration 001] ✓ Đã cập nhật ${result.modifiedCount} user(s) → Free package`,
  );
  console.log("[Migration 001] ✅ Hoàn thành UP migration");
}

async function down() {
  console.log("[Migration 001] ▶ Rollback: xoá Free package...");

  // 1. Tìm gói Free
  const freePackage = await Package.findOne({ slug: "free" });
  if (!freePackage) {
    console.log("[Migration 001] ⚠ Không tìm thấy Free package, skip.");
    return;
  }

  // 2. Reset currentPackageId về null cho các user đang dùng Free
  const result = await User.updateMany(
    { currentPackageId: freePackage._id },
    { $set: { currentPackageId: null, packageExpiresAt: null } },
  );
  console.log(
    `[Migration 001] ✓ Reset ${result.modifiedCount} user(s) → currentPackageId: null`,
  );

  // 3. Xoá gói Free
  await Package.deleteOne({ slug: "free" });
  console.log("[Migration 001] ✓ Đã xoá Free package");
  console.log("[Migration 001] ✅ Hoàn thành DOWN migration");
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("[Migration 001] 🔌 Kết nối MongoDB thành công");

    if (isDown) {
      await down();
    } else {
      await up();
    }
  } catch (err) {
    console.error("[Migration 001] ❌ Lỗi:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("[Migration 001] 🔌 Đã ngắt kết nối MongoDB");
  }
}

main();
