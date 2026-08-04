import { loginUser, refreshAccessToken, registerUser, revokeRefreshToken } from "../services/auth.service.js";
import { sendWelcomeEmail } from "../services/email.service.js";

const publicUser = (user) => ({
  id: user._id,
  nombre: user.nombre,
  email: user.email,
  rol: user.rol,
  estado: user.estado
});

export const register = async (req, res, next) => {
  try {
    const { user, tokens } = await registerUser(req.body);
    await sendWelcomeEmail(user);
    res.status(201).json({ user: publicUser(user), ...tokens });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, tokens } = await loginUser(req.body);
    res.json({ user: publicUser(user), ...tokens });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const tokens = await refreshAccessToken(req.body.refreshToken);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.body.refreshToken) await revokeRefreshToken(req.body.refreshToken);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const me = (req, res) => res.json({ user: publicUser(req.user) });
