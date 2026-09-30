import Company from "../models/Company.js";
import Assessment from "../models/Assessment.js";
import Response from "../models/Response.js";
import Report from "../models/Report.js";
import { slugify } from "../utils/slug.js";
import { uploadImageBuffer } from "../services/cloudinary.service.js";

const companyAccessFilter = (req) =>
  req.user.rol === "admin" ? { _id: req.params.id } : { _id: req.params.id, propietario: req.user._id };

export const listCompanies = async (req, res, next) => {
  try {
    const filter = req.user.rol === "admin" ? {} : { propietario: req.user._id };
    const companies = await Company.find(filter).sort({ createdAt: -1 });
    res.json(companies);
  } catch (error) {
    next(error);
  }
};

export const createCompany = async (req, res, next) => {
  try {
    const baseSlug = slugify(req.body.nombreComercial || req.body.razonSocial);
    const suffix = Date.now().toString(36);
    const company = await Company.create({
      ...req.body,
      slug: `${baseSlug}-${suffix}`,
      propietario: req.user._id
    });
    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
};

export const getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      const error = new Error("Empresa no encontrada.");
      error.statusCode = 404;
      throw error;
    }
    res.json(company);
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(company);
  } catch (error) {
    next(error);
  }
};

export const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findOne(companyAccessFilter(req));
    if (!company) {
      const error = new Error("Empresa no encontrada o no tienes permiso para eliminarla.");
      error.statusCode = 404;
      throw error;
    }

    const assessmentIds = await Assessment.find({ empresa: company._id }).distinct("_id");
    const [responseCount, reportCount] = assessmentIds.length
      ? await Promise.all([
          Response.countDocuments({ evaluacion: { $in: assessmentIds } }),
          Report.countDocuments({ evaluacion: { $in: assessmentIds } })
        ])
      : [0, 0];

    if (assessmentIds.length > 0 && req.query.cascade !== "true") {
      return res.status(409).json({
        message: "La empresa tiene informacion asociada. Confirma la eliminacion completa para continuar.",
        requiresConfirmation: true,
        affected: {
          assessments: assessmentIds.length,
          responses: responseCount,
          reports: reportCount
        }
      });
    }

    const session = await Company.startSession();
    try {
      await session.withTransaction(async () => {
        if (assessmentIds.length) {
          await Report.deleteMany({ evaluacion: { $in: assessmentIds } }, { session });
          await Response.deleteMany({ evaluacion: { $in: assessmentIds } }, { session });
          await Assessment.deleteMany({ _id: { $in: assessmentIds } }, { session });
        }
        await Company.deleteOne({ _id: company._id }, { session });
      });
    } finally {
      await session.endSession();
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const uploadCompanyLogo = async (req, res, next) => {
  try {
    const logo = await uploadImageBuffer(req.file, "limpro/companies");
    const company = await Company.findByIdAndUpdate(req.params.id, { logo }, { new: true });
    res.json(company);
  } catch (error) {
    next(error);
  }
};
