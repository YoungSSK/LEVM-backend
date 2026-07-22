import mongoose from "mongoose";
import LessonAttempt from "../models/LessonAttempt.js";
import VocabularyLesson from "../models/VocabularyLesson.js";
import AppError from "../utils/AppError.js";
import { awardXP, XP_REWARDS } from "./xpService.js";
import { updateStreak } from "./streakService.js";

const calculateStars = (score) => {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
};

export const createAttempt = async (userId, lessonId, level) => {
  const lesson = await VocabularyLesson.findById(lessonId);
  if (!lesson) {
    throw new AppError("Lesson not found", 404);
  }

  if (level < 1 || level > 3) {
    throw new AppError("Invalid level. Must be 1, 2, or 3", 400);
  }

  const existingAttempt = await LessonAttempt.findOne({
    lessonId,
    userId,
    level,
    status: "in_progress",
  });

  if (existingAttempt) {
    return existingAttempt;
  }

  const attempt = await LessonAttempt.create({
    lessonId,
    userId,
    level,
    status: "in_progress",
    startedAt: new Date(),
  });

  return attempt;
};

export const getAttempt = async (attemptId, userId) => {
  const attempt = await LessonAttempt.findOne({
    _id: attemptId,
    userId,
  }).lean();

  if (!attempt) {
    throw new AppError("Attempt not found", 404);
  }

  return attempt;
};

export const submitAnswer = async (attemptId, userId, wordId, userAnswer, isCorrect, timeSpent = 0) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const attempt = await LessonAttempt.findOne({
      _id: attemptId,
      userId,
      status: "in_progress",
    }).session(session);

    if (!attempt) {
      throw new AppError("Attempt not found or already completed", 404);
    }

    const existingAnswerIndex = attempt.answers.findIndex(
      (a) => a.wordId.toString() === wordId.toString()
    );

    if (existingAnswerIndex >= 0) {
      attempt.answers[existingAnswerIndex] = {
        wordId,
        isCorrect,
        userAnswer,
        timeSpent,
      };
    } else {
      attempt.answers.push({
        wordId,
        isCorrect,
        userAnswer,
        timeSpent,
      });
    }

    attempt.totalCount = attempt.answers.length;
    attempt.correctCount = attempt.answers.filter((a) => a.isCorrect).length;
    attempt.score = attempt.totalCount > 0
      ? Math.round((attempt.correctCount / attempt.totalCount) * 100)
      : 0;

    await attempt.save({ session });
    await session.commitTransaction();

    return {
      success: true,
      attempt: attempt.toObject(),
      isCorrect,
      currentScore: attempt.score,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const completeAttempt = async (attemptId, userId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const attempt = await LessonAttempt.findOne({
      _id: attemptId,
      userId,
    }).session(session);

    if (!attempt) {
      throw new AppError("Attempt not found", 404);
    }

    if (attempt.status === "completed") {
      throw new AppError("Attempt already completed", 400);
    }

    attempt.status = "completed";
    attempt.completedAt = new Date();
    attempt.score = attempt.totalCount > 0
      ? Math.round((attempt.correctCount / attempt.totalCount) * 100)
      : 0;
    attempt.stars = calculateStars(attempt.score);

    await attempt.save({ session });

    const xpResults = {
      levelXP: 0,
      bonusXP: 0,
      perfectBonus: false,
      streakXP: 0,
      totalXP: 0,
    };

    const levelXPMap = {
      1: XP_REWARDS.LEVEL_1_COMPLETE,
      2: XP_REWARDS.LEVEL_2_COMPLETE,
      3: XP_REWARDS.LEVEL_3_COMPLETE,
    };
    const baseXP = levelXPMap[attempt.level] || XP_REWARDS.LEVEL_1_COMPLETE;
    xpResults.levelXP = baseXP;

    let xpAwarded = baseXP;
    const descriptions = [];

    try {
      const xpResult = await awardXP(
        userId,
        baseXP,
        "level_complete",
        attempt._id,
        `Hoàn thành cấp độ ${attempt.level}: ${attempt.score}%`,
        { session }
      );
      xpResults.totalXP = xpResult.xpAwarded;
    } catch (xpError) {
      console.error("Failed to award level XP:", xpError);
    }

    if (attempt.stars === 3) {
      xpResults.perfectBonus = true;
      xpResults.bonusXP = XP_REWARDS.PERFECT_SCORE_BONUS;
      xpResults.totalXP += XP_REWARDS.PERFECT_SCORE_BONUS;
      try {
        await awardXP(
          userId,
          XP_REWARDS.PERFECT_SCORE_BONUS,
          "perfect_score",
          attempt._id,
          `3 sao cấp độ ${attempt.level}`,
          { session }
        );
      } catch (xpError) {
        console.error("Failed to award perfect bonus:", xpError);
      }
    }

    let streakResult = null;
    try {
      streakResult = await updateStreak(userId, { session });
      if (streakResult?.xpAwarded > 0) {
        xpResults.streakXP = streakResult.xpAwarded;
        xpResults.totalXP += streakResult.xpAwarded;
      }
    } catch (streakError) {
      console.error("Failed to update streak:", streakError);
    }

    const otherLevelAttempts = await LessonAttempt.find({
      lessonId: attempt.lessonId,
      userId,
      status: "completed",
      _id: { $ne: attempt._id },
    }).session(session);

    const allLevelsComplete = [1, 2, 3].every((lvl) => {
      if (lvl === attempt.level) return true;
      return otherLevelAttempts.some((a) => a.level === lvl);
    });

    if (allLevelsComplete && attempt.level === 3) {
      xpResults.lessonBonusXP = XP_REWARDS.LESSON_COMPLETE_BONUS;
      xpResults.totalXP += XP_REWARDS.LESSON_COMPLETE_BONUS;
      try {
        await awardXP(
          userId,
          XP_REWARDS.LESSON_COMPLETE_BONUS,
          "lesson_complete",
          attempt.lessonId,
          "Hoàn thành toàn bộ bài học",
          { session }
        );
      } catch (xpError) {
        console.error("Failed to award lesson bonus:", xpError);
      }
    }

    await session.commitTransaction();

    return {
      success: true,
      attempt: attempt.toObject(),
      stars: attempt.stars,
      xpResults,
      streakResult: streakResult
        ? {
            currentStreak: streakResult.currentStreak,
            longestStreak: streakResult.longestStreak,
            streakUpdated: streakResult.streakUpdated,
            usedFreeze: streakResult.usedFreeze,
          }
        : null,
      allLevelsComplete,
      leveledUp: false,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getLessonAttempts = async (userId, lessonId) => {
  const attempts = await LessonAttempt.find({
    lessonId,
    userId,
    status: "completed",
  })
    .sort({ completedAt: -1 })
    .lean();

  return attempts;
};

export const getLessonStats = async (userId, lessonId) => {
  const attempts = await LessonAttempt.find({
    lessonId,
    userId,
    status: "completed",
  }).lean();

  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      bestScore: 0,
      bestStars: 0,
      totalStars: 0,
      averageScore: 0,
      levelStats: {
        1: { attempts: 0, bestScore: 0, bestStars: 0, completed: false },
        2: { attempts: 0, bestScore: 0, bestStars: 0, completed: false },
        3: { attempts: 0, bestScore: 0, bestStars: 0, completed: false },
      },
    };
  }

  const levelStats = { 1: null, 2: null, 3: null };
  let totalScore = 0;

  for (const attempt of attempts) {
    totalScore += attempt.score;

    const existing = levelStats[attempt.level];
    if (!existing || attempt.score > existing.bestScore) {
      levelStats[attempt.level] = {
        attempts: 1,
        bestScore: attempt.score,
        bestStars: attempt.stars,
        completed: true,
      };
    } else {
      existing.attempts += 1;
    }
  }

  for (let lvl = 1; lvl <= 3; lvl++) {
    if (!levelStats[lvl]) {
      levelStats[lvl] = {
        attempts: 0,
        bestScore: 0,
        bestStars: 0,
        completed: false,
      };
    }
  }

  // Total stars = sum of best stars per level (max 9). NOT sum across every
  // attempt — otherwise re-attempting a level inflates the count.
  const totalStars = [levelStats[1], levelStats[2], levelStats[3]]
    .reduce((sum, ls) => sum + (ls?.bestStars ?? 0), 0);

  return {
    totalAttempts: attempts.length,
    bestScore: Math.max(...attempts.map((a) => a.score)),
    bestStars: Math.max(...attempts.map((a) => a.stars)),
    totalStars,
    averageScore: Math.round(totalScore / attempts.length),
    levelStats,
  };
};

export const verifySpelling = async (userAnswer, correctAnswer) => {
  const normalize = (str) =>
    str
      .toLowerCase()
      .trim()
      .replace(/['']/g, "")
      .replace(/\s+/g, " ");

  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(correctAnswer);

  if (normalizedUser === normalizedCorrect) {
    return { correct: true, score: 100 };
  }

  const commonMistakes = {
    "ph": "f",
    "th": "t",
    "gh": "g",
    "ng": "n",
    "nk": "n",
    "tr": "t",
    "ch": "c",
    "qu": "q",
    "gi": "j",
    "g": "j",
  };

  let userNormalized = normalizedUser;
  let correctNormalized = normalizedCorrect;

  for (const [wrong, correct] of Object.entries(commonMistakes)) {
    userNormalized = userNormalized.replace(new RegExp(wrong, "g"), correct);
    correctNormalized = correctNormalized.replace(new RegExp(wrong, "g"), correct);
  }

  if (userNormalized === correctNormalized) {
    return { correct: true, score: 100, partial: true };
  }

  const maxLen = Math.max(normalizedUser.length, normalizedCorrect.length);
  const distance = levenshteinDistance(normalizedUser, normalizedCorrect);
  const similarity = 1 - distance / maxLen;

  if (similarity >= 0.8) {
    return {
      correct: false,
      score: Math.round(similarity * 100),
      similarity: Math.round(similarity * 100),
    };
  }

  return {
    correct: false,
    score: 0,
    similarity: Math.round(similarity * 100),
  };
};

const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
};

export default {
  createAttempt,
  getAttempt,
  submitAnswer,
  completeAttempt,
  getLessonAttempts,
  getLessonStats,
  verifySpelling,
};
