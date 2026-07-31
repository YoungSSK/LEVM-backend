import ReadingAttempt from "../models/ReadingAttempt.js";
import ReadingPassage from "../models/ReadingPassage.js";
import ReadingQuestionSet from "../models/ReadingQuestionSet.js";
import ReadingQuestion from "../models/ReadingQuestion.js";
import AppError from "../utils/AppError.js";
import { grantRewardsIfFirstPass } from "./gamificationService.js";

// ===== Grading helpers =====

/**
 * Chuẩn hóa string đáp án — lowercase, trim — dùng để so sánh fill_in_blank, short_answer, ...
 */
const normalizeAnswerText = (text) =>
  typeof text === "string" ? text.trim().toLowerCase() : "";

/**
 * Chấm điểm 1 câu hỏi dựa trên questionType.
 * Trả về { isCorrect: boolean }.
 */
const gradeAnswer = (question, userAnswer) => {
  const { questionType, options, correctAnswer, correctMatches, caseSensitive } = question;

  if (userAnswer === undefined || userAnswer === null) {
    return { isCorrect: false };
  }

  // --- Multiple Choice ---
  if (questionType === "multiple_choice") {
    const { selectedKey } = userAnswer || {};
    if (!selectedKey) return { isCorrect: false };
    const correct = options.find((o) => o.isCorrect);
    return { isCorrect: correct ? correct.key === selectedKey : false };
  }

  // --- Multiple Answer ---
  if (questionType === "multiple_answer") {
    const { selectedKeys = [] } = userAnswer || {};
    const correctKeys = options.filter((o) => o.isCorrect).map((o) => o.key);
    if (correctKeys.length === 0) return { isCorrect: false };
    const selectedSet = new Set(selectedKeys);
    const correctSet = new Set(correctKeys);
    const isMatch =
      selectedSet.size === correctSet.size &&
      [...correctSet].every((k) => selectedSet.has(k));
    return { isCorrect: isMatch };
  }

  // --- True/False, TFNG, YNNG ---
  if (["true_false", "true_false_not_given", "yes_no_not_given"].includes(questionType)) {
    const { answer } = userAnswer || {};
    return {
      isCorrect:
        typeof answer === "string" &&
        answer.toLowerCase() === (correctAnswer || "").toLowerCase(),
    };
  }

  // --- Matching types ---
  if (
    [
      "matching_heading", "matching_information",
      "matching_feature", "matching_sentence_ending",
    ].includes(questionType)
  ) {
    const { matches = [] } = userAnswer || {};
    if (correctMatches.length === 0) return { isCorrect: false };

    const correctMap = new Map(correctMatches.map((m) => [m.leftId, m.rightId]));
    const userMap = new Map(matches.map((m) => [m.leftId, m.rightId]));

    if (userMap.size !== correctMap.size) return { isCorrect: false };

    const allCorrect = [...correctMap].every(
      ([leftId, rightId]) => userMap.get(leftId) === rightId,
    );
    return { isCorrect: allCorrect };
  }

  // --- Completion / Short Answer / Fill in Blank ---
  if (
    [
      "sentence_completion", "summary_completion", "note_completion",
      "table_completion", "flow_chart_completion", "diagram_completion",
      "short_answer", "fill_in_blank",
    ].includes(questionType)
  ) {
    const { textAnswer = "" } = userAnswer || {};
    if (!correctAnswer) return { isCorrect: false };

    const normalize = caseSensitive
      ? (s) => s.trim()
      : normalizeAnswerText;

    const userNorm = normalize(textAnswer);

    if (Array.isArray(correctAnswer)) {
      return { isCorrect: correctAnswer.some((ca) => normalize(ca) === userNorm) };
    }

    return { isCorrect: normalize(correctAnswer) === userNorm };
  }

  return { isCorrect: false };
};

// ===== Service =====

export const startAttempt = async (userId, passageId, questionSetId) => {
  // Kiểm tra passage tồn tại và published
  const passage = await ReadingPassage.findById(passageId)
    .select("_id status hasQuestions xpReward passThreshold")
    .lean();
  if (!passage) throw new AppError("Bài đọc không tồn tại", 404);
  if (passage.status !== "published") {
    throw new AppError("Bài đọc chưa được xuất bản", 403);
  }
  if (!passage.hasQuestions) {
    throw new AppError("Bài đọc chưa có câu hỏi", 400);
  }

  // Kiểm tra question set tồn tại
  const questionSet = await ReadingQuestionSet.findById(questionSetId)
    .select("_id passageId isActive questionCount")
    .lean();
  if (!questionSet) throw new AppError("Bộ câu hỏi không tồn tại", 404);
  if (!questionSet.isActive) throw new AppError("Bộ câu hỏi không hoạt động", 403);
  if (questionSet.passageId.toString() !== passageId.toString()) {
    throw new AppError("Bộ câu hỏi không thuộc bài đọc này", 400);
  }
  if (questionSet.questionCount === 0) {
    throw new AppError("Bộ câu hỏi chưa có câu hỏi nào", 400);
  }

  // Tạo attempt mới
  const attempt = await ReadingAttempt.create({
    userId,
    passageId,
    questionSetId,
    status: "in_progress",
    startedAt: new Date(),
  });

  return {
    attemptId: attempt._id,
    passageId,
    questionSetId,
    startedAt: attempt.startedAt,
  };
};

export const submitAttempt = async (attemptId, userId, data) => {
  const { answers: submittedAnswers = [], duration = 0 } = data;

  // Lấy attempt
  const attempt = await ReadingAttempt.findById(attemptId);
  if (!attempt) throw new AppError("Attempt không tồn tại", 404);
  if (attempt.userId.toString() !== userId.toString()) {
    throw new AppError("Không có quyền submit attempt này", 403);
  }
  if (attempt.status !== "in_progress") {
    throw new AppError("Attempt đã được nộp trước đó", 400);
  }

  // Lấy passage và question set
  const passage = await ReadingPassage.findById(attempt.passageId)
    .select("xpReward passThreshold title")
    .lean();
  if (!passage) throw new AppError("Bài đọc không tồn tại", 404);

  const questionSet = await ReadingQuestionSet.findById(attempt.questionSetId)
    .select("xpReward passThreshold")
    .lean();

  // Question set có thể override xpReward / passThreshold của passage
  const xpReward = questionSet?.xpReward ?? passage.xpReward ?? 15;
  const passThreshold = questionSet?.passThreshold ?? passage.passThreshold ?? 70;

  // Lấy tất cả câu hỏi active của set
  const questions = await ReadingQuestion.find({
    questionSetId: attempt.questionSetId,
    isActive: true,
  })
    .sort({ order: 1 })
    .lean();

  if (questions.length === 0) {
    throw new AppError("Bộ câu hỏi không có câu hỏi nào", 400);
  }

  // Map câu trả lời của user theo questionId
  const answerMap = new Map(
    submittedAnswers.map((a) => [String(a.questionId), a]),
  );

  // Chấm điểm
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let totalPoints = 0;
  let earnedPoints = 0;
  const gradedAnswers = [];

  for (const q of questions) {
    const qId = String(q._id);
    const userAnswerData = answerMap.get(qId);
    const points = q.points ?? 1;
    totalPoints += points;

    if (!userAnswerData || userAnswerData.userAnswer === undefined || userAnswerData.userAnswer === null) {
      skippedCount++;
      gradedAnswers.push({
        questionId: q._id,
        questionType: q.questionType,
        userAnswer: null,
        isCorrect: false,
        pointsEarned: 0,
        timeSpent: userAnswerData?.timeSpent ?? 0,
      });
      continue;
    }

    const { isCorrect } = gradeAnswer(q, userAnswerData.userAnswer);

    if (isCorrect) {
      correctCount++;
      earnedPoints += points;
    } else {
      wrongCount++;
    }

    gradedAnswers.push({
      questionId: q._id,
      questionType: q.questionType,
      userAnswer: userAnswerData.userAnswer,
      isCorrect,
      pointsEarned: isCorrect ? points : 0,
      timeSpent: userAnswerData.timeSpent ?? 0,
    });
  }

  const score =
    totalPoints > 0
      ? Math.round((earnedPoints / totalPoints) * 100 * 100) / 100
      : 0;
  const isPassed = score >= passThreshold;

  // Phần thưởng gamification (lần pass đầu tiên)
  let rewards = {
    xpEarned: 0,
    newXp: undefined,
    newStreak: undefined,
    longestStreak: undefined,
    streakUpdated: false,
    isFirstCompletionToday: false,
    alreadyPassed: false,
  };

  if (isPassed) {
    try {
      // Tạo lesson-like object để tái sử dụng gamificationService
      const passageLike = {
        _id: passage._id || attempt.passageId,
        xpReward,
        passThreshold,
        isActive: true,
        isPublished: true,
      };
      const r = await grantRewardsIfFirstPass(userId, passageLike, true);
      rewards = {
        xpEarned: r.xpEarned,
        newXp: r.newXp,
        newStreak: r.newStreak,
        longestStreak: r.longestStreak,
        streakUpdated: r.streakUpdated,
        isFirstCompletionToday: r.isFirstCompletionToday,
        alreadyPassed: !r.isFirstCompletionToday && r.xpEarned === 0,
      };
    } catch (gamErr) {
      // Không fail submit vì lỗi gamification
      console.error("Lỗi gamification khi submit Reading:", gamErr.message);
    }
  }

  // Cập nhật attempt
  attempt.answers = gradedAnswers;
  attempt.totalQuestions = questions.length;
  attempt.correctAnswers = correctCount;
  attempt.wrongAnswers = wrongCount;
  attempt.skippedAnswers = skippedCount;
  attempt.totalPoints = totalPoints;
  attempt.earnedPoints = earnedPoints;
  attempt.score = score;
  attempt.isPassed = isPassed;
  attempt.xpEarned = rewards.xpEarned;
  attempt.isFirstCompletionToday = rewards.isFirstCompletionToday;
  attempt.duration = duration;
  attempt.submittedAt = new Date();
  attempt.status = "completed";

  await attempt.save();

  return {
    attemptId: attempt._id,
    passageId: attempt.passageId,
    questionSetId: attempt.questionSetId,
    score,
    passThreshold,
    isPassed,
    totalQuestions: questions.length,
    correctAnswers: correctCount,
    wrongAnswers: wrongCount,
    skippedAnswers: skippedCount,
    totalPoints,
    earnedPoints,
    duration,
    submittedAt: attempt.submittedAt,
    ...rewards,
  };
};

export const getAttemptById = async (attemptId, userId) => {
  const attempt = await ReadingAttempt.findById(attemptId)
    .populate("passageId", "title slug description thumbnail categoryId")
    .populate("questionSetId", "title setType")
    .lean();

  if (!attempt) throw new AppError("Attempt không tồn tại", 404);
  if (attempt.userId.toString() !== userId.toString()) {
    throw new AppError("Không có quyền xem attempt này", 403);
  }

  // Ẩn đáp án trong summary (không review mode)
  const summaryAnswers = attempt.answers.map((a) => ({
    questionId: a.questionId,
    questionType: a.questionType,
    isCorrect: a.isCorrect,
    pointsEarned: a.pointsEarned,
    timeSpent: a.timeSpent,
  }));

  return { ...attempt, answers: summaryAnswers };
};

export const getReviewData = async (attemptId, userId) => {
  const attempt = await ReadingAttempt.findById(attemptId).lean();
  if (!attempt) throw new AppError("Attempt không tồn tại", 404);
  if (attempt.userId.toString() !== userId.toString()) {
    throw new AppError("Không có quyền xem attempt này", 403);
  }
  if (attempt.status !== "completed") {
    throw new AppError("Attempt chưa hoàn thành", 400);
  }

  // Lấy câu hỏi kèm đáp án đúng để review
  const questions = await ReadingQuestion.find({
    questionSetId: attempt.questionSetId,
    isActive: true,
  })
    .sort({ order: 1 })
    .lean();

  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  const detailedAnswers = attempt.answers.map((a) => {
    const q = questionMap.get(String(a.questionId)) || {};
    return {
      ...a,
      question: {
        questionText: q.questionText,
        questionType: q.questionType,
        contextText: q.contextText,
        locationInPassage: q.locationInPassage,
        options: q.options,
        leftItems: q.leftItems,
        rightItems: q.rightItems,
        correctMatches: q.correctMatches,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
      },
    };
  });

  const passage = await ReadingPassage.findById(attempt.passageId)
    .select("title slug description")
    .lean();

  return { ...attempt, answers: detailedAnswers, passage };
};

export const getUserAttemptHistory = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "submittedAt",
    sortOrder = "desc",
  } = options;

  const skip = (page - 1) * limit;
  const filter = { userId, status: "completed" };
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [attempts, total] = await Promise.all([
    ReadingAttempt.find(filter)
      .populate("passageId", "title slug thumbnail categoryId")
      .populate("questionSetId", "title setType")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    ReadingAttempt.countDocuments(filter),
  ]);

  return {
    attempts,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getAttemptsByPassage = async (userId, passageId, options = {}) => {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const filter = { userId, passageId, status: "completed" };

  const [attempts, total] = await Promise.all([
    ReadingAttempt.find(filter)
      .populate("questionSetId", "title setType")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ReadingAttempt.countDocuments(filter),
  ]);

  return {
    attempts,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};
