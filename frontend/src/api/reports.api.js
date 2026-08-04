import api from "./axios.js";

export const downloadPdfReport = (assessmentId, payload = {}) =>
  api.post(`/reports/${assessmentId}/pdf`, payload, { responseType: "blob" });

export const downloadExcelReport = (assessmentId, payload = {}) =>
  api.post(`/reports/${assessmentId}/excel`, payload, { responseType: "blob" });

export const downloadWordReport = (assessmentId, payload = {}) =>
  api.post(`/reports/${assessmentId}/word`, payload, { responseType: "blob" });
