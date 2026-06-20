import express from "express";

import {
  createWord,
  updateWord,
  getWordById,
  getWordDetail,
  getAllWords,
  searchWords,
  changeWordStatus,
  deleteWord,
} from "../controllers/wordController.js";

import {
  createMeaning,
  getMeaningByWord,
  setPrimary,
} from "../controllers/wordMeaningController.js";

import authorMiddleware from "../middlewares/authorMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";

import {
  wordIdParamsSchema,
  createWordSchema,
  updateWordSchema,
  getAllWordQuerySchema,
  searchWordQuerySchema,
  changeStatusWordSchema,
} from "../validations/wordValidation.js";

import {
  wordMeaningWordIdParamsSchema,
  setPrimaryMeaningParamsSchema,
  createMeaningSchema,
} from "../validations/wordMeaningValidation.js";

const router = express.Router();

// Admin routes
// Lay danh sach tu vung
router.get(
  "/",
  authorMiddleware("admin"),
  validate(getAllWordQuerySchema, "query"),
  getAllWords,
);

// Tim kiem tu vung
router.get(
  "/search",
  authorMiddleware("admin"),
  validate(searchWordQuerySchema, "query"),
  searchWords,
);

// Nghia cua tu
router.get(
  "/:wordId/meanings",
  validate(wordMeaningWordIdParamsSchema, "params"),
  getMeaningByWord,
);

router.post(
  "/:wordId/meanings",
  authorMiddleware("admin"),
  validate(wordMeaningWordIdParamsSchema, "params"),
  validate(createMeaningSchema),
  createMeaning,
);

router.patch(
  "/:wordId/meanings/:meaningId/primary",
  authorMiddleware("admin"),
  validate(setPrimaryMeaningParamsSchema, "params"),
  setPrimary,
);

// Chi tiet tu vung
router.get(
  "/:id/detail",
  authorMiddleware("admin"),
  validate(wordIdParamsSchema, "params"),
  getWordDetail,
);

// Lay mot tu vung theo id
router.get(
  "/:id",
  authorMiddleware("admin"),
  validate(wordIdParamsSchema, "params"),
  getWordById,
);

// Tao tu vung moi
router.post(
  "/",
  authorMiddleware("admin"),
  validate(createWordSchema),
  createWord,
);

// Cap nhat tu vung
router.patch(
  "/:id",
  authorMiddleware("admin"),
  validate(wordIdParamsSchema, "params"),
  validate(updateWordSchema),
  updateWord,
);

// Thay doi trang thai tu vung
router.patch(
  "/:id/status",
  authorMiddleware("admin"),
  validate(wordIdParamsSchema, "params"),
  validate(changeStatusWordSchema),
  changeWordStatus,
);

// Xoa tu vung
router.delete(
  "/:id",
  authorMiddleware("admin"),
  validate(wordIdParamsSchema, "params"),
  deleteWord,
);

export default router;
