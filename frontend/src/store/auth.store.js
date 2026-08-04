const AUTH_KEY = "limpro-auth";

export const getAuth = () => {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setAuth = (auth) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  window.dispatchEvent(new Event("limpro-auth"));
};

export const clearAuth = () => {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event("limpro-auth"));
};
