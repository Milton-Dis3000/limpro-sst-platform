import Assessment from "../models/Assessment.js";
import Response from "../models/Response.js";
import Report from "../models/Report.js";
import EvaluatorProfile from "../models/EvaluatorProfile.js";
import { resolveQuestionnaireSource } from "../data/resolveQuestionnaire.js";
import { buildAssessmentExcel, buildAssessmentPdf, buildAssessmentWord } from "../services/report.service.js";

const findAccessibleAssessment = async (req) => {
  const assessment = await Assessment.findOne(
    req.user.rol === "admin"
      ? { _id: req.params.assessmentId }
      : { _id: req.params.assessmentId, evaluador: req.user._id }
  ).populate("empresa").populate("questionnaire").populate("evaluador", "nombre email");
  if (!assessment) {
    const error = new Error("Evaluacion no encontrada o no tienes permiso para verla.");
    error.statusCode = 404;
    throw error;
  }
  return assessment;
};

export const generatePdfReport = async (req, res, next) => {
  try {
    const assessment = await findAccessibleAssessment(req);
    const responses = await Response.find({ evaluacion: assessment._id });
    const questionnaire = resolveQuestionnaireSource(assessment.questionnaire);
    const evaluatorProfile = await EvaluatorProfile.findOne({ usuario: assessment.evaluador?._id || assessment.evaluador });
    const buffer = await buildAssessmentPdf({
      assessment,
      responses,
      questionnaire,
      evaluatorProfile,
      includeSignature: req.body?.firmaIncluida !== false
    });

    await Report.create({
      evaluacion: assessment._id,
      firmaIncluida: Boolean(req.body?.firmaIncluida),
      generadoPor: req.user._id
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=limpro-${assessment._id}.pdf`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const generateExcelReport = async (req, res, next) => {
  try {
    const assessment = await findAccessibleAssessment(req);
    const responses = await Response.find({ evaluacion: assessment._id });
    const questionnaire = resolveQuestionnaireSource(assessment.questionnaire);
    const evaluatorProfile = await EvaluatorProfile.findOne({ usuario: assessment.evaluador?._id || assessment.evaluador });
    const buffer = await buildAssessmentExcel({ assessment, responses, questionnaire, evaluatorProfile });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=limpro-${assessment._id}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};

export const generateWordReport = async (req, res, next) => {
  try {
    const assessment = await findAccessibleAssessment(req);
    const responses = await Response.find({ evaluacion: assessment._id });
    const questionnaire = resolveQuestionnaireSource(assessment.questionnaire);
    const evaluatorProfile = await EvaluatorProfile.findOne({ usuario: assessment.evaluador?._id || assessment.evaluador });
    const buffer = await buildAssessmentWord({
      assessment,
      responses,
      questionnaire,
      evaluatorProfile,
      includeSignature: req.body?.firmaIncluida !== false
    });

    await Report.create({
      evaluacion: assessment._id,
      firmaIncluida: Boolean(req.body?.firmaIncluida),
      generadoPor: req.user._id
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename=limpro-${assessment._id}.docx`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};

export const listReports = async (req, res, next) => {
  try {
    const filter = req.user.rol === "admin" ? {} : { generadoPor: req.user._id };
    const reports = await Report.find(filter).populate("evaluacion");
    res.json(reports);
  } catch (error) {
    next(error);
  }
};
