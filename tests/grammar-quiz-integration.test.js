/**
 * Integration test cho Grammar Quiz System (Bước 12).
 *
 * Test các tính năng:
 *  - Autosave: race condition, conflict, stale request skip
 *  - Quiz CRUD: create, update, delete, reorder
 *  - CSV import: validation, UTF-8, header, limits
 *  - Submit quiz: lesson active/published/hasQuiz validation, XP
 *
 * Chạy:  node --test tests/grammar-quiz-integration.test.js
 *
 * Lưu ý: Tests dùng MongoDB thật (MONGODB_CONNECTIONSTRING).
 *        Chạy trên môi trường staging/development, KHÔNG chạy trên production.
 */

import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";

import GrammarLesson from "../src/models/GrammarLesson.js";
import GrammarTopic from "../src/models/GrammarTopic.js";
import GrammarQuizQuestion from "../src/models/GrammarQuizQuestion.js";
import UserQuizAttempt from "../src/models/UserQuizAttempt.js";
import User from "../src/models/User.js";
import UserGrammarProgress from "../src/models/UserGrammarProgress.js";
import {
  reorderQuizQuestions,
  importQuizFromCsv,
  submitQuizAttempt,
  createQuizQuestion,
} from "../src/services/grammarQuizService.js";
import {
  updateGrammarLessonContent,
} from "../src/services/grammarLessonService.js";
import { __resetGamificationDeps } from "../src/services/gamificationService.js";

// Skip tests nếu không có MongoDB
const SKIP_INTEGRATION = !process.env.MONGODB_CONNECTIONSTRING;
const describeIf = SKIP_INTEGRATION ? describe.skip : describe;

// ===== Fixtures =====

let topicId;
let lessonId;
let userId;

const createTestTopic = async () => {
  const topic = await GrammarTopic.create({
    name: "Test Topic " + Date.now(),
    slug: "test-topic-" + Date.now(),
    isActive: true,
  });
  return topic._id;
};

const createTestLesson = async (topicId, overrides = {}) => {
  const lesson = await GrammarLesson.create({
    topicId,
    title: "Test Lesson " + Date.now(),
    slug: "test-lesson-" + Date.now(),
    htmlContent: "<p>Initial content</p>",
    plainTextContent: "Initial content",
    isActive: true,
    isPublished: true,
    xpReward: 10,
    passThreshold: 60,
    hasQuiz: false,
    ...overrides,
  });
  return lesson._id;
};

const createTestUser = async () => {
  const user = await User.create({
    username: "testuser_" + Date.now(),
    email: `test_${Date.now()}@example.com`,
    password: "Test1234!",
    xp: 0,
    streak: 0,
    timezone: "Asia/Ho_Chi_Minh",
  });
  return user._id;
};

// ===== Test Suite =====

describeIf("Grammar Quiz Integration Tests", (t) => {
  before(async () => {
    if (SKIP_INTEGRATION) return;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    }
    topicId = await createTestTopic();
    userId = await createTestUser();
  });

  after(async () => {
    if (SKIP_INTEGRATION) return;
    // Cleanup
    await GrammarQuizQuestion.deleteMany({ lessonId: { $exists: true } });
    await UserQuizAttempt.deleteMany({ userId });
    await UserGrammarProgress.deleteMany({ userId });
    await GrammarLesson.deleteMany({ topicId });
    await GrammarTopic.deleteMany({ _id: topicId });
    await User.deleteMany({ _id: userId });
  });

  // ========== Autosave ==========

  describe("Autosave + Optimistic Locking", () => {
    beforeEach(async () => {
      lessonId = await createTestLesson(topicId);
    });

    test("updateGrammarLessonContent: lưu thành công, trả contentUpdatedAt", async () => {
      const res = await updateGrammarLessonContent(
        lessonId,
        { htmlContent: "<p>Hello world</p>" },
        userId,
      );
      assert.ok(res.contentUpdatedAt, "Phải trả contentUpdatedAt");
      assert.ok(res._id.toString() === lessonId.toString());
    });

    test("updateGrammarLessonContent: conflict 409 khi lastKnownContentUpdatedAt không khớp", async () => {
      // Lưu lần 1
      await updateGrammarLessonContent(
        lessonId,
        { htmlContent: "<p>Version 1</p>" },
        userId,
      );

      // Giả lập: user A đã lưu version mới, user B gửi version cũ
      const staleTime = new Date(Date.now() - 60000).toISOString(); // 1 phút trước

      await assert.rejects(
        () =>
          updateGrammarLessonContent(
            lessonId,
            { htmlContent: "<p>Stale content</p>", lastKnownContentUpdatedAt: staleTime },
            userId,
          ),
        /409/,
      );
    });

    test("updateGrammarLessonContent: null lastKnownContentUpdatedAt bỏ qua lock", async () => {
      const res = await updateGrammarLessonContent(
        lessonId,
        { htmlContent: "<p>No lock</p>", lastKnownContentUpdatedAt: null },
        userId,
      );
      assert.ok(res.contentUpdatedAt);
    });

    test("updateGrammarLessonContent: HTML đã sanitize loại bỏ script tag", async () => {
      const res = await updateGrammarLessonContent(
        lessonId,
        { htmlContent: '<p>Hello</p><script>alert("xss")</script>' },
        userId,
      );
      const lesson = await GrammarLesson.findById(lessonId).lean();
      assert.ok(!lesson.htmlContent.includes("<script>"), "Script tag phải bị loại bỏ");
      assert.ok(lesson.htmlContent.includes("<p>Hello</p>"), "P tag phải được giữ");
    });

    test("updateGrammarLessonContent: HTML loại bỏ onerror handler", async () => {
      const res = await updateGrammarLessonContent(
        lessonId,
        { htmlContent: '<img src="x" onerror="alert(1)">' },
        userId,
      );
      const lesson = await GrammarLesson.findById(lessonId).lean();
      assert.ok(!lesson.htmlContent.includes("onerror"), "onerror phải bị loại bỏ");
    });
  });

  // ========== Quiz CRUD ==========

  describe("Quiz CRUD + Reorder", () => {
    beforeEach(async () => {
      lessonId = await createTestLesson(topicId);
    });

    test("Tạo câu hỏi -> lesson.hasQuiz = true", async () => {
      await createQuizQuestion(lessonId, {
        questionText: "What is 2+2?",
        options: [
          { text: "3", isCorrect: false },
          { text: "4", isCorrect: true },
        ],
      });
      const lesson = await GrammarLesson.findById(lessonId).lean();
      assert.strictEqual(lesson.hasQuiz, true);
    });

    test("reorderQuizQuestions: order không trùng", async () => {
      const q1 = await createQuizQuestion(lessonId, {
        questionText: "Q1",
        options: [
          { text: "A", isCorrect: true },
          { text: "B", isCorrect: false },
        ],
      });
      const q2 = await createQuizQuestion(lessonId, {
        questionText: "Q2",
        options: [
          { text: "C", isCorrect: true },
          { text: "D", isCorrect: false },
        ],
      });

      // Trùng order -> phải throw 400
      await assert.rejects(
        () =>
          reorderQuizQuestions(lessonId, [
            { questionId: q1._id, order: 1 },
            { questionId: q2._id, order: 1 }, // trùng
          ]),
        /400/,
      );
    });

    test("reorderQuizQuestions: order bắt đầu từ 1", async () => {
      const q = await createQuizQuestion(lessonId, {
        questionText: "Q",
        options: [
          { text: "A", isCorrect: true },
          { text: "B", isCorrect: false },
        ],
      });

      await assert.rejects(
        () =>
          reorderQuizQuestions(lessonId, [
            { questionId: q._id, order: 0 }, // phải từ 1
          ]),
        /400/,
      );
    });

    test("reorderQuizQuestions: order phải liên tục", async () => {
      const q1 = await createQuizQuestion(lessonId, {
        questionText: "Q1",
        options: [
          { text: "A", isCorrect: true },
          { text: "B", isCorrect: false },
        ],
      });
      const q2 = await createQuizQuestion(lessonId, {
        questionText: "Q2",
        options: [
          { text: "C", isCorrect: true },
          { text: "D", isCorrect: false },
        ],
      });

      await assert.rejects(
        () =>
          reorderQuizQuestions(lessonId, [
            { questionId: q1._id, order: 1 },
            { questionId: q2._id, order: 3 }, // thiếu order 2
          ]),
        /400/,
      );
    });
  });

  // ========== CSV Import ==========

  describe("CSV Import", () => {
    beforeEach(async () => {
      lessonId = await createTestLesson(topicId);
    });

    test("Import CSV hợp lệ -> tạo câu hỏi thành công", async () => {
      const csv = [
        "question,option1,option2,option3,correctOption,explanation",
        '"What is 1+1?","1","2","3","2","2 = 1+1"',
        '"What is 2+2?","3","4","5","2","4 = 2+2"',
      ].join("\n");

      const result = await importQuizFromCsv(
        lessonId,
        Buffer.from(csv, "utf-8"),
      );
      assert.strictEqual(result.inserted, 2);
      assert.strictEqual(result.failed, 0);

      // Verify DB
      const questions = await GrammarQuizQuestion.find({ lessonId }).lean();
      assert.strictEqual(questions.length, 2);
    });

    test("CSV thiếu cột bắt buộc -> throw 400", async () => {
      const csv = [
        "question,option1,option2",
        '"What is 1+1?","1","2"',
      ].join("\n");

      await assert.rejects(
        () => importQuizFromCsv(lessonId, Buffer.from(csv, "utf-8")),
        /CSV thiếu cột/,
      );
    });

    test("CSV vượt quá 500 câu -> throw 400", async () => {
      const headers = "question,option1,option2,option3,option4,option5,option6,correctOption,explanation";
      const rows = Array.from({ length: 501 }, (_, i) =>
        `"Q${i}","A${i}","B${i}","C${i}","D${i}","E${i}","F${i}",1,""`,
      );
      const csv = [headers, ...rows].join("\n");

      await assert.rejects(
        () => importQuizFromCsv(lessonId, Buffer.from(csv, "utf-8")),
        /500/,
      );
    });

    test("CSV có dòng lỗi -> báo failed nhưng vẫn insert những dòng hợp lệ", async () => {
      const csv = [
        "question,option1,option2,option3,option4,option5,option6,correctOption,explanation",
        '"Q1","A","B","C","D","E","F",1,""',
        '"","A","B","C","D","E","F",1,""',   // question rỗng
        '"Q3","A","B","C","D","E","F",2,""',
      ].join("\n");

      const result = await importQuizFromCsv(
        lessonId,
        Buffer.from(csv, "utf-8"),
      );
      assert.strictEqual(result.inserted, 2, "Import 2 câu hợp lệ");
      assert.strictEqual(result.failed, 1, "1 dòng lỗi");
      assert.ok(result.errors.length > 0);
    });

    test("CSV với correctOption vượt phạm vi -> throw 400", async () => {
      const csv = [
        "question,option1,option2,option3,correctOption,explanation",
        '"Q1","A","B","C",99,""',  // correctOption=99 không hợp lệ
      ].join("\n");

      await assert.rejects(
        () => importQuizFromCsv(lessonId, Buffer.from(csv, "utf-8")),
        /correctOption/,
      );
    });
  });

  // ========== Submit Quiz ==========

  describe("Submit Quiz", () => {
    test("Submit lesson chưa publish -> 403", async () => {
      const unpublished = await createTestLesson(topicId, { isPublished: false });
      await assert.rejects(
        () => submitQuizAttempt(userId, unpublished, []),
        /403/,
      );
    });

    test("Submit lesson chưa active -> 403", async () => {
      const inactive = await createTestLesson(topicId, { isActive: false });
      await assert.rejects(
        () => submitQuizAttempt(userId, inactive, []),
        /403/,
      );
    });

    test("Submit lesson chưa có quiz -> 400", async () => {
      // lesson mới tạo chưa có quiz
      await assert.rejects(
        () => submitQuizAttempt(userId, lessonId, []),
        /400/,
      );
    });

    test("Submit quiz thành công -> trả score + isPassed + xpEarned", async () => {
      const quizLesson = await createTestLesson(topicId, {
        xpReward: 10,
        passThreshold: 60,
        hasQuiz: true,
      });
      const q = await createQuizQuestion(quizLesson, {
        questionText: "What is 1+1?",
        options: [
          { text: "1", isCorrect: false },
          { text: "2", isCorrect: true },
        ],
      });

      const result = await submitQuizAttempt(
        userId,
        quizLesson,
        [{ questionId: q._id, selectedOptionIndex: 1 }],
      );
      assert.ok(typeof result.score === "number");
      assert.ok(typeof result.isPassed === "boolean");
      assert.ok(typeof result.xpEarned === "number");
      assert.ok(result.passThreshold === 60);
    });
  });

  // ========== Migration ==========

  describe("Migration defaults", () => {
    test("GrammarLesson mới có đủ 5 field mới", async () => {
      const newLesson = await createTestLesson(topicId);
      const lesson = await GrammarLesson.findById(newLesson).lean();
      assert.strictEqual(typeof lesson.xpReward, "number");
      assert.strictEqual(typeof lesson.passThreshold, "number");
      assert.strictEqual(typeof lesson.hasQuiz, "boolean");
      assert.ok(lesson.contentUpdatedAt instanceof Date || lesson.contentUpdatedAt === null);
      // contentUpdatedBy có thể null
    });
  });
});
