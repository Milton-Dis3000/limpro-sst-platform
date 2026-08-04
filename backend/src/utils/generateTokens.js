import jwt from "jsonwebtoken";

export const generateAccessToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.rol },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
  );

export const generateRefreshToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
  );
