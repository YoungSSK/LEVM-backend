import express from "express";
import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import {
  createListeningSetSchema,
  updateListeningSetSchema,
  createListeningGroupSchema,
  updateListeningGroupSchema,
  createListeningQuestionSchema,
  updateListeningQuestionSchema,
  reorderSchema,
  submitListeningAttemptSchema,
} from "../validations/listeningValidation.js";
import * as listeningController from "../controllers/listeningController.js";

import { loadListeningSet, lessonAccessMiddleware } from "../middlewares/lessonAccessMiddleware.js";

const router = express.Router();

// ================= LEARNER / PUBLIC ROUTES =================
// Note: authMiddleware is mounted in server.js before /api/listening

// Learner play endpoint (strips isCorrect, checks package access)
router.get("/sets/:id/play", loadListeningSet, lessonAccessMiddleware, listeningController.getPlayPayload);

// Learner submit attempt
router.post("/attempts/submit", validate(submitListeningAttemptSchema), listeningController.submitAttempt);

// Learner attempt history
router.get("/attempts/history", listeningController.getAttemptHistory);

// List listening sets
router.get("/sets", listeningController.getListeningSets);

// ================= ADMIN CMS ROUTES (Protected by authorMiddleware("admin")) =================

const adminAuth = authorMiddleware("admin");

// Detail set for Admin (includes groups & questions with answers)
router.get("/sets/:id", adminAuth, listeningController.getListeningSetByIdAdmin);

// Create listening set
router.post("/sets", adminAuth, validate(createListeningSetSchema), listeningController.createListeningSet);

// Update listening set
router.put("/sets/:id", adminAuth, validate(updateListeningSetSchema), listeningController.updateListeningSet);

// Delete listening set (cascade delete)
router.delete("/sets/:id", adminAuth, listeningController.deleteListeningSet);

// Reorder audio groups in set
router.put("/sets/:setId/groups/reorder", adminAuth, validate(reorderSchema), listeningController.reorderGroups);

// Reorder questions in set
router.put("/sets/:setId/questions/reorder", adminAuth, validate(reorderSchema), listeningController.reorderQuestions);

// Create Audio Group (Part 3 & 4)
router.post("/sets/:setId/groups", adminAuth, validate(createListeningGroupSchema), listeningController.createAudioGroup);

// Update Audio Group
router.put("/groups/:id", adminAuth, validate(updateListeningGroupSchema), listeningController.updateAudioGroup);

// Delete Audio Group (cascade delete child questions)
router.delete("/groups/:id", adminAuth, listeningController.deleteAudioGroup);

// Reorder questions in specific group
router.put("/groups/:groupId/questions/reorder", adminAuth, validate(reorderSchema), listeningController.reorderQuestions);

// Get questions by group
router.get("/groups/:groupId/questions", adminAuth, listeningController.getQuestionsByGroupId);

// Get questions by set
router.get("/sets/:setId/questions", adminAuth, listeningController.getQuestionsBySetId);

// Create Listening Question
router.post("/questions", adminAuth, validate(createListeningQuestionSchema), listeningController.createQuestion);

// Update Listening Question
router.put("/questions/:id", adminAuth, validate(updateListeningQuestionSchema), listeningController.updateQuestion);

// Delete Listening Question
router.delete("/questions/:id", adminAuth, listeningController.deleteQuestion);

export default router;
