import { detectCsvEncoding } from "./csvEncodingDetector.js";
import { decodeCsvBuffer } from "./csvDecoder.js";
import { parseCsvString } from "./csvParser.js";

/**
 * Shared CSV Engine Facade API cho toàn bộ dự án LEVM.
 * Tự động detect encoding (UTF-8, UTF-16, Win-1258, Win-1252), decode an toàn,
 * parse CSV thành JS Objects và log audit metrics.
 *
 * @param {Buffer} buffer - Buffer file CSV từ Multer RAM Memory
 * @param {Object} options - Tùy chọn bổ sung cho csv-parse
 * @returns {{ records: Array, rawHeader: Array, metadata: Object }}
 */
export const processCsvBuffer = (buffer, options = {}) => {
  const startTime = Date.now();

  // 1. Detect Encoding
  const detectionResult = detectCsvEncoding(buffer);
  const detectTime = Date.now();

  // 2. Decode Buffer -> Clean String
  const decodedString = decodeCsvBuffer(buffer, detectionResult);
  const decodeTime = Date.now();

  // 3. Parse CSV String -> JS Objects & Raw Header
  const { records, rawHeader } = parseCsvString(decodedString, options);
  const parseTime = Date.now();

  const metadata = {
    fileSizeBytes: buffer ? buffer.length : 0,
    detectedEncoding: detectionResult.encoding,
    hasBom: detectionResult.hasBom,
    rowCount: records.length,
    headerCount: rawHeader.length,
    durationMs: parseTime - startTime,
    timings: {
      detectionMs: detectTime - startTime,
      decodingMs: decodeTime - detectTime,
      parsingMs: parseTime - decodeTime,
    },
  };

  console.log(
    `[CSV_ENGINE_AUDIT] Processed CSV File | Encoding: ${metadata.detectedEncoding} (BOM: ${metadata.hasBom}) | Rows: ${metadata.rowCount} | Size: ${metadata.fileSizeBytes}B | Duration: ${metadata.durationMs}ms`,
  );
  if (records.length > 0) {
    console.log("[CSV_ENGINE_DEBUG] First record parsed:", JSON.stringify(records[0]));
  }

  return {
    records,
    rawHeader,
    rawText: decodedString,
    metadata,
  };
};

export { detectCsvEncoding, decodeCsvBuffer, parseCsvString };
