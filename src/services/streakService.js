import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { awardXP, XP_REWARDS } from "./xpService.js";

const getStartOfDay = (date, timezone = "Asia/Ho_Chi_Minh") => {
  const d = new Date(date);

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(d);
    const getPart = (type) => parts.find((p) => p.type === type)?.value || "01";
    const month = getPart("month");
    const day = getPart("day");
    const year = getPart("year");

    const localDate = new Date(`${year}-${month}-${day}T00:00:00`);
    return localDate;
  } catch {
    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return localDate;
  }
};

const isSameDay = (date1, date2, timezone) => {
  const d1 = getStartOfDay(date1, timezone);
  const d2 = getStartOfDay(date2, timezone);
  return d1.getTime() === d2.getTime();
};

const isYesterday = (date, timezone) => {
  const today = getStartOfDay(new Date(), timezone);
  const targetDay = getStartOfDay(date, timezone);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return targetDay.getTime() === yesterday.getTime();
};

export const getStreakInfo = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error("User not found");
  }

  const today = getStartOfDay(new Date(), user.timezone);
  const lastActivity = user.lastActivityDate
    ? getStartOfDay(user.lastActivityDate, user.timezone)
    : null;

  const studiedToday = lastActivity ? isSameDay(lastActivity, today, user.timezone) : false;

  const streakAtRisk = !studiedToday && user.streak > 0;

  return {
    currentStreak: user.streak,
    longestStreak: user.longestStreak,
    freezeCount: user.freezeCount,
    timezone: user.timezone,
    studiedToday,
    streakAtRisk,
    lastActivityDate: user.lastActivityDate,
  };
};

export const updateStreak = async (userId, options = {}) => {
  const { session } = options;
  const findQuery = session ? User.findById(userId).session(session) : User.findById(userId);

  try {
    const user = await findQuery;
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const today = getStartOfDay(new Date(), user.timezone);
    const lastActivity = user.lastActivityDate
      ? getStartOfDay(user.lastActivityDate, user.timezone)
      : null;

    if (lastActivity && isSameDay(lastActivity, today, user.timezone)) {
      return {
        success: true,
        streakUpdated: false,
        currentStreak: user.streak,
        reason: "already_studied_today",
      };
    }

    let newStreak = user.streak;
    let usedFreeze = false;

    if (!lastActivity) {
      newStreak = 1;
    } else if (isYesterday(lastActivity, user.timezone)) {
      newStreak = user.streak + 1;
    } else {
      if (user.freezeCount > 0) {
        user.freezeCount -= 1;
        newStreak = user.streak + 1;
        usedFreeze = true;
      } else {
        newStreak = 1;
      }
    }

    user.streak = newStreak;
    user.lastActivityDate = new Date();
    if (newStreak > user.longestStreak) {
      user.longestStreak = newStreak;
    }

    const saveOptions = session ? { session } : {};
    await user.save(saveOptions);

    let streakBonusXP = 0;
    const milestoneBonus = getStreakMilestoneBonus(newStreak);
    if (milestoneBonus > 0) {
      streakBonusXP = milestoneBonus;
    } else if (usedFreeze || lastActivity) {
      streakBonusXP = XP_REWARDS.STREAK_BONUS;
    }

    let xpResult = null;
    if (streakBonusXP > 0) {
      try {
        xpResult = await awardXP(
          userId,
          streakBonusXP,
          "streak_bonus",
          null,
          `Streak bonus: ${newStreak} days`
        );
      } catch (xpError) {
        console.error("Failed to award streak bonus XP:", xpError);
      }
    }

    return {
      success: true,
      streakUpdated: true,
      currentStreak: newStreak,
      longestStreak: user.longestStreak,
      usedFreeze,
      xpAwarded: xpResult?.newXP || streakBonusXP,
    };
  } catch (error) {
    throw error;
  }
};

const getStreakMilestoneBonus = (streak) => {
  const milestones = XP_REWARDS.STREAK_MILESTONE;
  if (streak >= 100 && milestones[100]) return milestones[100];
  if (streak >= 60 && milestones[60]) return milestones[60];
  if (streak >= 30 && milestones[30]) return milestones[30];
  if (streak >= 14 && milestones[14]) return milestones[14];
  if (streak >= 7 && milestones[7]) return milestones[7];
  return 0;
};

export const useStreakFreeze = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.freezeCount <= 0) {
    throw new AppError("No streak freeze available", 400);
  }

  user.freezeCount -= 1;
  await user.save();

  return {
    success: true,
    freezeCount: user.freezeCount,
    message: "Streak freeze used successfully",
  };
};

export const addStreakFreeze = async (userId, amount = 1) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.freezeCount += amount;
  await user.save();

  return {
    success: true,
    freezeCount: user.freezeCount,
  };
};

export const resetInactiveStreaks = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const result = await User.updateMany(
    {
      streak: { $gt: 0 },
      lastActivityDate: { $lt: yesterday },
    },
    {
      $set: { streak: 0 },
    }
  );

  return {
    updatedCount: result.modifiedCount,
    message: `Reset ${result.modifiedCount} inactive streaks`,
  };
};

export const getStreakCalendar = async (userId, days = 30) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error("User not found");
  }

  const calendar = [];
  const today = getStartOfDay(new Date(), user.timezone);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const hasActivity =
      user.lastActivityDate && isSameDay(user.lastActivityDate, date, user.timezone);

    calendar.push({
      date: date.toISOString().split("T")[0],
      studied: !!hasActivity,
      isToday: i === 0,
    });
  }

  return {
    currentStreak: user.streak,
    longestStreak: user.longestStreak,
    freezeCount: user.freezeCount,
    calendar,
  };
};

export default {
  getStreakInfo,
  updateStreak,
  useStreakFreeze,
  addStreakFreeze,
  resetInactiveStreaks,
  getStreakCalendar,
};
