import express from "express";
import {
  getActivePackages,
  getAllPackagesAdmin,
  createPackage,
  updatePackage,
  deletePackage,
  updateGrammarLessonPackages,
  updateVocabularyLessonPackages,
  updateReadingPassagePackages,
} from "../controllers/packageController.js";
import authorMiddleware from "../middlewares/authorMiddleware.js";

const router = express.Router();

// ── Public: mobile app lấy danh sách gói (hiển thị màn hình nâng cấp) ────────
router.get("/", getActivePackages);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.use(authorMiddleware("admin"));

// CRUD gói
router.get("/admin", getAllPackagesAdmin);
router.post("/", createPackage);
router.patch("/:id", updatePackage);
router.delete("/:id", deletePackage);

// Gán/gỡ gói cho từng loại content
// Body: { packageIds: ["id1", "id2"] }
router.patch("/assign/grammar-lessons/:id", updateGrammarLessonPackages);
router.patch("/assign/vocabulary-lessons/:id", updateVocabularyLessonPackages);
router.patch("/assign/reading-passages/:id", updateReadingPassagePackages);

export default router;
