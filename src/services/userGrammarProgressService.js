import UserGrammarProgress from "../models/UserGrammarProgress.js";

// TẠO TIẾN ĐỘ HỌC CHO USER
// (Thường được tạo khi user mở lesson lần đầu)

export const createProgress = async (userId, lessonId) => {};

// ĐÁNH DẤU HOÀN THÀNH BÀI HỌC

export const markLessonCompleted = async (userId, lessonId) => {};

// HỦY TRẠNG THÁI HOÀN THÀNH BÀI HỌC

export const unmarkLessonCompleted = async (userId, lessonId) => {};

// CẬP NHẬT THỜI GIAN TRUY CẬP CUỐI

export const updateLastAccessed = async (userId, lessonId) => {};

// LẤY TIẾN ĐỘ CỦA 1 BÀI HỌC

export const getLessonProgress = async (userId, lessonId) => {};

// LẤY DANH SÁCH CÁC BÀI HỌC ĐÃ HOÀN THÀNH

export const getCompletedLessons = async (userId) => {};

// LẤY DANH SÁCH CÁC BÀI HỌC ĐANG HỌC

export const getLearningLessons = async (userId) => {};

// LẤY TOÀN BỘ TIẾN ĐỘ NGỮ PHÁP CỦA USER

export const getUserGrammarProgress = async (userId) => {};

// TÍNH TIẾN ĐỘ CỦA MỘT TOPIC
// Ví dụ:
// Topic có 10 lesson
// User hoàn thành 2 lesson
// => progress = 20%

export const getTopicProgress = async (userId, topicId) => {};

// LẤY DANH SÁCH TOPIC KÈM TIẾN ĐỘ
// Dùng cho màn hình Home Flutter

export const getAllTopicProgress = async (userId) => {};

// THỐNG KÊ HỌC TẬP NGỮ PHÁP
// Tổng lesson
// Lesson hoàn thành
// Lesson chưa hoàn thành

export const getGrammarStatistics = async (userId) => {};

// XÓA TIẾN ĐỘ CỦA USER TRÊN MỘT LESSON

export const deleteProgress = async (userId, lessonId) => {};
