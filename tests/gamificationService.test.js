/**
 * Unit test cho gamificationService (Bước 4 — refactor Grammar quiz).
 *
 * - Test pure logic bằng dependency injection (hàm __setGamificationDeps).
 * - Không cần MongoDB thật — tất cả User/UserGrammarProgress được mock bằng
 *   in-memory store.
 *
 * Chạy:  node --test tests/gamificationService.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import {
  grantRewardsIfFirstPass,
  applyLessonCompletionRewards,
  __setGamificationDeps,
} from "../src/services/gamificationService.js";

// ----- In-memory fakes -----
const memory = {
  UserGrammarProgress: [],
  User: [],
  QuizAttempts: [],
};

const FakeUser = {
  findById: (id) => {
    const found =
      memory.User.find((u) => String(u._id) === String(id)) || null;
    return {
      select: (_fields) => Promise.resolve(found),
    };
  },
};

const FakeUserGrammarProgress = {
  findOne: async (filter) =>
    memory.UserGrammarProgress.find(
      (d) =>
        String(d.userId) === String(filter.userId) &&
        String(d.lessonId) === String(filter.lessonId) &&
        d.isCompleted === filter.isCompleted,
    ) || null,
  updateOne: async (filter, update) => {
    let doc = memory.UserGrammarProgress.find(
      (d) =>
        String(d.userId) === String(filter.userId) &&
        String(d.lessonId) === String(filter.lessonId),
    );
    if (!doc) {
      doc = {
        ...filter,
        ...(update.$set || {}),
        ...(update.$setOnInsert || {}),
      };
      memory.UserGrammarProgress.push(doc);
    } else {
      Object.assign(doc, update.$set || {});
    }
    return { acknowledged: true };
  },
};

const FakeUserQuizAttempt = {
  create: async (payload) => {
    const doc = { ...payload, _id: new mongoose.Types.ObjectId() };
    memory.QuizAttempts.push(doc);
    return doc;
  },
};

// Track calls
const calls = { awardXP: [], updateStreak: [] };

const fakeAwardXP = async (userId, amount, reason, refId, desc) => {
  calls.awardXP.push({ userId, amount, reason, refId, desc });
  const u = memory.User.find((x) => String(x._id) === String(userId));
  if (u) u.xp = (u.xp || 0) + amount;
  return { newXP: u?.xp ?? 0, leveledUp: false, newLevel: 1 };
};

const fakeUpdateStreak = async (userId) => {
  calls.updateStreak.push(userId);
  const u = memory.User.find((x) => String(x._id) === String(userId));
  if (!u) return { streakUpdated: false };
  u.streak = (u.streak || 0) + 1;
  u.lastActivityDate = new Date();
  return { streakUpdated: true, currentStreak: u.streak };
};

// Inject deps vào service.
__setGamificationDeps({
  awardXP: fakeAwardXP,
  updateStreak: fakeUpdateStreak,
  User: FakeUser,
  UserGrammarProgress: FakeUserGrammarProgress,
  UserQuizAttempt: FakeUserQuizAttempt,
});

// ----- Helpers -----
const reset = () => {
  memory.UserGrammarProgress.length = 0;
  memory.User.length = 0;
  memory.QuizAttempts.length = 0;
  calls.awardXP.length = 0;
  calls.updateStreak.length = 0;
};

const seedUser = (overrides = {}) => {
  const u = {
    _id: new mongoose.Types.ObjectId(),
    xp: 0,
    streak: 0,
    lastActivityDate: null,
    timezone: "Asia/Ho_Chi_Minh",
    ...overrides,
  };
  memory.User.push(u);
  return u;
};

const seedLesson = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  title: "Present Simple",
  xpReward: 20,
  passThreshold: 70,
  ...overrides,
});

// ============ Tests ============

test("applyLessonCompletionRewards: lesson null -> reject", async () => {
  reset();
  await assert.rejects(
    () => applyLessonCompletionRewards("u1", null),
    /Bài học không tồn tại/,
  );
});

test("grantRewardsIfFirstPass: isPassed=false -> không cộng XP, không gọi streak", async () => {
  reset();
  const u = seedUser();
  const lesson = seedLesson();
  const r = await grantRewardsIfFirstPass(u._id, lesson, false);
  assert.equal(r.isPassed, false);
  assert.equal(r.xpEarned, 0);
  assert.equal(calls.awardXP.length, 0);
  assert.equal(calls.updateStreak.length, 0);
});

test("grantRewardsIfFirstPass: lần đầu pass -> cộng XP + cập nhật streak", async () => {
  reset();
  const u = seedUser({ streak: 2, lastActivityDate: new Date("2020-01-01") });
  const lesson = seedLesson({ xpReward: 25 });
  const r = await grantRewardsIfFirstPass(u._id, lesson, true);
  assert.equal(r.isPassed, true);
  assert.equal(r.xpEarned, 25);
  assert.equal(calls.awardXP.length, 1);
  assert.equal(calls.awardXP[0].amount, 25);
  assert.equal(calls.awardXP[0].reason, "lesson_complete");
  assert.equal(calls.updateStreak.length, 1);
});

test("grantRewardsIfFirstPass: đã pass trước đó -> không cộng XP lần 2", async () => {
  reset();
  const u = seedUser({ streak: 5 });
  const lesson = seedLesson({ xpReward: 15 });
  memory.UserGrammarProgress.push({
    userId: u._id,
    lessonId: lesson._id,
    isCompleted: true,
    completedAt: new Date(),
  });
  const r = await grantRewardsIfFirstPass(u._id, lesson, true);
  assert.equal(r.isPassed, true);
  assert.equal(r.xpEarned, 0);
  assert.equal(calls.awardXP.length, 0);
  assert.equal(calls.updateStreak.length, 0);
});

test("grantRewardsIfFirstPass: 2 lần pass liên tiếp chỉ cộng XP 1 lần", async () => {
  reset();
  const u = seedUser({ lastActivityDate: new Date("2020-01-01") });
  const lesson = seedLesson({ xpReward: 10 });
  const r1 = await grantRewardsIfFirstPass(u._id, lesson, true);
  const r2 = await grantRewardsIfFirstPass(u._id, lesson, true);
  assert.equal(r1.xpEarned, 10);
  assert.equal(r2.xpEarned, 0);
  assert.equal(calls.awardXP.length, 1);
});

test("grantRewardsIfFirstPass: studiedToday -> skip streak, vẫn cộng XP", async () => {
  reset();
  const u = seedUser({ streak: 3, lastActivityDate: new Date() });
  const lesson = seedLesson({ xpReward: 12 });
  const r = await grantRewardsIfFirstPass(u._id, lesson, true);
  assert.equal(r.xpEarned, 12);
  assert.equal(r.isFirstCompletionToday, false);
  assert.equal(calls.updateStreak.length, 0);
});
