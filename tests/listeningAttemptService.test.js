import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit test cho logic chấm điểm bài nghe (listeningAttemptService)
 */

// Simple grading function logic test
function gradeListeningAnswers(questions, userAnswers, passThreshold = 70) {
  let correctCount = 0;
  const details = [];

  for (const q of questions) {
    const userAns = userAnswers.find((a) => String(a.questionId) === String(q._id));
    const selectedKey = userAns ? userAns.selectedKey : "";
    const correctOpt = q.options.find((o) => o.isCorrect);
    const correctKey = correctOpt ? correctOpt.key : "";

    const isCorrect = selectedKey !== "" && selectedKey === correctKey;
    if (isCorrect) correctCount++;

    details.push({
      questionId: q._id,
      selectedKey,
      correctKey,
      isCorrect,
      explanation: q.explanation || "",
      transcript: q.transcript || "",
    });
  }

  const totalQuestions = questions.length;
  const score = Math.round((correctCount / totalQuestions) * 100);
  const isPassed = score >= passThreshold;

  return {
    score,
    totalQuestions,
    correctCount,
    isPassed,
    details,
  };
}

test("gradeListeningAnswers - All correct answers should pass with 100% score", () => {
  const mockQuestions = [
    {
      _id: "q1",
      options: [
        { key: "A", isCorrect: true },
        { key: "B", isCorrect: false },
        { key: "C", isCorrect: false },
        { key: "D", isCorrect: false },
      ],
      explanation: "A is correct description",
      transcript: "Transcript Q1",
    },
    {
      _id: "q2",
      options: [
        { key: "A", isCorrect: false },
        { key: "B", isCorrect: true },
        { key: "C", isCorrect: false },
        { key: "D", isCorrect: false },
      ],
      explanation: "B is correct choice",
      transcript: "Transcript Q2",
    },
  ];

  const userAnswers = [
    { questionId: "q1", selectedKey: "A" },
    { questionId: "q2", selectedKey: "B" },
  ];

  const result = gradeListeningAnswers(mockQuestions, userAnswers, 70);

  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.correctCount, 2);
  assert.strictEqual(result.totalQuestions, 2);
  assert.strictEqual(result.isPassed, true);
  assert.strictEqual(result.details[0].isCorrect, true);
  assert.strictEqual(result.details[0].explanation, "A is correct description");
  assert.strictEqual(result.details[0].transcript, "Transcript Q1");
});

test("gradeListeningAnswers - Incorrect answers should fail if below passThreshold", () => {
  const mockQuestions = [
    {
      _id: "q1",
      options: [
        { key: "A", isCorrect: true },
        { key: "B", isCorrect: false },
      ],
      explanation: "A is correct",
    },
    {
      _id: "q2",
      options: [
        { key: "A", isCorrect: false },
        { key: "B", isCorrect: true },
      ],
      explanation: "B is correct",
    },
  ];

  const userAnswers = [
    { questionId: "q1", selectedKey: "B" }, // wrong
    { questionId: "q2", selectedKey: "A" }, // wrong
  ];

  const result = gradeListeningAnswers(mockQuestions, userAnswers, 70);

  assert.strictEqual(result.score, 0);
  assert.strictEqual(result.correctCount, 0);
  assert.strictEqual(result.isPassed, false);
  assert.strictEqual(result.details[0].isCorrect, false);
  assert.strictEqual(result.details[0].correctKey, "A");
});
