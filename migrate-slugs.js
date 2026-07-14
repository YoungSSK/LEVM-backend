import mongoose from "mongoose";
import dotenv from "dotenv";
import slugify from "slugify";
import Word from "./src/models/Word.js";

dotenv.config();

const MONGODB_CONNECTIONSTRING = process.env.MONGODB_CONNECTIONSTRING;

async function migrateSlugs() {
  try {
    console.log("Đang kết nối tới database...");
    await mongoose.connect(MONGODB_CONNECTIONSTRING);
    console.log("Kết nối thành công!");

    // Tìm tất cả các từ vựng chưa có slug
    const wordsWithoutSlug = await Word.find({ slug: { $exists: false } });
    console.log(`Tìm thấy ${wordsWithoutSlug.length} từ vựng chưa có slug.`);

    let updatedCount = 0;
    for (const wordDoc of wordsWithoutSlug) {
      let newSlug = slugify(wordDoc.word, { lower: true, strict: true, locale: "vi" });
      
      // Xử lý trường hợp bị trùng slug
      let slugExists = await Word.exists({ slug: newSlug, _id: { $ne: wordDoc._id } });
      let counter = 1;
      let originalSlug = newSlug;
      while (slugExists) {
        newSlug = `${originalSlug}-${counter}`;
        slugExists = await Word.exists({ slug: newSlug, _id: { $ne: wordDoc._id } });
        counter++;
      }

      wordDoc.slug = newSlug;
      await wordDoc.save();
      updatedCount++;
      console.log(`Đã cập nhật slug cho từ "${wordDoc.word}": ${newSlug}`);
    }

    console.log(`\nCập nhật hoàn tất! Đã cập nhật thành công ${updatedCount} từ vựng.`);
  } catch (error) {
    console.error("Lỗi trong quá trình migrate:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Đã ngắt kết nối database.");
  }
}

migrateSlugs();
