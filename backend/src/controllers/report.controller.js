import Assessment from "../models/Assessment.js";
import Response from "../models/Response.js";
import Report from "../models/Report.js";
import EvaluatorProfile from "../models/EvaluatorProfile.js";
import { resolveQuestionnaireSource } from "../data/resolveQuestionnaire.js";
import { buildAssessmentExcel, buildAssessmentPdf, buildAssessmentWord } from "../services/report.service.js";

const reportTypes = {
  pdf: { extension: "pdf", mimeType: "application/pdf" },
  docx: { extension: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  xlsx: { extension: "xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
};
const maxStoredReportSize = 14 * 1024 * 1024;

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

const saveReportRecord = async ({ assessment, req, format, buffer, firmaIncluida = false }) => {
  if (buffer.length > maxStoredReportSize) {
    const error = new Error("El informe supera el límite de archivo que se puede archivar (14 MB).");
    error.statusCode = 413;
    throw error;
  }
  const { extension, mimeType } = reportTypes[format];
  const filename = `limpro-${assessment._id}.${extension}`;
  return Report.create({
    evaluacion: assessment._id,
    formato: format,
    archivo: { datos: buffer, nombreArchivo: filename, mimeType, tamaño: buffer.length },
    firmaIncluida,
    generadoPor: req.user._id
  });
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

    await saveReportRecord({ assessment, req, format: "pdf", buffer, firmaIncluida: Boolean(req.body?.firmaIncluida) });

    res.setHeader("Content-Type", reportTypes.pdf.mimeType);
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

    await saveReportRecord({ assessment, req, format: "xlsx", buffer: Buffer.from(buffer) });
    res.setHeader("Content-Type", reportTypes.xlsx.mimeType);
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

    await saveReportRecord({ assessment, req, format: "docx", buffer: Buffer.from(buffer), firmaIncluida: Boolean(req.body?.firmaIncluida) });

    res.setHeader("Content-Type", reportTypes.docx.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename=limpro-${assessment._id}.docx`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};

export const listReports = async (req, res, next) => {
  try {
    const filter = req.user.rol === "admin" ? {} : { generadoPor: req.user._id };
    const reports = await Report.find(filter)
      .select("-archivo.datos")
      .populate({ path: "evaluacion", select: "tipo estado empresa", populate: { path: "empresa", select: "nombreComercial" } })
      .populate("generadoPor", "nombre")
      .sort({ fechaEmision: -1 });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

export const downloadStoredReport = async (req, res, next) => {
  try {
    const filter = req.user.rol === "admin"
      ? { _id: req.params.id }
      : { _id: req.params.id, generadoPor: req.user._id };
    const report = await Report.findOne(filter).select("+archivo.datos archivo.nombreArchivo archivo.mimeType archivo.tamaño formato");
    if (!report) {
      const error = new Error("Informe no encontrado o no tienes permiso para descargarlo.");
      error.statusCode = 404;
      throw error;
    }
    if (!report.archivo?.datos) {
      const error = new Error("Este informe es anterior al archivo histórico y no tiene un documento guardado.");
      error.statusCode = 410;
      throw error;
    }

    const filename = (report.archivo.nombreArchivo || `limpro-informe.${reportTypes[report.formato]?.extension || "bin"}`).replace(/[\r\n"]+/g, "_");
    res.setHeader("Content-Type", report.archivo.mimeType || "application/octet-stream");
    res.setHeader("Content-Length", report.archivo.tamaño || report.archivo.datos.length);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(report.archivo.datos);
  } catch (error) {
    next(error);
  }
};
