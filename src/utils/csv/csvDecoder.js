import iconv from "iconv-lite";

/**
 * Giải mã Buffer thành UTF-8 Clean String dựa trên thông tin encoding đã detect.
 * Sử dụng iconv-lite cho Windows-1258/1252 và TextDecoder cho UTF-8/UTF-16.
 */
export const decodeCsvBuffer = (buffer, detectionResult) => {
  if (!buffer || buffer.length === 0) return "";

  const { encoding, hasBom, bomLength } = detectionResult;
  const rawBuffer = hasBom ? buffer.subarray(bomLength) : buffer;

  let result = "";
  try {
    switch (encoding.toLowerCase()) {
      case "utf-8":
      case "utf8":
      case "utf-8-bom":
        result = new TextDecoder("utf-8").decode(rawBuffer);
        break;

      case "utf-16le":
      case "utf-16le-bom":
        result = new TextDecoder("utf-16le").decode(rawBuffer);
        break;

      case "utf-16be":
      case "utf-16be-bom":
        result = new TextDecoder("utf-16be").decode(rawBuffer);
        break;

      case "win1258":
      case "windows-1258":
      case "cp1258":
        result = iconv.decode(rawBuffer, "win1258");
        break;

      case "win1252":
      case "windows-1252":
      case "cp1252":
      case "ansi":
        result = iconv.decode(rawBuffer, "win1252");
        break;

      default:
        // Cố gắng dùng iconv-lite decode theo tên encoding nếu hỗ trợ
        if (iconv.encodingExists(encoding)) {
          result = iconv.decode(rawBuffer, encoding);
        } else {
          result = new TextDecoder("utf-8").decode(rawBuffer);
        }
        break;
    }
    return result.normalize("NFC");
  } catch (error) {
    // Nếu có lỗi bất ngờ, thử fallback iconv win1258 trước khi throw
    try {
      return iconv.decode(rawBuffer, "win1258").normalize("NFC");
    } catch {
      throw new Error(`Lỗi giải mã CSV Buffer với encoding '${encoding}': ${error.message}`);
    }
  }
};
