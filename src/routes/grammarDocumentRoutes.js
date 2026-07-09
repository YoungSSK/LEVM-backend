import express from "express";

import * as grammarDocumentController from "../controllers/grammarDocumentController.js";

import uploadGrammarDocument from "../middlewares/uploadGrammarDocument.js";

const router = express.Router();

// Upload DOCX và convert HTML
router.post(
  "/upload",
  uploadGrammarDocument.single("file"),
  grammarDocumentController.uploadGrammarDocument,
);

export default router;
