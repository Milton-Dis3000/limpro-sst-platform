import axios from "axios";
import { clearAuth, getAuth, setAuth } from "../store/auth.store.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const auth = getAuth();
  if (auth?.accessToken) config.headers.Authorization = `Bearer ${auth.accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const auth = getAuth();

    if (error.response?.status === 401 && auth?.refreshToken && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken: auth.refreshToken
        });
        setAuth({ ...auth, ...data });
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        clearAuth();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
