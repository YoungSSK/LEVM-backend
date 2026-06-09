import VocabularyLesson from "../models/VocabularyLesson.js";
import VocabularyLessonWord from "../models/VocabularyLessonWord.js";

//Hàm tạo bài học mới
export const createLesson = async (data) => {};

//Hàm cập nhật bài học
export const updateLesson = async (lessonId, data) => {};

//Hàm xóa bài bài học
export const deleteLesson = async (lessonId) => {};

//Hàm lấy bài học theo ID
export const getById = async (lessonId) => {};

//Hàm lấy danh sách bài học theo chủ đề
export const getByTopic = async (topicId) => {};

//Hàm thêm từ vào bài học
export const addWord = async (lessonId, wordId) => {};

//Hàm xóa từ khỏi danh sách bài học
export const removeWord = async (lessonId, wordId) => {};

//Hàm lấy danh sách từ trong bài lesson
export const getWord = async (lessonId) => {};

//Hàm lấy thay đổi thư tự các lesson trong Topic
export const changeOrder = async (topicId) => {};
