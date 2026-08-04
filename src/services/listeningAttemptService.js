import ListeningSet from "../models/ListeningSet.js";
import ListeningQuestion from "../models/ListeningQuestion.js";
import ListeningAudioGroup from "../models/ListeningAudioGroup.js";
import ListeningAttempt from "../models/ListeningAttempt.js";
import { awardXP } from "./xpService.js";
import { updateStreak } from "./streakService.js";
import AppError from "../utils/AppError.js";

/**
 * Submit and grade a learner's listening attempt
 */
export const submitAttempt = async (userId, payload) => {
  const { setId, durationSeconds = 0, answers = [] } = payload;

  const set = await ListeningSet.findById(setId);
  if (!set) {
    throw new AppError("Không tìm thấy bài luyện nghe", 404);
  }

  // Get all active questions for this set
  const questions = await ListeningQuestion.find({ setId, isActive: true }).lean();
  if (questions.length === 0) {
    throw new AppError("Bài nghe chưa có câu hỏi nào", 400);
  }

  // Get groups map if Part 3 or 4 for transcript
  let groupMap = new Map();
  if (set.part === 3 || set.part === 4) {
    const groups = await ListeningAudioGroup.find({ setId, isActive: true }).lean();
    groupMap = new Map(groups.map((g) => [String(g._id), g]));
  }

  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  let correctAnswersCount = 0;
  const gradedAnswers = [];
  const detailedResults = [];

  for (const q of questions) {
    const userAns = answers.find((a) => String(a.questionId) === String(q._id));
    const selectedKey = userAns ? userAns.selectedKey : "";

    const correctOption = q.options.find((opt) => opt.isCorrect);
    const correctKey = correctOption ? correctOption.key : "";

    const isCorrect = selectedKey !== "" && selectedKey === correctKey;
    if (isCorrect) {
      correctAnswersCount += 1;
    }

    gradedAnswers.push({
      questionId: q._id,
      selectedKey,
      isCorrect,
    });

    // Transcript: if Part 3/4, grab from group if q.transcript is empty
    let transcript = q.transcript;
    if ((set.part === 3 || set.part === 4) && (!transcript || transcript.trim() === "") && q.groupId) {
      const parentGroup = groupMap.get(String(q.groupId));
      if (parentGroup) transcript = parentGroup.transcript;
    }

    detailedResults.push({
      questionId: q._id,
      part: q.part,
      groupId: q.groupId,
      questionText: q.questionText,
      selectedKey,
      correctKey,
      isCorrect,
      explanation: q.explanation || "",
      transcript: transcript || "",
      options: q.options,
    });
  }

  const totalQuestions = questions.length;
  const score = Math.round((correctAnswersCount / totalQuestions) * 100);
  const isPassed = score >= set.passThreshold;

  // Check if user previously passed this set
  const previousPassed = await ListeningAttempt.findOne({
    userId,
    setId,
    isPassed: true,
  });

  // Save attempt record
  const attempt = await ListeningAttempt.create({
    userId,
    setId,
    answers: gradedAnswers,
    score,
    totalQuestions,
    correctAnswers: correctAnswersCount,
    isPassed,
    xpEarned: 0,
    durationSeconds: Number(durationSeconds) || 0,
    submittedAt: new Date(),
  });

  let xpEarned = 0;
  // Award XP only on FIRST pass
  if (isPassed && !previousPassed && set.xpReward > 0) {
    try {
      const xpResult = await awardXP(
        userId,
        set.xpReward,
        "listening_set_complete",
        attempt._id
      );
      xpEarned = xpResult ? set.xpReward : 0;
      attempt.xpEarned = xpEarned;
      await attempt.save();
    } catch (err) {
      console.error("Lỗi cộng XP bài nghe:", err);
    }
  }

  // Update learner streak
  try {
    await updateStreak(userId);
  } catch (err) {
    console.error("Lỗi cập nhật streak bài nghe:", err);
  }

  return {
    attemptId: attempt._id,
    setId: set._id,
    setTitle: set.title,
    part: set.part,
    score,
    totalQuestions,
    correctAnswers: correctAnswersCount,
    isPassed,
    passThreshold: set.passThreshold,
    xpEarned,
    durationSeconds: attempt.durationSeconds,
    submittedAt: attempt.submittedAt,
    details: detailedResults,
  };
};

/**
 * Get user attempt history for a listening set
 */
export const getAttemptHistory = async (userId, setId) => {
  const attempts = await ListeningAttempt.find({ userId, setId })
    .sort({ submittedAt: -1 })
    .lean();
  return attempts;
};
