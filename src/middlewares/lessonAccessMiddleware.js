/**
 * LessonAccessMiddleware — Kiểm soát quyền truy cập bài học theo gói thành viên.
 *
 * Cách hoạt động:
 *  1. Nhận lesson/passage đã được load sẵn vào `req.lessonDoc` từ controller/route.
 *  2. Nếu `allowedPackageIds` rỗng → bài Free → cho qua.
 *  3. Nếu không rỗng → kiểm tra user có gói phù hợp và còn hạn không.
 *  4. Không đủ quyền → 403 với payload đủ để Mobile hiển thị đúng màn hình.
 *
 * Feature Flag:
 *  - LOG_ONLY (mặc định ban đầu): chỉ log cảnh báo, không chặn thật → safe deployment
 *  - ENFORCE: chặn thật → bật bằng env LESSON_ACCESS_ENFORCE=true
 *
 * Áp lên route:
 *   router.get("/:id", loadLessonMiddleware, lessonAccessMiddleware, getById)
 */

import mongoose from "mongoose";
import GrammarLesson from "../models/GrammarLesson.js";
import VocabularyLesson from "../models/VocabularyLesson.js";
import ReadingPassage from "../models/ReadingPassage.js";
import ListeningSet from "../models/ListeningSet.js";

// Feature flag: set LESSON_ACCESS_ENFORCE=true trong .env khi sẵn sàng chặn thật
const ENFORCE = process.env.LESSON_ACCESS_ENFORCE === "true";

if (!ENFORCE) {
  console.log(
    "[LessonAccess] ⚠ LESSON_ACCESS_ENFORCE=false — chạy ở chế độ LOG-ONLY, không chặn thật.",
  );
} else {
  console.log("[LessonAccess] ✅ LESSON_ACCESS_ENFORCE=true — đang chặn thật.");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function hasValidAccess(user, allowedPackageIds) {
  if (!allowedPackageIds || allowedPackageIds.length === 0) return true; // Free

  try {
    const Package = (await import("../models/Package.js")).default;
    const allowedPkgs = await Package.find({ _id: { $in: allowedPackageIds } }).select("level price slug name").lean();

    // Nếu trong whitelist có gói level 0 / price 0 -> Bài học hoàn toàn miễn phí cho tất cả mọi người
    const hasFreePackage = allowedPkgs.some(
      (p) => (p.level ?? 0) === 0 || (p.price ?? 0) === 0 || p.slug === "free" || p.slug === "thuong",
    );
    if (hasFreePackage) return true;

    if (!user || !user.currentPackageId) return false;

    // Kiểm tra hạn gói
    if (user.packageExpiresAt && new Date(user.packageExpiresAt) < new Date()) {
      return false; // hết hạn
    }

    // 1. Kiểm tra trực tiếp ID match
    const userPkgId = user.currentPackageId.toString();
    const inWhitelist = allowedPackageIds.some(
      (id) => id.toString() === userPkgId,
    );
    if (inWhitelist) return true;

    // 2. Progressive Level Check (Gán gói level X -> user có gói level >= X đều được học)
    const userPkg = await Package.findById(user.currentPackageId).select("level").lean();
    if (!userPkg || !allowedPkgs.length) return false;

    const minRequiredLevel = Math.min(...allowedPkgs.map((p) => p.level ?? 0));
    const userLevel = userPkg.level ?? 0;

    return userLevel >= minRequiredLevel;
  } catch (err) {
    console.error("[LessonAccess] Lỗi kiểm tra level gói:", err);
    return false;
  }
}

// ── Middleware factories ───────────────────────────────────────────────────────

/**
 * Tạo middleware load lesson/passage từ DB và đặt vào req.lessonDoc.
 * Tách riêng để reuse, và để guard biết allowedPackageIds.
 *
 * @param {Model} Model - Mongoose model (GrammarLesson / VocabularyLesson / ReadingPassage)
 * @param {string} paramName - Tên param trong route: "id" (ObjectId) hoặc "slug" (string)
 */
export function makeLoadDocMiddleware(Model, paramName = "id") {
  return async (req, res, next) => {
    try {
      const paramValue = req.params[paramName];
      let doc;

      const isObjectId =
        typeof paramValue === "string" &&
        mongoose.Types.ObjectId.isValid(paramValue) &&
        /^[0-9a-fA-F]{24}$/.test(paramValue);

      if (paramName === "slug" || !isObjectId) {
        doc = await Model.findOne({ slug: paramValue })
          .select("allowedPackageIds title slug")
          .lean();
      } else {
        doc = await Model.findById(paramValue)
          .select("allowedPackageIds title slug")
          .lean();
      }

      if (!doc) {
        return res.status(404).json({ success: false, message: "Không tìm thấy nội dung" });
      }

      req.lessonDoc = doc;
      next();
    } catch (error) {
      console.error("[LessonAccess] Lỗi makeLoadDocMiddleware:", error);
      return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
  };
}

/**
 * Middleware chính — kiểm tra quyền truy cập.
 * Phải chạy SAU makeLoadDocMiddleware (cần req.lessonDoc).
 * Phải chạy SAU authMiddleware (cần req.user).
 */
export const lessonAccessMiddleware = async (req, res, next) => {
  try {
    const doc = req.lessonDoc;
    if (!doc) {
      // Nếu doc chưa load (không dùng makeLoadDocMiddleware), cho qua
      console.warn("[LessonAccess] req.lessonDoc chưa được set — bỏ qua check");
      return next();
    }

    const allowedPackageIds = doc.allowedPackageIds || [];

    // Free lesson → ai cũng xem được
    if (allowedPackageIds.length === 0) return next();

    const user = req.user;
    const allowed = await hasValidAccess(user, allowedPackageIds);

    if (!allowed) {
      const logMsg = `[LessonAccess] User ${user._id} ${ENFORCE ? "BỊ CHẶN" : "(would be blocked)"} — lesson ${doc._id}, gói yêu cầu: [${allowedPackageIds.join(", ")}], gói user: ${user.currentPackageId}, hạn: ${user.packageExpiresAt}`;
      console.warn(logMsg);

      if (ENFORCE) {
        return res.status(403).json({
          success: false,
          code: "PACKAGE_REQUIRED",
          message: "Bài học này yêu cầu gói thành viên cao hơn. Vui lòng nâng cấp gói.",
          requiredPackageIds: allowedPackageIds,
        });
      }
    }

    return next();
  } catch (error) {
    console.error("[LessonAccess] Lỗi middleware:", error);
    return next(); // Fail-open: lỗi nội bộ thì không chặn user
  }
};

// ── Pre-built middleware instances cho 3 loại content ─────────────────────────

export const loadGrammarLesson = makeLoadDocMiddleware(GrammarLesson);
export const loadGrammarLessonBySlug = makeLoadDocMiddleware(GrammarLesson, "slug");

export const loadVocabularyLesson = makeLoadDocMiddleware(VocabularyLesson);
export const loadVocabularyLessonBySlug = makeLoadDocMiddleware(VocabularyLesson, "slug");

export const loadReadingPassage = makeLoadDocMiddleware(ReadingPassage);
export const loadReadingPassageBySlug = makeLoadDocMiddleware(ReadingPassage, "slug");

export const loadListeningSet = makeLoadDocMiddleware(ListeningSet);
