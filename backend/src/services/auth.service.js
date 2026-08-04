import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const expiresInDays = () => {
  const value = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
  const days = Number.parseInt(value, 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

export const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: expiresInDays()
  });

  return { accessToken, refreshToken };
};

export const registerUser = async (payload) => {
  const existing = await User.findOne({ email: payload.email });
  if (existing) {
    const error = new Error("El email ya está registrado.");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create(payload);
  const tokens = await issueTokens(user);
  return { user, tokens };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    const error = new Error("Credenciales inválidas.");
    error.statusCode = 401;
    throw error;
  }

  const tokens = await issueTokens(user);
  user.password = undefined;
  return { user, tokens };
};

export const refreshAccessToken = async (refreshToken) => {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const tokenHash = hashToken(refreshToken);
  const stored = await RefreshToken.findOne({ tokenHash, revokedAt: null });

  if (!stored || stored.expiresAt < new Date()) {
    const error = new Error("Refresh token inválido o expirado.");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 401;
    throw error;
  }

  const newRefreshToken = generateRefreshToken(user);
  stored.revokedAt = new Date();
  stored.replacedByTokenHash = hashToken(newRefreshToken);
  await stored.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: expiresInDays()
  });

  return {
    accessToken: generateAccessToken(user),
    refreshToken: newRefreshToken
  };
};

export const revokeRefreshToken = async (refreshToken) => {
  await RefreshToken.findOneAndUpdate(
    { tokenHash: hashToken(refreshToken), revokedAt: null },
    { revokedAt: new Date() }
  );
};
