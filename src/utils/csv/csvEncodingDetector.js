import chardet from "chardet";

/**
 * Kiêm tra & phát hiện encoding của CSV Buffer.
 * Thứ tự ưu tiên:
 *  1. UTF-8 BOM (0xEF 0xBB 0xBF)
 *  2. UTF-16 LE BOM (0xFF 0xFE)
 *  3. UTF-16 BE BOM (0xFE 0xFF)
 *  4. UTF-8 Strict (fatal: true)
 *  5. Detect Windows-1258 / Windows-1252 qua chardet hoặc byte heuristics
 */
export const detectCsvEncoding = (buffer) => {
  if (!buffer || buffer.length === 0) {
    return { encoding: "utf-8", hasBom: false, bomLength: 0 };
  }

  // 1. UTF-8 BOM
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    return { encoding: "utf-8", hasBom: true, bomLength: 3 };
  }

  // 2. UTF-16 LE BOM
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return { encoding: "utf-16le", hasBom: true, bomLength: 2 };
  }

  // 3. UTF-16 BE BOM
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return { encoding: "utf-16be", hasBom: true, bomLength: 2 };
  }

  // 4. Strict UTF-8 Validation
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return { encoding: "utf-8", hasBom: false, bomLength: 0 };
  } catch {
    // Không phải UTF-8 thuần -> chuyển sang chardet & Vietnamese Heuristics
  }

  // 5. Chardet detection & Vietnamese byte heuristics
  const detected = chardet.detect(buffer);
  const normalizedDetected = (detected || "").toLowerCase();

  // Kiểm tra sự xuất hiện của các byte tiếng Việt đặc thù trong Windows-1258 (0xD0 cho Đ, các byte combining accent)
  let hasVietnameseByteSignature = false;
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    // 0xD0 (Đ trong Win-1258), 0xD2 (dấu sắc), 0xD5 (dấu ngã), 0xE0, 0xE1, 0xEC, 0xEE, 0xF2
    if (
      byte === 0xd0 ||
      byte === 0xd2 ||
      byte === 0xd5 ||
      byte === 0xe0 ||
      byte === 0xec ||
      byte === 0xee ||
      byte === 0xf2
    ) {
      hasVietnameseByteSignature = true;
      break;
    }
  }

  if (
    hasVietnameseByteSignature ||
    normalizedDetected.includes("1258") ||
    normalizedDetected.includes("vietnamese")
  ) {
    return { encoding: "win1258", hasBom: false, bomLength: 0 };
  }

  if (normalizedDetected.includes("1252") || normalizedDetected.includes("ascii")) {
    return { encoding: "win1252", hasBom: false, bomLength: 0 };
  }

  // Mặc định cho file từ Excel Windows VN nếu không match
  return {
    encoding: normalizedDetected || "win1258",
    hasBom: false,
    bomLength: 0,
  };
};
