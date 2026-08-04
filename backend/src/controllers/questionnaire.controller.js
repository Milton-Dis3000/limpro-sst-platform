import Questionnaire from "../models/Questionnaire.js";
import { resolveQuestionnaireSource } from "../data/resolveQuestionnaire.js";

export const listQuestionnaires = async (_req, res, next) => {
  try {
    const questionnaires = await Questionnaire.find({ activo: true }).select("nombre pais modulo version preguntas dimensiones");
    res.json(questionnaires.map(resolveQuestionnaireSource));
  } catch (error) {
    next(error);
  }
};

export const getQuestionnaire = async (req, res, next) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    if (!questionnaire) {
      const error = new Error("Cuestionario no encontrado.");
      error.statusCode = 404;
      throw error;
    }
    res.json(resolveQuestionnaireSource(questionnaire));
  } catch (error) {
    next(error);
  }
};
