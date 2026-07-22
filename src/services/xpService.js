import XPTransaction from "../models/XPTransaction.js";
import User from "../models/User.js";

const XP_PER_LEVEL = 100;

export const calculateLevel = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;

export const calculateXpInLevel = (xp) => xp % XP_PER_LEVEL;

export const calculateXpToNextLevel = (xp) => XP_PER_LEVEL - (xp % XP_PER_LEVEL);

export const calculateProgressInLevel = (xp) => (xp % XP_PER_LEVEL) / XP_PER_LEVEL;

export const awardXP = async (userId, amount, reason, referenceId = null, description = "", options = {}) => {
  const { session: externalSession } = options;
  const shouldOwnSession = !externalSession;
  const session = externalSession || await XPTransaction.startSession();

  try {
    if (shouldOwnSession) {
      session.startTransaction();
    }

    const findQuery = externalSession
      ? User.findById(userId).session(externalSession)
      : User.findById(userId).session(session);
    const user = await findQuery;

    if (!user) {
      throw new Error("User not found");
    }

    const oldLevel = calculateLevel(user.xp);

    const createOptions = externalSession ? { session: externalSession } : { session };
    const transaction = await XPTransaction.create(
      [
        {
          userId,
          amount,
          reason,
          referenceId,
          description,
        },
      ],
      createOptions
    );

    user.xp = Math.max(0, user.xp + amount);
    const saveOptions = externalSession ? { session: externalSession } : { session };
    await user.save(saveOptions);

    const newLevel = calculateLevel(user.xp);
    const leveledUp = newLevel > oldLevel;

    if (shouldOwnSession) {
      await session.commitTransaction();
    }

    return {
      success: true,
      newXP: user.xp,
      oldLevel,
      newLevel,
      leveledUp,
      xpAwarded: amount,
      xpInLevel: calculateXpInLevel(user.xp),
      xpToNextLevel: calculateXpToNextLevel(user.xp),
      progressInLevel: calculateProgressInLevel(user.xp),
    };
  } catch (error) {
    if (shouldOwnSession) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (shouldOwnSession) {
      session.endSession();
    }
  }
};

export const getUserXPInfo = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error("User not found");
  }

  const currentLevel = calculateLevel(user.xp);
  const xpInLevel = calculateXpInLevel(user.xp);
  const xpToNextLevel = calculateXpToNextLevel(user.xp);
  const progressInLevel = calculateProgressInLevel(user.xp);

  return {
    totalXP: user.xp,
    currentLevel,
    xpInLevel,
    xpToNextLevel,
    progressInLevel,
    xpPerLevel: XP_PER_LEVEL,
  };
};

export const getXPHistory = async (userId, limit = 50, skip = 0) => {
  const transactions = await XPTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await XPTransaction.countDocuments({ userId });

  return {
    transactions,
    total,
    limit,
    skip,
    hasMore: skip + transactions.length < total,
  };
};

export const getXPSummary = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [todayXP, weekXP, totalTransactions] = await Promise.all([
    XPTransaction.aggregate([
      { $match: { userId, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    XPTransaction.aggregate([
      { $match: { userId, createdAt: { $gte: weekAgo } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    XPTransaction.countDocuments({ userId }),
  ]);

  return {
    todayXP: todayXP[0]?.total || 0,
    weekXP: weekXP[0]?.total || 0,
    totalTransactions,
  };
};

export const XP_REWARDS = {
  CORRECT_ANSWER: 5,
  LEVEL_1_COMPLETE: 10,
  LEVEL_2_COMPLETE: 15,
  LEVEL_3_COMPLETE: 20,
  PERFECT_SCORE_BONUS: 15,
  LESSON_COMPLETE_BONUS: 30,
  STREAK_BONUS: 5,
  STREAK_MILESTONE: {
    7: 20,
    14: 30,
    30: 50,
    60: 75,
    100: 100,
  },
};

export default {
  awardXP,
  getUserXPInfo,
  getXPHistory,
  getXPSummary,
  calculateLevel,
  calculateXpInLevel,
  calculateXpToNextLevel,
  calculateProgressInLevel,
  XP_REWARDS,
};
