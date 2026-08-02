/**
 * Migration 002 — Thêm allowedPackageIds (rỗng) cho tất cả bài học hiện có
 *
 * Idempotent: field default=[] — nếu field đã tồn tại, $setOnInsert không ghi đè.
 * Dùng updateMany với $set chỉ khi field chưa có để an toàn.
 *
 * Cách chạy:
 *   node src/migrations/002-add-allowed-package-ids.js
 *
 * Rollback:
 *   node src/migrations/002-add-allowed-package-ids.js --down
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { default: GrammarLesson } = await import("../models/GrammarLesson.js");
const { default: VocabularyLesson } = await import("../models/VocabularyLesson.js");
const { default: ReadingPassage } = await import("../models/ReadingPassage.js");

const MONGO_URI =
  process.env.MONGODB_CONNECTIONSTRING ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI;
if (!MONGO_URI) { console.error("Thiếu MONGODB_CONNECTIONSTRING / MONGO_URI trong .env"); process.exit(1); }

const isDown = process.argv.includes("--down");

async function up() {
  console.log("[Migration 002] ▶ Thêm allowedPackageIds=[] cho tất cả content...");

  const models = [
    { name: "GrammarLesson", Model: GrammarLesson },
    { name: "VocabularyLesson", Model: VocabularyLesson },
    { name: "ReadingPassage", Model: ReadingPassage },
  ];

  for (const { name, Model } of models) {
    const result = await Model.updateMany(
      { allowedPackageIds: { $exists: false } }, // chỉ update khi chưa có field
      { $set: { allowedPackageIds: [] } },
    );
    console.log(`[Migration 002] ✓ ${name}: ${result.modifiedCount} docs updated`);
  }

  console.log("[Migration 002] ✅ Hoàn thành UP migration");
}

async function down() {
  console.log("[Migration 002] ▶ Rollback: xoá allowedPackageIds...");

  const models = [
    { name: "GrammarLesson", Model: GrammarLesson },
    { name: "VocabularyLesson", Model: VocabularyLesson },
    { name: "ReadingPassage", Model: ReadingPassage },
  ];

  for (const { name, Model } of models) {
    const result = await Model.updateMany({}, { $unset: { allowedPackageIds: "" } });
    console.log(`[Migration 002] ✓ ${name}: ${result.modifiedCount} docs updated`);
  }

  console.log("[Migration 002] ✅ Hoàn thành DOWN migration");
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("[Migration 002] 🔌 Kết nối MongoDB thành công");
    if (isDown) { await down(); } else { await up(); }
  } catch (err) {
    console.error("[Migration 002] ❌ Lỗi:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}
main();
