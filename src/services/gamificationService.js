/**
 * Gamification service — lớp trung gian cho "hoàn thành bài học" (áp dụng cho
 * Grammar hiện tại, sẽ tái dụng cho Vocabulary khi có quiz sau này).
 *
 * Nguyên tắc (đã chốt ở SPEC):
 *  - passThreshold lấy từ lesson.passThreshold (mặc định 70).
 *  - Streak cộng 1 lần/ngày (dựa vào User.lastActivityDate theo timezone user).
 *  - Làm lại quiz không giới hạn, nhưng chỉ lần PASS ĐẦU TIÊN mới cộng XP/streak.
 *  - KHÔNG tự implement logic streak — gọi `updateStreak` hiện hữu để đồng bộ
 *    với flow XP/Streak + freeze của hệ thống (xpRoutes / streakRoutes).
 *  - KHÔNG tự tính ngày — dùng Intl.DateTimeFormat như streakService.js để
 *    không phụ thuộc TZ hệ thống (lệch chủ ý với prompt 6.2 dùng dayjs).
 */
import userModel from "../models/User.js";
import userProgressModel from "../models/UserGrammarProgress.js";
import userAttemptModel from "../models/UserQuizAttempt.js";
import AppError from "../utils/AppError.js";
import { awardXP as _awardXP } from "./xpService.js";
import { updateStreak as _updateStreak } from "./streakService.js";

// Cho phép test inject fake implementation.
let deps = {
  awardXP: _awardXP,
  updateStreak: _updateStreak,
  User: userModel,
  UserGrammarProgress: userProgressModel,
  UserQuizAttempt: userAttemptModel,
};

/**
 * Test-only: chỉ dùng trong unit test.
 */
export const __setGamificationDeps = (overrides) => {
  deps = { ...deps, ...overrides };
};

/**
 * Trả về ngày (Date ở 00:00 local) theo timezone user, dùng Intl.DateTimeFormat
 * giống streakService.js. Đảm bảo so sánh "cùng ngày" chính xác.
 */
const getStartOfDayInTZ = (date, timezone) => {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = fmt.formatToParts(new Date(date));
    const get = (t) =>
      parts.find((p) => p.type === t)?.value || "01";
    const localDate = new Date(
      `${get("year")}-${get("month")}-${get("day")}T00:00:00`,
    );
    return localDate;
  } catch {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
};

const isFirstCompletionToday = async (userId, lessonId) => {
  // "Bài đầu tiên hoàn thành trong ngày" = chưa từng có progress completed hôm nay
  const user = await deps.User.findById(userId).select(
    "lastActivityDate timezone",
  );
  if (!user) throw new AppError("User không tồn tại", 404);

  const tz = user.timezone || "Asia/Ho_Chi_Minh";
  const today = getStartOfDayInTZ(new Date(), tz);
  const last = user.lastActivityDate
    ? getStartOfDayInTZ(user.lastActivityDate, tz)
    : null;

  return !last || last.getTime() !== today.getTime();
};

/**
 * Áp dụng phần thưởng khi user PASS quiz lesson lần đầu.
 * Trả về { isPassed, xpEarned, newXp, newStreak, streakIncreased, alreadyPassed }.
 *
 * Không thay đổi gì nếu:
 *  - score < passThreshold.
 *  - user đã pass lesson này trước đó (đánh dấu qua UserGrammarProgress.isCompleted).
 */
export const applyLessonCompletionRewards = async (userId, lesson) => {
  if (!lesson) throw new AppError("Bài học không tồn tại", 404);

  // Đã pass lesson này trước đó chưa?
  const existing = await UserGrammarProgress.findOne({
    userId,
    lessonId: lesson._id,
    isCompleted: true,
  });

  // Nếu chưa từng có progress completed cho lesson này và đạt ngưỡng,
  // service submitQuiz mới truyền vào. Nếu service gọi thẳng applyRewards
  // thì nó vẫn idempotent.
  const isAlreadyPassed = !!existing;

  // Service xử lý điểm: chỉ gọi awardXP+updateStreak khi lần đầu pass.
  // (Hàm này không tự quyết định pass/fail — caller tính score và gọi
  // chỉ khi pass. Để giữ API hợp lý và dễ test, ta giữ contract đó.)
  return {
    isAlreadyPassed,
    skipped: isAlreadyPassed,
  };
};

/**
 * Hàm high-level: nộp kết quả quiz + áp dụng phần thưởng trong 1 luồng.
 * Tách riêng để submitQuiz service gọi (Bước 4).
 *
 * @param {Object} user — Mongoose user doc (đã load hoặc sẽ load ở đây).
 * @param {Object} lesson — Mongoose lesson doc.
 * @param {boolean} isPassed — đã pass hay không
 * @returns {{ isPassed, xpEarned, newXp, newStreak, streakIncreased, longestStreak, isFirstCompletionToday }}
 */
export const grantRewardsIfFirstPass = async (userId, lesson, isPassed) => {
  if (!isPassed) {
    return {
      isPassed: false,
      xpEarned: 0,
      isFirstCompletionToday: false,
    };
  }

  const existing = await deps.UserGrammarProgress.findOne({
    userId,
    lessonId: lesson._id,
    isCompleted: true,
  });
  if (existing) {
    // Làm lại — không cộng thêm gì.
    return {
      isPassed: true,
      xpEarned: 0,
      isFirstCompletionToday: false,
    };
  }

  const firstToday = await isFirstCompletionToday(userId, lesson._id);

  let xpResult = null;
  let streakResult = null;

  try {
    xpResult = await deps.awardXP(
      userId,
      lesson.xpReward || 0,
      "lesson_complete",
      lesson._id,
      `Grammar lesson "${lesson.title}" — passed`,
    );
  } catch (err) {
    console.error("awardXP failed:", err);
    throw new AppError("Không thể cộng XP, vui lòng thử lại", 500);
  }

  // Streak chỉ update khi là "bài đầu tiên hoàn thành trong ngày".
  if (firstToday) {
    try {
      streakResult = await deps.updateStreak(userId);
    } catch (err) {
      // Nếu streak lỗi, vẫn giữ XP — chỉ log.
      console.error("updateStreak failed:", err);
    }
  }

  // Ghi UserGrammarProgress để idempotent cho các lần submit sau.
  await deps.UserGrammarProgress.updateOne(
    { userId, lessonId: lesson._id },
    {
      $set: {
        isCompleted: true,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      },
      $setOnInsert: { userId, lessonId: lesson._id },
    },
    { upsert: true },
  );

  // Lấy lại streak mới nhất.
  const fresh = await deps.User.findById(userId).select(
    "streak longestStreak xp lastActivityDate",
  );

  return {
    isPassed: true,
    xpEarned: lesson.xpReward || 0,
    newXp: fresh?.xp,
    newStreak: fresh?.streak,
    longestStreak: fresh?.longestStreak,
    streakUpdated: !!streakResult?.streakUpdated,
    isFirstCompletionToday: firstToday,
  };
};

/**
 * (Optional) Persist 1 UserQuizAttempt vào DB. Service submit sẽ gọi cái này
 * trước/sau grantRewardsIfFirstPass tuỳ ý — chỉ là helper.
 */
export const saveQuizAttempt = async ({
  userId,
  lessonId,
  answers,
  score,
  isPassed,
  xpEarned,
  isFirstCompletionToday,
}) => {
  return deps.UserQuizAttempt.create({
    userId,
    lessonId,
    answers,
    score,
    isPassed,
    xpEarned,
    isFirstCompletionToday,
  });
};

export default {
  applyLessonCompletionRewards,
  grantRewardsIfFirstPass,
  saveQuizAttempt,
};
