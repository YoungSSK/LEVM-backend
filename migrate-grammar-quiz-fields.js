/**
 * Migration: gộp cấu trúc Grammar Theory+Quiz
 * -------------------------------------------
 * 1. Set default các field mới cho GrammarLesson / VocabularyLesson:
 *    - GrammarLesson: xpReward=10, passThreshold=70, hasQuiz=false,
 *                     contentUpdatedAt=now, contentUpdatedBy=null
 *    - VocabularyLesson: xpReward=10
 * 2. Backup toàn bộ GrammarLesson có lessonType='exercise' sang collection
 *    `GrammarLesson_exercise_backup` (aggregate $out).
 * 3. Với mỗi exercise: nếu parent (theory) đang rỗng htmlContent -> copy
 *    nội dung của exercise sang parent và bật hasQuiz=true. Sau đó xoá
 *    exercise (vì quiz sẽ dùng model riêng GrammarQuizQuestion).
 *
 * Chạy:
 *   node migrate-grammar-quiz-fields.js           # thực thi
 *   node migrate-grammar-quiz-fields.js --dry-run # chỉ in kế hoạch
 *
 * Yêu cầu: MONGODB_CONNECTIONSTRING trong .env
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import GrammarLesson from "./src/models/GrammarLesson.js";
import VocabularyLesson from "./src/models/VocabularyLesson.js";

dotenv.config();

const MONGODB_CONNECTIONSTRING = process.env.MONGODB_CONNECTIONSTRING;
if (!MONGODB_CONNECTIONSTRING) {
  console.error(
    "[migrate] Thiếu MONGODB_CONNECTIONSTRING trong .env — không thể chạy.",
  );
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const BACKUP_COLLECTION = "GrammarLesson_exercise_backup";

function isHtmlEmpty(html) {
  if (!html) return true;
  const stripped = String(html).replace(/<[^>]*>/g, "").trim();
  return stripped.length === 0;
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  console.log(`[migrate] ${title}`);
  console.log("=".repeat(60));
}

async function setGrammarDefaults() {
  logSection("Bước 1: Set default field cho GrammarLesson");
  const filter = {
    $or: [
      { xpReward: { $exists: false } },
      { passThreshold: { $exists: false } },
      { hasQuiz: { $exists: false } },
      { contentUpdatedAt: { $exists: false } },
    ],
  };
  const matched = await GrammarLesson.countDocuments(filter);
  console.log(`[migrate]   Số GrammarLesson thiếu field: ${matched}`);

  if (DRY_RUN || matched === 0) return 0;

  const now = new Date();
  const result = await GrammarLesson.updateMany(
    filter,
    {
      $set: {
        xpReward: 10,
        passThreshold: 70,
        hasQuiz: false,
        contentUpdatedAt: now,
        contentUpdatedBy: null,
      },
    },
    { strict: false },
  );
  console.log(
    `[migrate]   Đã set default cho ${result.modifiedCount} lesson.`,
  );
  return result.modifiedCount || 0;
}

async function setVocabDefaults() {
  logSection("Bước 1b: Set default xpReward cho VocabularyLesson");
  const filter = { xpReward: { $exists: false } };
  const matched = await VocabularyLesson.countDocuments(filter);
  console.log(`[migrate]   Số VocabularyLesson thiếu xpReward: ${matched}`);

  if (DRY_RUN || matched === 0) return 0;

  const result = await VocabularyLesson.updateMany(
    filter,
    { $set: { xpReward: 10 } },
    { strict: false },
  );
  console.log(
    `[migrate]   Đã set xpReward cho ${result.modifiedCount} lesson.`,
  );
  return result.modifiedCount || 0;
}

async function backupExercises() {
  logSection(`Bước 2: Backup exercise lessons -> ${BACKUP_COLLECTION}`);
  const db = mongoose.connection.db;
  const existingCollections = await db
    .listCollections({ name: BACKUP_COLLECTION })
    .toArray();

  if (existingCollections.length > 0) {
    console.log(
      `[migrate]   Collection backup đã tồn tại (chỉ thay khi --force-backup).`,
    );
    const overwrite = process.argv.includes("--force-backup");
    if (!overwrite) {
      console.log(`[migrate]   Bỏ qua bước backup. Dùng --force-backup để ghi đè.`);
      return 0;
    }
    await db.collection(BACKUP_COLLECTION).drop().catch(() => {});
  }

  const exerciseCount = await GrammarLesson.countDocuments({
    lessonType: "exercise",
  });
  console.log(`[migrate]   Số exercise hiện có: ${exerciseCount}`);

  if (DRY_RUN || exerciseCount === 0) return 0;

  await db
    .collection("grammarlessons")
    .aggregate([
      { $match: { lessonType: "exercise" } },
      { $out: BACKUP_COLLECTION },
    ])
    .toArray();

  const backedUp = await db.collection(BACKUP_COLLECTION).countDocuments();
  console.log(`[migrate]   Đã backup ${backedUp} exercise.`);
  return backedUp;
}

async function mergeAndRemoveExercises() {
  logSection("Bước 3: Gộp nội dung exercise vào theory cha, xoá exercise");
  const exercises = await GrammarLesson.find({ lessonType: "exercise" });
  console.log(`[migrate]   Tìm thấy ${exercises.length} exercise cần xử lý.`);

  if (DRY_RUN || exercises.length === 0) return { merged: 0, removed: 0 };

  let merged = 0;
  let removed = 0;
  const orphanIds = [];

  for (const ex of exercises) {
    if (!ex.parentLessonId) {
      console.log(
        `[migrate]   [WARN] exercise ${ex._id} (${ex.title}) không có parentLessonId, sẽ xoá như orphan.`,
      );
      orphanIds.push(ex._id);
      continue;
    }

    const parent = await GrammarLesson.findById(ex.parentLessonId);
    if (!parent) {
      console.log(
        `[migrate]   [WARN] exercise ${ex._id} (${ex.title}) -> parent ${ex.parentLessonId} không tồn tại, sẽ xoá như orphan.`,
      );
      orphanIds.push(ex._id);
      continue;
    }

    if (isHtmlEmpty(parent.htmlContent) && !isHtmlEmpty(ex.htmlContent)) {
      parent.htmlContent = ex.htmlContent;
      parent.plainTextContent = ex.plainTextContent || "";
      await parent.save();
      merged++;
      console.log(
        `[migrate]   [OK] Đã copy nội dung ${ex._id} -> parent ${parent._id} (${parent.title}).`,
      );
    }

    parent.hasQuiz = true;
    await parent.save();
  }

  const exerciseIds = exercises
    .filter((e) => e.parentLessonId)
    .map((e) => e._id)
    .concat(orphanIds);

  if (exerciseIds.length > 0) {
    const del = await GrammarLesson.deleteMany({ _id: { $in: exerciseIds } });
    removed = del.deletedCount || 0;
  }

  console.log(
    `[migrate]   Tổng kết: ${merged} bài đã gộp nội dung, ${removed} exercise đã xoá.`,
  );
  return { merged, removed };
}

async function run() {
  console.log(`[migrate] Chế độ: ${DRY_RUN ? "DRY-RUN (không ghi)" : "THỰC THI"}`);
  try {
    console.log("[migrate] Đang kết nối MongoDB...");
    await mongoose.connect(MONGODB_CONNECTIONSTRING);
    console.log("[migrate] Kết nối thành công.");

    const grammarCount = await setGrammarDefaults();
    const vocabCount = await setVocabDefaults();
    const backedUp = await backupExercises();
    const { merged, removed } = await mergeAndRemoveExercises();

    logSection("TỔNG KẾT");
    console.log(`[migrate] GrammarLesson default fields set : ${grammarCount} (xpReward=10, passThreshold=70, hasQuiz=false, contentUpdatedAt=<now>, contentUpdatedBy=null)`);
    console.log(`[migrate] VocabularyLesson xpReward set    : ${vocabCount} (xpReward=10)`);
    console.log(`[migrate] Exercise lessons backed up        : ${backedUp}`);
    console.log(`[migrate] Exercise merged vào parent        : ${merged}`);
    console.log(`[migrate] Exercise đã xoá                  : ${removed}`);

    if (DRY_RUN) {
      console.log(
        "\n[migrate] DRY-RUN: không có thay đổi nào được ghi. Bỏ cờ --dry-run để chạy thật.",
      );
    } else {
      console.log("\n[migrate] Hoàn tất migration.");
    }
  } catch (error) {
    console.error("[migrate] Lỗi:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("[migrate] Đã ngắt kết nối database.");
  }
}

run();
