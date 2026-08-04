import api from "./axios.js";

export const listCompanies = () => api.get("/companies");
export const createCompany = (payload) => api.post("/companies", payload);
export const getCompany = (id) => api.get(`/companies/${id}`);
