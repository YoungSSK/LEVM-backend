import { detectCsvEncoding } from "./csvEncodingDetector.js";
import { decodeCsvBuffer } from "./csvDecoder.js";

const explanationText = "Với chủ ngữ số ít ngôi thứ ba (she, he, it), ta thêm '-es' vào sau động từ 'go' ở thì Hiện tại đơn.";
const utf8Buffer = Buffer.from(
  'Question,Option A,Option B,Option C,Option D,Correct Option,Explanation\n' +
  `She _____ to school every morning.,go,goes,going,gone,goes,"${explanationText}"`,
  "utf-8"
);

console.log("--- TESTING DETECTOR ON REAL UTF-8 USER CSV ---");
const detection = detectCsvEncoding(utf8Buffer);
console.log("DETECTED ENCODING:", detection);

const decoded = decodeCsvBuffer(utf8Buffer, detection);
console.log("\n--- DECODED RESULT ---");
console.log(decoded);
