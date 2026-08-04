import api from "./axios.js";

export const getEvaluatorProfile = () => api.get("/evaluator/profile");
export const saveEvaluatorProfile = (payload) => api.put("/evaluator/profile", payload);
export const uploadEvaluatorAsset = (type, file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post(`/evaluator/profile/${type}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};
