import api from "./axios.js";

export const listCompanies = () => api.get("/companies");
export const createCompany = (payload) => api.post("/companies", payload);
export const getCompany = (id) => api.get(`/companies/${id}`);
export const deleteCompany = (id, { cascade = false } = {}) =>
  api.delete(`/companies/${id}`, { params: cascade ? { cascade: true } : undefined });
