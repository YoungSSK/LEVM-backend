import { parse } from "csv-parse/sync";

/**
 * Clean BOM rác hoặc khoảng trắng ẩn khỏi header string.
 */
const cleanHeaderString = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/^\uFEFF/, "").trim();
};

/**
 * Parse chuỗi CSV đã decode thành mảng JS Objects an toàn.
 * Không dùng split(",") thủ công. Tách Header tự động và loại bỏ rác BOM.
 */
export const parseCsvString = (rawText, options = {}) => {
  if (!rawText || !rawText.trim()) {
    return { records: [], rawHeader: [] };
  }

  // 1. Trích xuất Raw Header bằng parser chuẩn trên dòng đầu tiên
  let rawHeader = [];
  try {
    const headerParsed = parse(rawText, {
      to_line: 1,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true,
    });

    if (headerParsed && headerParsed.length > 0) {
      rawHeader = headerParsed[0].map(cleanHeaderString);
    }
  } catch {
    // Nếu dòng đầu vỡ, fallback để parser xử lý tiếp
  }

  // 2. Parse toàn bộ dữ liệu CSV với cấu hình an toàn
  const records = parse(rawText, {
    columns: (headers) => headers.map(cleanHeaderString),
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
    escape: '"',
    quote: '"',
    ...options,
  });

  return { records, rawHeader };
};
