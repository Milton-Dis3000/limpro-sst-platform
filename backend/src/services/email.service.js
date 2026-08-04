import { resend } from "../config/resend.js";
import logger from "../utils/logger.js";

const sendEmail = async ({ to, subject, html }) => {
  if (!resend || !process.env.EMAIL_FROM) {
    logger.info("Email omitido porque Resend no está configurado.", { to, subject });
    return null;
  }

  return resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  });
};

export const sendWelcomeEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: "Bienvenido a LIMPRO",
    html: `<p>Hola ${user.nombre}, tu cuenta de consultor en LIMPRO está lista.</p>`
  });

export const sendQuestionnaireInvite = ({ to, companyName, url }) =>
  sendEmail({
    to,
    subject: "Invitación a responder cuestionario SST",
    html: `<p>${companyName} te invita a completar el cuestionario de riesgo psicosocial.</p><p><a href="${url}">Responder cuestionario</a></p>`
  });

export const sendQuestionnaireCompleted = ({ to }) =>
  sendEmail({
    to,
    subject: "Cuestionario completado",
    html: "<p>Gracias. Tus respuestas fueron registradas correctamente.</p>"
  });

export const sendEvaluatorResponseNotice = ({ to, companyName }) =>
  sendEmail({
    to,
    subject: "Nueva respuesta recibida",
    html: `<p>Se registró una nueva respuesta para la evaluación de ${companyName}.</p>`
  });

export const sendReportReadyNotice = ({ to, companyName }) =>
  sendEmail({
    to,
    subject: "Evaluación lista para informe",
    html: `<p>La evaluación de ${companyName} ya cuenta con resultados para generar informe.</p>`
  });
