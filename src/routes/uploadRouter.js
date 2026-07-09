import express from "express";
import multer from "multer";
import * as uploadController from "../controllers/uploadController.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
  },
});

// @route   POST /api/upload/image
// @desc    Upload image file
// @access  Public
router.post("/image", upload.single("image"), uploadController.uploadImage);

// @route   POST /api/upload/audio
// @desc    Upload audio file
// @access  Public
router.post("/audio", upload.single("audio"), uploadController.uploadAudio);

// @route   POST /api/upload/url
// @desc    Upload file from URL
// @access  Public
router.post("/url", uploadController.uploadFromUrl);

// @route   DELETE /api/upload/:publicId
// @desc    Delete file by publicId
// @access  Public
router.delete("/:publicId", uploadController.deleteFile);

// @route   GET /api/upload/info/:publicId
// @desc    Get file metadata
// @access  Public
router.get("/info/:publicId", uploadController.getFileInfo);

// @route   GET /api/upload/transform
// @desc    Generate transformed URL
// @access  Public
router.get("/transform", uploadController.generateTransformUrl);

export default router;
