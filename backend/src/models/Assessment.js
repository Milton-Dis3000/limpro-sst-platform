import mongoose from "mongoose";
import crypto from "node:crypto";
import { ASSESSMENT_STATUS, DOSSIER_STATUS } from "../utils/constants.js";

const assessmentSchema = new mongoose.Schema(
  {
    empresa: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    evaluador: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    questionnaire: { type: mongoose.Schema.Types.ObjectId, ref: "Questionnaire", required: true },
    tipo: {
      type: String,
      enum: ["psicosocial", "ruido", "iluminacion", "riesgos_fisicos", "ergonomia", "prevencion_alcohol_drogas"],
      default: "psicosocial"
    },
    pais: { type: String, default: "Ecuador" },
    estado: {
      type: String,
      enum: Object.values(ASSESSMENT_STATUS),
      default: ASSESSMENT_STATUS.DRAFT
    },
    fechaInicio: Date,
    fechaCierre: Date,
    totalParticipantes: { type: Number, default: 0 },
    publicToken: { type: String, default: () => crypto.randomUUID(), unique: true },
    resultadosCalculados: {
      dimensiones: [mongoose.Schema.Types.Mixed],
      global: mongoose.Schema.Types.Mixed,
      resumen: mongoose.Schema.Types.Mixed,
      interpretaciones: mongoose.Schema.Types.Mixed,
      recomendaciones: [String],
      planAccion: [mongoose.Schema.Types.Mixed],
      tabulacion: [mongoose.Schema.Types.Mixed],
      updatedAt: Date
    },
    informeTecnico: {
      objetivo: String,
      alcance: String,
      metodologia: String,
      conclusiones: String,
      recomendaciones: [String],
      planAccion: [mongoose.Schema.Types.Mixed],
      incluirFirma: { type: Boolean, default: true }
    },
    expediente: {
      estado: {
        type: String,
        enum: Object.values(DOSSIER_STATUS),
        default: DOSSIER_STATUS.DRAFT
      },
      listoParaInspeccion: { type: Boolean, default: false },
      fechaRevision: Date,
      fechaFirma: Date,
      fechaCierre: Date,
      socializacion: {
        realizada: { type: Boolean, default: false },
        fecha: Date,
        responsable: String,
        participantes: Number,
        observaciones: String
      },
      evidencias: [
        {
          tipo: { type: String, default: "otro" },
          nombre: String,
          descripcion: String,
          fecha: Date,
          archivo: {
            url: String,
            publicId: String,
            originalName: String,
            mimeType: String,
            size: Number
          },
          createdAt: { type: Date, default: Date.now }
        }
      ],
      observaciones: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Assessment", assessmentSchema);
