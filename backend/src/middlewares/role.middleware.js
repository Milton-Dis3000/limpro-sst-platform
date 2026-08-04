export const allowRoles = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    const error = new Error("No tienes permisos para esta acción.");
    error.statusCode = 403;
    return next(error);
  }
  return next();
};
