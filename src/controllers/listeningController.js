import * as listeningSetService from "../services/listeningSetService.js";
import * as listeningQuestionService from "../services/listeningQuestionService.js";
import * as listeningAttemptService from "../services/listeningAttemptService.js";

// ================= LISTENING SETS =================

export const getListeningSets = async (req, res, next) => {
  try {
    const result = await listeningSetService.getListeningSets(req.query);
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách bài nghe thành công",
      data: result.sets,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getListeningSetByIdAdmin = async (req, res, next) => {
  try {
    const set = await listeningSetService.getListeningSetByIdAdmin(req.params.id);
    return res.status(200).json({
      success: true,
      data: set,
    });
  } catch (error) {
    next(error);
  }
};

export const createListeningSet = async (req, res, next) => {
  try {
    const newSet = await listeningSetService.createListeningSet(req.body, req.user?._id);
    return res.status(201).json({
      success: true,
      message: "Tạo bài nghe thành công",
      data: newSet,
    });
  } catch (error) {
    next(error);
  }
};

export const updateListeningSet = async (req, res, next) => {
  try {
    const updatedSet = await listeningSetService.updateListeningSet(req.params.id, req.body, req.user?._id);
    return res.status(200).json({
      success: true,
      message: "Cập nhật bài nghe thành công",
      data: updatedSet,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteListeningSet = async (req, res, next) => {
  try {
    const result = await listeningSetService.deleteListeningSet(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const reorderGroups = async (req, res, next) => {
  try {
    const result = await listeningSetService.reorderGroups(req.params.setId, req.body.items);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const reorderQuestions = async (req, res, next) => {
  try {
    const result = await listeningSetService.reorderQuestions(req.params.setId, req.body.items);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ================= AUDIO GROUPS (Part 3/4) =================

export const createAudioGroup = async (req, res, next) => {
  try {
    const groupData = { ...req.body, setId: req.params.setId };
    const group = await listeningQuestionService.createAudioGroup(groupData);
    return res.status(201).json({
      success: true,
      message: "Tạo Audio Group thành công",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAudioGroup = async (req, res, next) => {
  try {
    const updatedGroup = await listeningQuestionService.updateAudioGroup(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Cập nhật Audio Group thành công",
      data: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAudioGroup = async (req, res, next) => {
  try {
    const result = await listeningQuestionService.deleteAudioGroup(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ================= LISTENING QUESTIONS =================

export const getQuestionsBySetId = async (req, res, next) => {
  try {
    const questions = await listeningQuestionService.getQuestionsBySetId(req.params.setId);
    return res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionsByGroupId = async (req, res, next) => {
  try {
    const questions = await listeningQuestionService.getQuestionsByGroupId(req.params.groupId);
    return res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req, res, next) => {
  try {
    const question = await listeningQuestionService.createQuestion(req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo câu hỏi thành công",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (req, res, next) => {
  try {
    const updatedQuestion = await listeningQuestionService.updateQuestion(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Cập nhật câu hỏi thành công",
      data: updatedQuestion,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    const result = await listeningQuestionService.deleteQuestion(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ================= LEARNER PLAY & ATTEMPTS =================

export const getPlayPayload = async (req, res, next) => {
  try {
    const payload = await listeningQuestionService.getPlayPayload(req.params.id);
    return res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
};

export const submitAttempt = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const result = await listeningAttemptService.submitAttempt(userId, req.body);
    return res.status(200).json({
      success: true,
      message: "Nộp bài nghe thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAttemptHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { setId } = req.query;
    const history = await listeningAttemptService.getAttemptHistory(userId, setId);
    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
