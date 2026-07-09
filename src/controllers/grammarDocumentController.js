import * as grammarDocumentService from "../services/grammarDocumentService.js";

export const uploadGrammarDocument = async (req, res, next) => {
  try {
    const result = await grammarDocumentService.uploadGrammarDocument(req.file);

    return res.status(200).json({
      success: true,
      message: "Chuyển đổi file thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
