import Company from "../models/Company.js";
import { slugify } from "../utils/slug.js";
import { uploadImageBuffer } from "../services/cloudinary.service.js";

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

export const uploadCompanyLogo = async (req, res, next) => {
  try {
    const logo = await uploadImageBuffer(req.file, "limpro/companies");
    const company = await Company.findByIdAndUpdate(req.params.id, { logo }, { new: true });
    res.json(company);
  } catch (error) {
    next(error);
  }
};
