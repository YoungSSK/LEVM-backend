import mongoose from "mongoose";
import VocabularyLesson from "../models/VocabularyLesson.js";
import VocabularyLessonWord from "../models/VocabularyLessonWord.js";
import VocabularyTopic from "../models/VocabularyTopic.js";
import Word from "../models/Word.js";
import WordMeaning from "../models/WordMeaning.js";
import AppError from "../utils/AppError.js";
//Hàm tạo bài học mới
export const createLesson = async (data) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { topicId, title, description, thumbnail, estimatedTime } = data;
    const topicExist = await VocabularyTopic.findById(topicId).session(session);
    if (!topicExist) {
      throw new AppError("Topic không tồn tại", 404);
    }
    const duplicateTitle = await VocabularyLesson.findOne({
      topicId,
      title,
    }).session(session);
    if (duplicateTitle) {
      throw new AppError("Tên bài học đã tồn tại trong chủ đề", 400);
    }

    const lastLesson = await VocabularyLesson.findOne({
      topicId,
    })
      .sort({ order: -1 })
      .session(session);

    const order = lastLesson ? lastLesson.order + 1 : 1;

    const [lesson] = await VocabularyLesson.create(
      [
        {
          topicId,
          title,
          description,
          thumbnail,
          estimatedTime,
          isActive: true,
          order,
          wordCount: 0,
        },
      ],
      { session },
    );

    await VocabularyTopic.findByIdAndUpdate(
      topicId,
      {
        $inc: {
          lessonCount: 1,
        },
      },
      {
        session,
      },
    );

    await session.commitTransaction();
    return lesson;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

//Hàm cập nhật bài học
export const updateLesson = async (lessonId, data) => {
  const lessonExist = await VocabularyLesson.findById(lessonId);
  if (!lessonExist) {
    throw new AppError("Lesson không tồn tại", 404);
  }
  const { title, description, thumbnail, estimatedTime } = data;
  if (title !== undefined) {
    const duplicateTitle = await VocabularyLesson.findOne({
      topicId: lessonExist.topicId,
      title,
      _id: { $ne: lessonId },
    });
    if (duplicateTitle) {
      throw new AppError("Tên bài học đã tồn tại", 400);
    }
  }
  const updatedData = {};
  if (title !== undefined) {
    updatedData.title = title;
  }
  if (description !== undefined) {
    updatedData.description = description;
  }
  if (thumbnail !== undefined) {
    updatedData.thumbnail = thumbnail;
  }
  if (estimatedTime !== undefined) {
    updatedData.estimatedTime = estimatedTime;
  }
  //Update data
  const updatedLesson = await VocabularyLesson.findByIdAndUpdate(
    lessonId,
    updatedData,
    { new: true },
  );
  return updatedLesson;
};

//Hàm xóa bài bài học
export const deleteLesson = async (lessonId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const lessonExist =
      await VocabularyLesson.findById(lessonId).session(session);

    if (!lessonExist) {
      throw new AppError("Lesson không tồn tại", 404);
    }

    await VocabularyLessonWord.deleteMany({ lessonId }, { session });

    await VocabularyTopic.findByIdAndUpdate(
      lessonExist.topicId,
      {
        $inc: {
          lessonCount: -1,
          wordCount: -lessonExist.wordCount,
        },
      },
      {
        session,
      },
    );

    await VocabularyLesson.findByIdAndDelete(lessonId, {
      session,
    });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

//Hàm lấy bài học theo ID
export const getById = async (lessonId) => {
  const lesson = await VocabularyLesson.findById(lessonId).lean();
  if (!lesson) {
    throw new AppError("Lesson không tồn tại", 404);
  }
  return lesson;
};

//Hàm lấy danh sách bài học theo chủ đề
export const getByTopic = async (topicId) => {
  const topicExist = await VocabularyTopic.findById(topicId);
  if (!topicExist) {
    throw new AppError("Topic không tồn tại", 404);
  }
  const lessons = await VocabularyLesson.find({ topicId })
    .sort({ order: 1 })
    .lean();
  return lessons;
};

//Hàm thêm từ vào bài học cùng nghĩa được chọn
export const addWord = async (lessonId, wordId, wordMeaningId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const lessonExist =
      await VocabularyLesson.findById(lessonId).session(session);

    if (!lessonExist) {
      throw new AppError("Lesson không tồn tại", 404);
    }

    const wordExist = await Word.findById(wordId).session(session);

    if (!wordExist) {
      throw new AppError("Từ vựng không tồn tại", 404);
    }

    const wordMeaningExist =
      await WordMeaning.findById(wordMeaningId).session(session);

    if (!wordMeaningExist) {
      throw new AppError("Nghĩa của từ không tồn tại", 404);
    }

    if (String(wordMeaningExist.wordId) !== String(wordId)) {
      throw new AppError("Nghĩa không thuộc từ đã chọn", 400);
    }

    const duplicate = await VocabularyLessonWord.findOne({
      lessonId,
      wordId,
    }).session(session);

    if (duplicate) {
      throw new AppError("Từ đã tồn tại trong bài học", 400);
    }

    await VocabularyLessonWord.create([{ lessonId, wordId, wordMeaningId }], {
      session,
    });

    await VocabularyLesson.findByIdAndUpdate(
      lessonId,
      { $inc: { wordCount: 1 } },
      { session },
    );

    await VocabularyTopic.findByIdAndUpdate(
      lessonExist.topicId,
      {
        $inc: {
          wordCount: 1,
        },
      },
      {
        session,
      },
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

//Hàm xóa từ khỏi danh sách bài học
export const removeWord = async (lessonId, wordId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const lesson = await VocabularyLesson.findById(lessonId).session(session);

    if (!lesson) {
      throw new AppError("Lesson không tồn tại", 404);
    }

    const relation = await VocabularyLessonWord.findOne({
      lessonId,
      wordId,
    }).session(session);

    if (!relation) {
      throw new AppError("Từ không tồn tại trong bài học", 404);
    }

    await VocabularyLessonWord.deleteOne({ lessonId, wordId }, { session });

    await VocabularyLesson.findByIdAndUpdate(
      lessonId,
      {
        $inc: {
          wordCount: -1,
        },
      },
      {
        session,
      },
    );

    await VocabularyTopic.findByIdAndUpdate(
      lesson.topicId,
      {
        $inc: {
          wordCount: -1,
        },
      },
      {
        session,
      },
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

//Hàm lấy danh sách từ trong bài lesson
export const getWord = async (lessonId) => {
  // kiểm tra tồn tại của lesson
  const lessonExist = await VocabularyLesson.findById(lessonId);
  if (!lessonExist) {
    throw new AppError("Lesson không tồn tại", 404);
  }
  //Lấy word
  const words = await VocabularyLessonWord.find({ lessonId })
    .populate([
      {
        path: "wordId",
      },
      {
        path: "wordMeaningId",
      },
    ])
    .lean();
  return words;
};

//Hàm lấy thay đổi thư tự các lesson trong Topic
export const changeOrder = async (topicId, orders) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const topicExist = await VocabularyTopic.findById(topicId).session(session);

    if (!topicExist) {
      throw new AppError("Topic không tồn tại", 404);
    }

    if (!orders?.length) {
      throw new AppError("Danh sách rỗng", 400);
    }

    // Kiểm tra order hợp lệ
    const invalidOrder = orders.some(
      (item) => !Number.isInteger(item.order) || item.order < 1,
    );

    if (invalidOrder) {
      throw new AppError("Order không hợp lệ", 400);
    }

    // Kiểm tra trùng order
    const orderSet = new Set(orders.map((item) => item.order));

    if (orderSet.size !== orders.length) {
      throw new AppError("Thứ tự bị trùng", 400);
    }

    // Kiểm tra trùng lesson
    const lessonIds = orders.map((item) => item.lessonId);

    const lessonSet = new Set(lessonIds);

    if (lessonSet.size !== orders.length) {
      throw new AppError("Lesson bị trùng", 400);
    }

    // Kiểm tra tất cả lesson có thuộc topic không
    const totalLesson = await VocabularyLesson.countDocuments({
      _id: { $in: lessonIds },
      topicId,
    }).session(session);

    if (totalLesson !== orders.length) {
      throw new AppError("Có lesson không hợp lệ", 404);
    }

    // Cập nhật hàng loạt
    await VocabularyLesson.bulkWrite(
      orders.map((item) => ({
        updateOne: {
          filter: {
            _id: item.lessonId,
            topicId,
          },
          update: {
            order: item.order,
          },
        },
      })),
      { session },
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
export const changeStatus = async (lessonId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const lesson = await VocabularyLesson.findById(lessonId).session(session);
    if (!lesson) {
      throw new AppError("Lesson không tồn tại", 404);
    }
    const newStatus = !lesson.isActive;
    //Cập nhật status lại
    await VocabularyLesson.findByIdAndUpdate(
      lessonId,
      { isActive: newStatus },
      { session },
    );
    //Active --> Inactive
    if (!newStatus) {
      await VocabularyTopic.findByIdAndUpdate(
        lesson.topicId,
        {
          $inc: { lessonCount: -1, wordCount: -lesson.wordCount },
        },
        { session },
      );
    }
    //Inactive --> Active
    else {
      await VocabularyTopic.findByIdAndUpdate(
        lesson.topicId,
        {
          $inc: {
            lessonCount: 1,
            wordCount: lesson.wordCount,
          },
        },
        { session },
      );
    }
    await session.commitTransaction();
    return { lessonId, isActive: newStatus };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
//Hàm lấy từ trong lesson để học
export const getWordsForStudy = async (lessonId) => {
  //Kiểm tra lesson có tồn tại không
  const lesson = await VocabularyLesson.findById(lessonId)
    .populate({
      path: "topicId",
      select: "_id name",
    })
    .lean();
  if (!lesson) {
    throw new AppError("Lesson không tồn tại", 404);
  }
  // Lấy word-meaning của từ
  const lessonWords = await VocabularyLessonWord.find({ lessonId })
    .populate([
      {
        path: "wordId",
        select: "word pronunciations audioUrls imageUrl difficulty isActive",
      },
      {
        path: "wordMeaningId",
        select:
          "meaning partOfSpeech exampleSentence exampleMeaning isPrimary order isActive",
      },
    ])
    .sort({ createdAt: 1 })
    .lean();
  // Lọc record hợp lệ format phục vụ study
  const words = lessonWords
    .filter((item) => item.wordId && item.wordMeaningId)
    .map((item) => ({
      lessonWordId: item._id,
      wordId: item.wordId._id,
      word: item.wordId.word,
      pronunciations: item.wordId.pronunciations,
      audioUrls: item.wordId.audioUrls,
      imageUrl: item.wordId.imageUrl,
      difficulty: item.wordId.difficulty,
      meaningId: item.wordMeaningId._id,
      meaning: item.wordMeaningId.meaning,
      partOfSpeech: item.wordMeaningId.partOfSpeech,
      exampleSentence: item.wordMeaningId.exampleSentence,
      exampleMeaning: item.wordMeaningId.exampleMeaning,
      isPrimary: item.wordMeaningId.isPrimary,
      order: item.wordMeaningId.order,
    }));
  // return
  return {
    lesson: {
      _id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      estimatedTime: lesson.estimatedTime,
      topicId: lesson.topicId?._id,
      topicName: lesson.topicId?.name,
    },
    totalWords: words.length,
    words,
  };
};
