import EvaluatorProfile from "../models/EvaluatorProfile.js";
import { uploadImageBuffer } from "../services/cloudinary.service.js";

export const getProfile = async (req, res, next) => {
  try {
    const profile = await EvaluatorProfile.findOne({ usuario: req.user._id });
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export const upsertProfile = async (req, res, next) => {
  try {
    const profile = await EvaluatorProfile.findOneAndUpdate(
      { usuario: req.user._id },
      { ...req.body, usuario: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export const uploadProfileAsset = async (req, res, next) => {
  try {
    const field = req.params.type === "firma" ? "firmaDigital" : "logoConsultora";
    const asset = await uploadImageBuffer(req.file, `limpro/evaluators/${field}`);
    const profile = await EvaluatorProfile.findOneAndUpdate(
      { usuario: req.user._id },
      { $set: { [field]: asset } },
      { upsert: true, new: true }
    );
    res.json(profile);
  } catch (error) {
    next(error);
  }
};
