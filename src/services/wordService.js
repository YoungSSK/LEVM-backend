import Word from "../models/Word.js";
import WordMeaning from "../models/WordMeaning.js";
import { getWordInfo } from "../utils/dictionary.js";
import { getImageByWord } from "../utils/pexels.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";
import VocabularyLesson from "../models/VocabularyLesson.js";
import VocabularyTopic from "../models/VocabularyTopic.js";
import VocabularyLessonWord from "../models/VocabularyLessonWord.js";
import slugify from "slugify";
//Hàm tạo từ mới
export const create = async (data) => {
  const { word, meaning, partOfSpeech, difficulty } = data;
  //Kiểm  tra từ tồn tại chưa
  const existedWord = await Word.findOne({ word: word });
  if (existedWord) {
    throw new AppError("Từ vựng đã tồn tại", 409);
  }
  const slug = slugify(word, { lower: true, strict: true, locale: "vi" });
  //Lấy pronunciation + audio + img
  const [apiInfo, imageInfo] = await Promise.all([
    getWordInfo(word),
    getImageByWord(word),
  ]);

  //create
  const newWord = await Word.create({
    word,
    slug,
    pronunciations: apiInfo.pronunciations,
    audioUrls: apiInfo.audioUrls,
    imageUrl: imageInfo?.imageUrl || "",
    difficulty: difficulty || "easy",
  });
  // create first meaning
  await WordMeaning.create({
    wordId: newWord._id,
    meaning,
    partOfSpeech,
    isPrimary: true,
  });
  //Return
  return await Word.findById(newWord._id).populate("meanings");
};
//Hàm update thông tin từ
export const update = async (wordIdOrSlug, data) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  const isObjectId = objectIdRegex.test(wordIdOrSlug);
  const currentWord = isObjectId
    ? await Word.findById(wordIdOrSlug)
    : await Word.findOne({ slug: wordIdOrSlug });
  if (!currentWord) {
    throw new AppError("Không tìm thấy từ vựng", 404);
  }
  const wordId = currentWord._id;
  const { word, difficulty } = data;
  const updatedData = {};
  if (word !== undefined) {
    const duplicate = await Word.findOne({ word, _id: { $ne: wordId } });
    if (duplicate) {
      throw new AppError("Từ vựng đã tồn tại", 400);
    }
    const slug = slugify(word, { lower: true, strict: true, locale: "vi" });
    const duplicateSlug = await Word.findOne({ slug, _id: { $ne: wordId } });
    if (duplicateSlug) {
      throw new AppError("Slug đã tồn tại", 400);
    }
    const [apiInfo, imageInfo] = await Promise.all([
      getWordInfo(word),
      getImageByWord(word),
    ]);
    updatedData.word = word;
    updatedData.slug = slug;
    updatedData.pronunciations = apiInfo.pronunciations;
    updatedData.audioUrls = apiInfo.audioUrls;
    updatedData.imageUrl = imageInfo?.imageUrl || "";
  }
  if (difficulty !== undefined) {
    updatedData.difficulty = difficulty;
  }
  if (Object.keys(updatedData).length === 0) {
    throw new AppError("Vui lòng gửi ít nhất một trường để cập nhật", 400);
  }
  await Word.findByIdAndUpdate(wordId, updatedData, {
    new: true,
    runValidators: true,
  });
  return await Word.findById(wordId).populate("meanings");
};
// Hàm xóa từ
export const deleted = async (wordIdOrSlug) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    const isObjectId = objectIdRegex.test(wordIdOrSlug);
    const word = isObjectId
      ? await Word.findById(wordIdOrSlug).session(session)
      : await Word.findOne({ slug: wordIdOrSlug }).session(session);
    if (!word) {
      throw new AppError("Không tìm thấy từ vựng", 404);
    }
    const wordId = word._id;
    //Lấy tất cả lesson-word relation đang dùng từ này
    const lessonWords = await VocabularyLessonWord.find({ wordId })
      .select("lessonId")
      .session(session)
      .lean();
    if (lessonWords.length > 0) {
      const lessonIds = [
        ...new Set(lessonWords.map((item) => String(item.lessonId))),
      ];
      const lessons = await VocabularyLesson.find({
        _id: { $in: lessonIds },
      })
        .select("_id topicId")
        .session(session)
        .lean();
      if (lessons.length !== lessonIds.length) {
        throw new AppError("Dữ liệu bài học không hợp lệ", 500);
      }
      const lessonTopicMap = new Map();
      for (const lesson of lessons) {
        lessonTopicMap.set(String(lesson._id), String(lesson.topicId));
      }
      const topicCountMap = new Map();
      for (const relation of lessonWords) {
        const lessonIdStr = String(relation.lessonId);
        const topicId = lessonTopicMap.get(lessonIdStr);
        if (!topicId) {
          throw new AppError("Dữ liệu bài học không hợp lệ", 500);
        }
        await VocabularyLesson.findByIdAndUpdate(
          relation.lessonId,
          { $inc: { wordCount: -1 } },
          { session },
        );
        topicCountMap.set(topicId, (topicCountMap.get(topicId) || 0) + 1);
      }
      for (const [topicId, count] of topicCountMap.entries()) {
        await VocabularyTopic.findByIdAndUpdate(
          topicId,
          { $inc: { wordCount: -count } },
          { session },
        );
      }
    }
    // Xóa các relation và meaning trước khi xóa word
    await VocabularyLessonWord.deleteMany({ wordId }, { session });
    await WordMeaning.deleteMany({ wordId }, { session });
    const deleteWord = await Word.findByIdAndDelete(wordId, { session });
    await session.commitTransaction();
    return deleteWord;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
//Hàm lấy thông tin từ theo Id
export const getById = async (wordId) => {
  //lấy word và meaning word
  const word = await Word.findById(wordId).populate({
    path: "meanings",
    options: {
      sort: { isPrimary: -1, order: 1 },
    },
  });
  if (!word) {
    throw new AppError("Không tìm thấy từ vựng", 404);
  }
  return word;
};
//Hàm lấy thông tin từ theo slug
export const getBySlug = async (slug) => {
  const word = await Word.findOne({ slug }).populate({
    path: "meanings",
    options: {
      sort: { isPrimary: -1, order: 1 },
    },
  });
  if (!word) {
    throw new AppError("Không tìm thấy từ vựng", 404);
  }
  return word;
};
//Hàm lấy chi tiết thông tin của từ
export const getDetail = async (wordId) => {
  //Lấy thông tin cơ bản của word
  const word = await Word.findById(wordId).lean();
  //kiểm tra tồn tại
  if (!word) {
    throw new AppError("Không tìm thấy từ vựng", 404);
  }
  // Lấy danh sách nghĩa của từ
  const meanings = await WordMeaning.find({ wordId, isActive: true })
    .sort({
      isPrimary: -1,
      order: 1,
    })
    .lean();
  // Lấy tất cả các lesson đang sử dụng word này
  const lessonWords = await VocabularyLessonWord.find({ wordId })
    .populate([
      {
        path: "lessonId",
        select: "_id title topicId order isActive",
        populate: {
          path: "topicId",
          select: "_id name",
        },
      },
      {
        path: "wordMeaningId",
        select: "_id meaning partOfSpeech isPrimary order isActive",
      },
    ])
    .lean();
  return {
    ...word,
    meanings,
    lessonUsage: lessonWords.map((item) => ({
      lessonId: item.lessonId?._id,
      lessonTitle: item.lessonId?.title,
      topicId: item.lessonId?.topicId?._id,
      topicName: item.lessonId?.topicId?.name,
      wordMeaningId: item.wordMeaningId?._id,
      meaning: item.wordMeaningId?.meaning,
      partOfSpeech: item.wordMeaningId?.partOfSpeech,
      isPrimary: item.wordMeaningId?.isPrimary,
    })),
    lessonCount: lessonWords.length,
  };
};
//Hàm lấy chi tiết thông tin của từ theo slug
export const getDetailBySlug = async (slug) => {
  const word = await Word.findOne({ slug }).lean();
  if (!word) {
    throw new AppError("Không tìm thấy từ vựng", 404);
  }
  const wordId = word._id;
  const meanings = await WordMeaning.find({ wordId, isActive: true })
    .sort({
      isPrimary: -1,
      order: 1,
    })
    .lean();
  const lessonWords = await VocabularyLessonWord.find({ wordId })
    .populate([
      {
        path: "lessonId",
        select: "_id title topicId order isActive",
        populate: {
          path: "topicId",
          select: "_id name",
        },
      },
      {
        path: "wordMeaningId",
        select: "_id meaning partOfSpeech isPrimary order isActive",
      },
    ])
    .lean();
  return {
    ...word,
    meanings,
    lessonUsage: lessonWords.map((item) => ({
      lessonId: item.lessonId?._id,
      lessonTitle: item.lessonId?.title,
      topicId: item.lessonId?.topicId?._id,
      topicName: item.lessonId?.topicId?.name,
      wordMeaningId: item.wordMeaningId?._id,
      meaning: item.wordMeaningId?.meaning,
      partOfSpeech: item.wordMeaningId?.partOfSpeech,
      isPrimary: item.wordMeaningId?.isPrimary,
    })),
    lessonCount: lessonWords.length,
  };
};
//Hàm lấy danh sách tất cả từ
export const getAll = async (page = 1, limit = 10) => {
  //Chuẩn hóa tham số phân trang
  const currentPage = Number(page) || 1;
  const currentLimit = Number(limit) || 10;
  const skip = (currentPage - 1) * currentLimit;
  //Lấy danh sách word đang active va dem so luong
  const [words, total] = await Promise.all([
    Word.find({ isActive: true })
      .sort({ word: 1 })
      .skip(skip)
      .limit(currentLimit)
      .select("slug word pronunciations audioUrls imageUrl difficulty isActive")

      .populate({
        path: "meanings",
        match: { isActive: true },
        options: {
          sort: { isPrimary: -1, order: 1 },
        },
        select: "meaning partOfSpeech isPrimary order isActive",
      })
      .lean(),
    Word.countDocuments({ isActive: true }),
  ]);
  // Map fields to ensure slug is included
  const mappedWords = words.map((word) => ({
    _id: word._id,
    word: word.word,
    slug: word.slug,
    pronunciations: word.pronunciations,
    audioUrls: word.audioUrls,
    imageUrl: word.imageUrl,
    difficulty: word.difficulty,
    isActive: word.isActive,
    meanings: word.meanings,
  }));
  // return
  return {
    words: mappedWords,
    pagination: {
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    },
  };
};
//Hàm tìm kiếm từ
export const search = async (keyword) => {
  if (!keyword) {
    throw new AppError("Vui lòng nhập từ khóa tìm kiếm", 400);
  }
  //Tìm các wordId có meaning khớp với keyword
  const meaningWordIds = await WordMeaning.distinct("wordId", {
    isActive: true,
    meaning: { $regex: keyword, $options: "i" },
  });
  // Tìm word khớp theo tên từ hoặc theo meaning
  const words = await Word.find({
    isActive: true,
    $or: [
      { word: { $regex: keyword, $options: "i" } },
      { _id: { $in: meaningWordIds } },
    ],
  })
    .select(
      "slug word pronunciations audioUrls imageUrl difficulty isActive createdAt updatedAt",
    )
    .sort({ word: 1 })
    .populate({
      path: "meanings",
      match: { isActive: true },
      select: "meaning partOfSpeech isPrimary order isActive",
      options: {
        sort: { isPrimary: -1, order: 1 },
      },
    })
    .lean();
  // Trả về danh sách
  return words;
};
//Hàm thay đổi trạng thái hoạt động của từ
export const changeStatus = async (wordId, isActive) => {
  //Tìm word
  const word = await Word.findById(wordId);
  if (!word) {
    throw new AppError("Không tìm thấy từ vựng", 404);
  }
  //Đảo trạng thái theo giá trị hiện tại client gửi lên
  const newStatus = !isActive;
  //update trạng thái
  const updatedWord = await Word.findByIdAndUpdate(
    wordId,
    { isActive: newStatus },
    { new: true, runValidators: true },
  ).populate("meanings");
  // return
  return updatedWord;
};
