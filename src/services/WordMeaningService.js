import mongoose from "mongoose";
import Word from "../models/Word.js";
import WordMeaning from "../models/WordMeaning.js";
import VocabularyLessonWord from "../models/VocabularyLessonWord.js";
import AppError from "../utils/AppError.js";

//Hàm tạo mới Meaning
export const createMeaning = async (data) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const {
      wordId,
      partOfSpeech,
      meaning,
      exampleSentence = "",
      exampleMeaning = "",
      isPrimary = false,
      order,
    } = data;
    // Kiểm tra từ vựng tồn tại
    const word = await Word.findById(wordId).session(session);
    if (!word) {
      throw new AppError("Không tìm thấy từ vựng", 404);
    }
    // Kiểm tra nghĩa trùng lặp
    const duplicate = await WordMeaning.findOne({
      wordId,
      partOfSpeech,
      meaning,
    }).session(session);
    if (duplicate) {
      throw new AppError("Nghĩa này đã tồn tại", 409);
    }
    // Xác định thứ tự hiển thị và nghĩa chính
    const lastMeaning = await WordMeaning.findOne({ wordId })
      .sort({
        order: -1,
      })
      .session(session);
    // Cập nhật lại nghĩa chính nếu cần
    const shouldBePrimary = isPrimary || !lastMeaning;
    if (shouldBePrimary) {
      await WordMeaning.updateMany(
        { wordId },
        { isPrimary: false },
        { session },
      );
    }
    // Tạo nghĩa mới
    const [newMeaning] = await WordMeaning.create(
      [
        {
          wordId,
          partOfSpeech,
          meaning,
          exampleSentence,
          exampleMeaning,
          isPrimary: shouldBePrimary,
          order: order ?? (lastMeaning ? lastMeaning.order + 1 : 1),
        },
      ],
      { session },
    );
    // Lấy dữ liệu đầy đủ sau khi tạo
    const createdMeaning = await WordMeaning.findById(newMeaning._id)
      .populate({
        path: "wordId",
        select: "word pronunciations audioUrls imageUrl difficulty isActive",
      })
      .session(session);
    // Xác nhận và trả về kết quả
    await session.commitTransaction();
    return createdMeaning;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
//Hàm cập nhật nghĩa của từ
export const updateMeaning = async (meaningId, data) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // Kiểm tra nghĩa tồn tại
    const currentMeaning =
      await WordMeaning.findById(meaningId).session(session);
    if (!currentMeaning) {
      throw new AppError("Không tìm thấy nghĩa", 404);
    }
    // Kiểm tra trùng lặp khi thay đổi loại từ hoặc nội dung nghĩa
    if (data.meaning !== undefined || data.partOfSpeech !== undefined) {
      const duplicate = await WordMeaning.findOne({
        wordId: currentMeaning.wordId,
        partOfSpeech: data.partOfSpeech ?? currentMeaning.partOfSpeech,
        meaning: data.meaning ?? currentMeaning.meaning,
        _id: { $ne: meaningId },
      }).session(session);
      if (duplicate) {
        throw new AppError("Nghĩa đã tồn tại trong từ này", 409);
      }
    }
    // Chuẩn bị dữ liệu cập nhật
    const updateData = {};
    if (data.partOfSpeech !== undefined)
      updateData.partOfSpeech = data.partOfSpeech;
    if (data.meaning !== undefined) updateData.meaning = data.meaning;
    if (data.exampleSentence !== undefined)
      updateData.exampleSentence = data.exampleSentence;
    if (data.exampleMeaning !== undefined)
      updateData.exampleMeaning = data.exampleMeaning;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isPrimary !== undefined) updateData.isPrimary = data.isPrimary;
    // Cập nhật lại nghĩa chính nếu được chọn làm Primary
    if (data.isPrimary === true) {
      await WordMeaning.updateMany(
        {
          wordId: currentMeaning.wordId,
          _id: { $ne: meaningId },
        },
        { isPrimary: false },
        { session },
      );
    }
    // Xử lý khi vô hiệu hóa nghĩa chính hiện tại
    if (data.isActive === false && currentMeaning.isPrimary) {
      const nextPrimary = await WordMeaning.findOne({
        wordId: currentMeaning.wordId,
        _id: { $ne: meaningId },
        isActive: true,
      })
        .sort({ order: 1, createdAt: 1 })
        .session(session);
      if (nextPrimary) {
        await WordMeaning.updateMany(
          { wordId: currentMeaning.wordId },
          { isPrimary: false },
          { session },
        );
        await WordMeaning.findByIdAndUpdate(
          nextPrimary._id,
          { isPrimary: true },
          { session },
        );
      }
      updateData.isPrimary = false;
    }
    // Cập nhật nghĩa và lấy dữ liệu đầy đủ
    const updatedMeaning = await WordMeaning.findByIdAndUpdate(
      meaningId,
      updateData,
      { new: true, session },
    ).populate({
      path: "wordId",
      select: "word pronunciations audioUrls imageUrl difficulty isActive",
    });
    // Xác nhận và trả về kết quả
    await session.commitTransaction();
    return updatedMeaning;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
//Hàm xóa nghĩa của từ
export const deleteMeaning = async (meaningId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // Kiểm tra nghĩa tồn tại
    const meaning = await WordMeaning.findById(meaningId).session(session);
    if (!meaning) {
      throw new AppError("Không tìm thấy nghĩa", 404);
    }
    // Kiểm tra nghĩa có đang được sử dụng trong bài học hay không
    const isUsed = await VocabularyLessonWord.exists({
      wordMeaningId: meaningId,
    }).session(session);
    if (isUsed) {
      throw new AppError("Nghĩa đang được sử dụng trong bài học", 409);
    }
    const wasPrimary = meaning.isPrimary;
    const wordId = meaning.wordId;
    // Xóa nghĩa khỏi hệ thống
    await WordMeaning.findByIdAndDelete(meaningId, { session });
    // Cập nhật lại nghĩa chính nếu nghĩa bị xóa là Primary
    if (wasPrimary) {
      const nextPrimary = await WordMeaning.findOne({
        wordId,
        isActive: true,
        _id: { $ne: meaningId },
      })
        .sort({ order: 1, createdAt: 1 })
        .session(session);
      if (nextPrimary) {
        await WordMeaning.updateMany(
          { wordId },
          { isPrimary: false },
          { session },
        );
        await WordMeaning.findByIdAndUpdate(
          nextPrimary._id,
          { isPrimary: true },
          { session },
        );
      }
    }
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
//Hàm lấy meaning theo Id
export const getMeaningById = async (meaningId) => {
  const meaning = await WordMeaning.findById(meaningId).populate({
    path: "wordId",
    select: "word pronunciations audioUrls imageUrl difficulty isActive",
  });

  if (!meaning) {
    throw new AppError("Không tìm thấy nghĩa của từ", 404);
  }

  return meaning;
};
//Hàm lấy meaning theo word (hỗ trợ id hoặc slug)
export const getMeaningByWord = async (wordId) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  const isObjectId = objectIdRegex.test(wordId);
  const word = isObjectId
    ? await Word.findById(wordId)
    : await Word.findOne({ slug: wordId });
  if (!word) {
    throw new AppError("Không tìm thấy từ", 404);
  }

  const meanings = await WordMeaning.find({ wordId: word._id })
    .sort({ isPrimary: -1, order: 1, createdAt: 1 })
    .lean();

  return meanings;
};
//Hàm set làm nghĩa mặc định
export const setPrimary = async (wordId, meaningId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const word = await Word.findById(wordId).session(session);
    if (!word) {
      throw new AppError("Không tìm thấy từ vựng", 404);
    }
    const meaning = await WordMeaning.findById(meaningId).session(session);
    if (!meaning) {
      throw new AppError("không tìm thấy nghĩa", 404);
    }
    if (String(meaning.wordId) !== String(wordId)) {
      throw new AppError("Nghĩa không thuộc từ đã chọn", 400);
    }
    if (!meaning.isActive) {
      throw new AppError(
        "Không thể đặt nghĩa không hoạt động làm nghĩa chính",
        400,
      );
    }
    await WordMeaning.updateMany({ wordId }, { isPrimary: false }, { session });
    await WordMeaning.findByIdAndUpdate(
      meaningId,
      { isPrimary: true },
      { session },
    );
    const updatedMeaning = await WordMeaning.findById(meaningId)
      .populate({
        path: "wordId",
        select: "word pronunciations audioUrls imageUrl difficulty isActive",
      })
      .session(session);
    await session.commitTransaction();
    return updatedMeaning;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
//Hàm thay đổi trạng thái của Meaning
export const changeMeaningStatus = async (meaningId, isActive) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const meaning = await WordMeaning.findById(meaningId).session(session);
    if (!meaning) {
      throw new AppError("Không tìm thấy nghĩa", 404);
    }
    //Đảo trạng thái theo giá trị nhận được
    const newStatus = !isActive;
    const updateData = { isActive: newStatus };
    //Nếu tắt active thì không cho làm nghĩa chính
    if (!newStatus) {
      updateData.isPrimary = false;
      //Nếu nghĩa đang là nghĩa chính thì chuyển nghĩa của từ sang nghĩa active khác
      if (meaning.isPrimary) {
        const nextPrimary = await WordMeaning.findOne({
          wordId: meaning.wordId,
          _id: { $ne: meaningId },
          isActive: true,
        })
          .sort({ order: 1, createdAt: 1 })
          .session(session);
        await WordMeaning.updateMany(
          { wordId: meaning.wordId },
          { isPrimary: false },
          { session },
        );
        if (nextPrimary) {
          await WordMeaning.findByIdAndUpdate(
            nextPrimary._id,
            { isPrimary: true },
            { session },
          );
        }
      }
    } else {
      //Nếu bật active và chưa có nghĩa chính, cho nó nghĩa chính luôn
      const hasPrimary = await WordMeaning.exists({
        wordId: meaning.wordId,
        isPrimary: true,
        _id: { $ne: meaningId },
      }).session(session);

      if (!hasPrimary) {
        updateData.isPrimary = true;
      }
    }
    const updatedMeaning = await WordMeaning.findByIdAndUpdate(
      meaningId,
      updateData,
      { new: true, session },
    ).populate({
      path: "wordId",
      select: "word pronunciations audioUrls imageUrl difficulty isActive",
    });
    await session.commitTransaction();
    return updatedMeaning;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
