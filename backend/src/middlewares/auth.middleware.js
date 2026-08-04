import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      const error = new Error("Token de acceso requerido.");
      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.sub).select("-password");

    if (!user || user.estado !== "activo") {
      const error = new Error("Usuario no autorizado.");
      error.statusCode = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    next(error);
  }
};
