import api from "./axios.js";

export const loginRequest = (payload) => api.post("/auth/login", payload);
export const registerRequest = (payload) => api.post("/auth/register", payload);
export const bootstrapAdminRequest = (payload) => api.post("/auth/bootstrap-admin", payload);
export const adminBootstrapStatusRequest = () => api.get("/auth/bootstrap-status");
export const meRequest = () => api.get("/auth/me");
