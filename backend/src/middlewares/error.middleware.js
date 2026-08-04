import logger from "../utils/logger.js";

export const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  logger.error(err.message, { stack: err.stack, path: req.originalUrl });

  res.status(statusCode).json({
    message: err.message || "Error interno del servidor",
    details: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};
