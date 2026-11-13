import api from "./axios.js";

export const getAdminOverview = () => api.get("/admin/overview");
export const listUsers = () => api.get("/admin/users");
export const updateUserAccess = (id, payload) => api.patch(`/admin/users/${id}`, payload);
