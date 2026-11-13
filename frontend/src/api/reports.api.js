import api from "./axios.js";

export const listReports = () => api.get("/reports");
export const downloadStoredReport = (id) => api.get(`/reports/${id}/download`, { responseType: "blob" });
export const downloadPdfReport = (assessmentId, payload = {}) =>
  api.post(`/reports/${assessmentId}/pdf`, payload, { responseType: "blob" });

export const downloadExcelReport = (assessmentId, payload = {}) =>
  api.post(`/reports/${assessmentId}/excel`, payload, { responseType: "blob" });

export const downloadWordReport = (assessmentId, payload = {}) =>
  api.post(`/reports/${assessmentId}/word`, payload, { responseType: "blob" });
