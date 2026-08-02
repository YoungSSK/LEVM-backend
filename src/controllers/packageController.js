import * as packageService from "../services/packageService.js";
import GrammarLesson from "../models/GrammarLesson.js";
import VocabularyLesson from "../models/VocabularyLesson.js";
import ReadingPassage from "../models/ReadingPassage.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";

// ── Public ────────────────────────────────────────────────────────────────────

export const getActivePackages = async (req, res) => {
  try {
    const packages = await packageService.getAllPackages({ includeInactive: false });
    return res.status(200).json({ success: true, data: packages });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export const getAllPackagesAdmin = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const packages = await packageService.getAllPackages({ includeInactive });
    return res.status(200).json({ success: true, data: packages });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const createPackage = async (req, res) => {
  try {
    const pkg = await packageService.createPackage(req.body);
    return res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const updatePackage = async (req, res) => {
  try {
    const pkg = await packageService.updatePackage(req.params.id, req.body);
    return res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

export const deletePackage = async (req, res) => {
  try {
    await packageService.deletePackage(req.params.id);
    return res.status(200).json({ success: true, message: "Đã xoá gói thành viên" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
};

// ── Admin: Gán allowedPackageIds cho từng loại content ───────────────────────

/**
 * Helper chung: cập nhật allowedPackageIds cho bất kỳ content model nào.
 */
async function updateContentPackages(Model, id, packageIds, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    // Validate từng packageId
    const validIds = (packageIds || []).filter((pid) =>
      mongoose.Types.ObjectId.isValid(pid),
    );

    const content = await Model.findByIdAndUpdate(
      id,
      { $set: { allowedPackageIds: validIds } },
      { new: true, select: "title slug allowedPackageIds" },
    ).populate("allowedPackageIds", "name slug level");

    if (!content) throw new AppError("Không tìm thấy nội dung", 404);

    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống",
    });
  }
}

export const updateGrammarLessonPackages = (req, res) =>
  updateContentPackages(GrammarLesson, req.params.id, req.body.packageIds, res);

export const updateVocabularyLessonPackages = (req, res) =>
  updateContentPackages(VocabularyLesson, req.params.id, req.body.packageIds, res);

export const updateReadingPassagePackages = (req, res) =>
  updateContentPackages(ReadingPassage, req.params.id, req.body.packageIds, res);
