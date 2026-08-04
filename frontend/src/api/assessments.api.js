import api from "./axios.js";

export const listAssessments = () => api.get("/assessments");
export const createAssessment = (payload) => api.post("/assessments", payload);
export const getAssessment = (id) => api.get(`/assessments/${id}`);
export const updateAssessment = (id, payload) => api.patch(`/assessments/${id}`, payload);
export const uploadAssessmentEvidence = (id, formData) => api.post(`/assessments/${id}/evidences`, formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const recalculateAssessment = (id, payload = {}) => api.post(`/assessments/${id}/recalculate`, payload);
export const getPublicAssessment = (token) => api.get(`/assessments/public/${token}`);
export const submitPublicResponse = (token, payload) => api.post(`/assessments/public/${token}/responses`, payload);
