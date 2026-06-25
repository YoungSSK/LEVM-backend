import GrammarLesson from "../models/GrammarLesson.js";

// TẠO BÀI HỌC NGỮ PHÁP MỚI
export const createGrammarLesson = async (data) => {};

// CẬP NHẬT THÔNG TIN BÀI HỌC NGỮ PHÁP
export const updateGrammarLesson = async (lessonId, data) => {};

// XÓA BÀI HỌC NGỮ PHÁP
export const deleteGrammarLesson = async (lessonId) => {};

// LẤY CHI TIẾT BÀI HỌC THEO ID
export const getGrammarLessonById = async (lessonId) => {};

// LẤY CHI TIẾT BÀI HỌC THEO SLUG
export const getGrammarLessonBySlug = async (slug) => {};

// LẤY DANH SÁCH TẤT CẢ BÀI HỌC
// Hỗ trợ phân trang, lọc, sắp xếp
export const getAllGrammarLessons = async (options = {}) => {};

// LẤY DANH SÁCH BÀI HỌC THEO CHỦ ĐỀ
export const getLessonsByTopic = async (topicId, options = {}) => {};

// TÌM KIẾM BÀI HỌC NGỮ PHÁP
export const searchGrammarLessons = async (keyword, options = {}) => {};

// THAY ĐỔI THỨ TỰ HIỂN THỊ BÀI HỌC
export const changeLessonOrder = async (lessonId, newOrder) => {};

// CẬP NHẬT TRẠNG THÁI XUẤT BẢN
export const changePublishStatus = async (lessonId, isPublished) => {};

// CẬP NHẬT TRẠNG THÁI HOẠT ĐỘNG
export const changeLessonStatus = async (lessonId, isActive) => {};

// LẤY DANH SÁCH BÀI HỌC ĐANG ĐƯỢC XUẤT BẢN
// Dùng cho Mobile App
export const getPublishedLessons = async () => {};

// LẤY DANH SÁCH BÀI HỌC ĐANG HOẠT ĐỘNG
// THEO CHỦ ĐỀ
// Dùng cho Mobile App
export const getActiveLessonsByTopic = async (topicId) => {};

// CẬP NHẬT NỘI DUNG HTML BÀI HỌC
// Sau khi convert DOCX bằng Mammoth.js
export const updateHtmlContent = async (
  lessonId,
  htmlContent,
  plainTextContent,
) => {};

// LẤY BÀI HỌC KẾ TIẾP TRONG CÙNG CHỦ ĐỀ
export const getNextLesson = async (lessonId) => {};

// LẤY BÀI HỌC TRƯỚC ĐÓ TRONG CÙNG CHỦ ĐỀ
export const getPreviousLesson = async (lessonId) => {};
