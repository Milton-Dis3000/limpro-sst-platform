import Assessment from "../models/Assessment.js";
import Company from "../models/Company.js";
import Report from "../models/Report.js";
import Response from "../models/Response.js";
import User from "../models/User.js";

export const getAdminOverview = async (_req, res, next) => {
  try {
    const [users, activeEvaluators, assessments, responses, companies, reports, byStatus] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ rol: "consultor", estado: "activo" }),
      Assessment.countDocuments(),
      Response.countDocuments(),
      Company.countDocuments(),
      Report.countDocuments(),
      Assessment.aggregate([{ $group: { _id: "$estado", total: { $sum: 1 } } }])
    ]);
    res.json({
      users,
      activeEvaluators,
      assessments,
      responses,
      companies,
      reports,
      assessmentsByStatus: Object.fromEntries(byStatus.map(({ _id, total }) => [_id || "sin_estado", total]))
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (_req, res, next) => {
  try {
    const [users, assignedCounts] = await Promise.all([
      User.find().select("nombre email rol estado createdAt").sort({ createdAt: -1 }).lean(),
      Assessment.aggregate([{ $group: { _id: "$evaluador", total: { $sum: 1 } } }])
    ]);
    const assignments = new Map(assignedCounts.map(({ _id, total }) => [_id.toString(), total]));
    const result = users.map((user) => ({ ...user, evaluacionesAsignadas: assignments.get(user._id.toString()) || 0 }));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateUserAccess = async (req, res, next) => {
  try {
    const { rol, estado } = req.body;
    const updates = {};
    if (rol !== undefined) {
      if (!["consultor", "empresa"].includes(rol)) {
        const error = new Error("El rol debe ser Evaluador o Empresa.");
        error.statusCode = 400;
        throw error;
      }
      updates.rol = rol;
    }
    if (estado !== undefined) {
      if (!["activo", "suspendido"].includes(estado)) {
        const error = new Error("El estado debe ser activo o suspendido.");
        error.statusCode = 400;
        throw error;
      }
      updates.estado = estado;
    }
    if (!Object.keys(updates).length) {
      const error = new Error("No hay cambios de acceso para aplicar.");
      error.statusCode = 400;
      throw error;
    }

    const targetUser = await User.findById(req.params.id).select("rol estado");
    if (!targetUser || targetUser.rol === "admin") {
      const error = new Error("Usuario no encontrado. La cuenta maestra no se modifica desde esta pantalla.");
      error.statusCode = 404;
      throw error;
    }
    const willBeActiveEvaluator = (updates.rol ?? targetUser.rol) === "consultor" && (updates.estado ?? targetUser.estado) === "activo";
    if (willBeActiveEvaluator) {
      const anotherEvaluator = await User.exists({ _id: { $ne: targetUser._id }, rol: "consultor", estado: "activo" });
      if (anotherEvaluator) {
        const error = new Error("Ya existe un evaluador activo. Suspéndelo antes de asignar este rol a otra cuenta.");
        error.statusCode = 409;
        throw error;
      }
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, rol: { $ne: "admin" } },
      { $set: updates },
      { new: true, runValidators: true }
    ).select("nombre email rol estado createdAt");
    if (!user) {
      const error = new Error("Usuario no encontrado. La cuenta maestra no se modifica desde esta pantalla.");
      error.statusCode = 404;
      throw error;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};
