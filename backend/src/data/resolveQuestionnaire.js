import { psychosocialQuestionnaire } from "./psychosocialQuestionnaire.js";

export const resolveQuestionnaireSource = (questionnaire) => {
  const plainQuestionnaire = questionnaire?.toObject ? questionnaire.toObject() : questionnaire;
  if (plainQuestionnaire?.modulo !== psychosocialQuestionnaire.modulo) return plainQuestionnaire;

  return {
    ...plainQuestionnaire,
    ...psychosocialQuestionnaire,
    _id: plainQuestionnaire._id,
    activo: plainQuestionnaire.activo,
    createdAt: plainQuestionnaire.createdAt,
    updatedAt: plainQuestionnaire.updatedAt
  };
};
