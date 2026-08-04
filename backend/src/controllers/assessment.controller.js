import Assessment from "../models/Assessment.js";
import Questionnaire from "../models/Questionnaire.js";
import Response from "../models/Response.js";
import { resolveQuestionnaireSource } from "../data/resolveQuestionnaire.js";
import { aggregateResults, scoreResponse, tabulateResponses } from "../services/scoring.service.js";
import { uploadFileBuffer } from "../services/cloudinary.service.js";
import { ASSESSMENT_STATUS, DOSSIER_STATUS } from "../utils/constants.js";

const withDossierDates = (payload = {}) => {
  if (!payload.expediente?.estado) return payload;
  const expediente = { ...payload.expediente };
  const now = new Date();
  if (expediente.estado === DOSSIER_STATUS.REVIEWED && !expediente.fechaRevision) expediente.fechaRevision = now;
  if (expediente.estado === DOSSIER_STATUS.SIGNED && !expediente.fechaFirma) expediente.fechaFirma = now;
  if (expediente.estado === DOSSIER_STATUS.CLOSED && !expediente.fechaCierre) {
    expediente.fechaCierre = now;
    expediente.listoParaInspeccion = true;
  }
  return { ...payload, expediente };
};

export const listAssessments = async (req, res, next) => {
  try {
    const assessments = await Assessment.find({ evaluador: req.user._id })
      .populate("empresa", "nombreComercial razonSocial")
      .populate("questionnaire", "nombre modulo version")
      .sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    next(error);
  }
};

export const createAssessment = async (req, res, next) => {
  try {
    const questionnaire =
      req.body.questionnaire ||
      (await Questionnaire.findOne({ modulo: req.body.tipo || "psicosocial", activo: true }).select("_id"));

    if (!questionnaire) {
      const error = new Error("No hay cuestionario activo para este módulo.");
      error.statusCode = 400;
      throw error;
    }

    const assessment = await Assessment.create({
      ...req.body,
      questionnaire: questionnaire._id || questionnaire,
      evaluador: req.user._id,
      estado: req.body.estado || ASSESSMENT_STATUS.DRAFT
    });
    res.status(201).json(assessment);
  } catch (error) {
    next(error);
  }
};

export const getAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate("empresa")
      .populate("questionnaire")
      .populate("evaluador", "nombre email");
    if (!assessment) {
      const error = new Error("Evaluación no encontrada.");
      error.statusCode = 404;
      throw error;
    }
    const assessmentPayload = assessment.toObject();
    assessmentPayload.questionnaire = resolveQuestionnaireSource(assessment.questionnaire);
    res.json(assessmentPayload);
  } catch (error) {
    next(error);
  }
};

export const updateAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findByIdAndUpdate(req.params.id, withDossierDates(req.body), { new: true })
      .populate("empresa")
      .populate("questionnaire")
      .populate("evaluador", "nombre email");
    res.json(assessment);
  } catch (error) {
    next(error);
  }
};

export const uploadAssessmentEvidence = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error("Debes seleccionar un archivo de evidencia.");
      error.statusCode = 400;
      throw error;
    }

    const assessment = await Assessment.findOne({ _id: req.params.id, evaluador: req.user._id });
    if (!assessment) {
      const error = new Error("Evaluacion no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const uploaded = await uploadFileBuffer(req.file, `limpro/assessments/${assessment._id}/evidencias`);
    assessment.expediente = assessment.expediente || {};
    assessment.expediente.evidencias = assessment.expediente.evidencias || [];
    assessment.expediente.evidencias.push({
      tipo: req.body.tipo || "otro",
      nombre: req.body.nombre || req.file.originalname,
      descripcion: req.body.descripcion || "",
      fecha: req.body.fecha ? new Date(req.body.fecha) : new Date(),
      archivo: uploaded
    });
    await assessment.save();

    const updatedAssessment = await Assessment.findById(assessment._id)
      .populate("empresa")
      .populate("questionnaire")
      .populate("evaluador", "nombre email");
    res.status(201).json(updatedAssessment);
  } catch (error) {
    next(error);
  }
};

export const getPublicAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({ publicToken: req.params.token })
      .populate("empresa", "nombreComercial logo")
      .populate("questionnaire");
    if (!assessment) {
      const error = new Error("Enlace de evaluación no encontrado.");
      error.statusCode = 404;
      throw error;
    }
    res.json({
      id: assessment._id,
      empresa: assessment.empresa,
      tipo: assessment.tipo,
      questionnaire: resolveQuestionnaireSource(assessment.questionnaire)
    });
  } catch (error) {
    next(error);
  }
};

export const submitPublicResponse = async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({ publicToken: req.params.token })
      .populate("empresa", "nombreComercial")
      .populate("questionnaire")
      .populate("evaluador", "email");
    if (!assessment) {
      const error = new Error("Enlace de evaluación no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const questionnaire = resolveQuestionnaireSource(assessment.questionnaire);
    const scoring = scoreResponse(questionnaire, req.body.respuestas);
    await Response.create({
      evaluacion: assessment._id,
      participante: req.body.participante || { anonimo: true },
      respuestas: req.body.respuestas,
      puntajes: { total: scoring.total, dimensiones: scoring.dimensiones },
      resultadoPorDimension: scoring.dimensiones,
      resultadoGlobal: scoring.global
    });

    const responses = await Response.find({ evaluacion: assessment._id });
    assessment.totalParticipantes = responses.length;
    assessment.estado = ASSESSMENT_STATUS.IN_PROGRESS;
    assessment.resultadosCalculados = {
      ...aggregateResults(questionnaire, responses),
      tabulacion: tabulateResponses(questionnaire, responses),
      updatedAt: new Date()
    };
    await assessment.save();

    res.status(201).json({ message: "Respuesta registrada.", resultadoGlobal: scoring.global });
  } catch (error) {
    next(error);
  }
};

export const recalculateAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id).populate("questionnaire");
    const responses = await Response.find({ evaluacion: assessment._id });
    const questionnaire = resolveQuestionnaireSource(assessment.questionnaire);
    assessment.totalParticipantes = responses.length;
    assessment.resultadosCalculados = {
      ...aggregateResults(questionnaire, responses),
      tabulacion: tabulateResponses(questionnaire, responses),
      updatedAt: new Date()
    };
    if (req.body.finalizar) assessment.estado = ASSESSMENT_STATUS.FINISHED;
    await assessment.save();
    const updatedAssessment = await Assessment.findById(assessment._id)
      .populate("empresa", "nombreComercial razonSocial")
      .populate("questionnaire", "nombre modulo version");
    res.json(updatedAssessment);
  } catch (error) {
    next(error);
  }
};
