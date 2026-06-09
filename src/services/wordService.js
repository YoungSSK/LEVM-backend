import Word from "../models/Word.js";

//Hàm tạo từ mới
export const create = async (data) => {};
//Hàm update thông tin từ
export const update = async (wordId, data) => {};
// Hàm xóa từ
export const deleted = async (wordId) => {};
//Hàm lấy thông tin từ theo Id
export const getById = async (wordId) => {};
//Hàm lấy chi tiết thông tin của từ
export const getDeatail = async (wordId) => {};
//Hàm lấy danh sách tất cả từ
export const getAll = async () => {};
//Hàm tìm kiếm từ
export const search = async (keyword) => {};
//Hàm thay đổi trạng thái hoạt động của từ
export const changeStatus = async (wordId, isActive) => {};
