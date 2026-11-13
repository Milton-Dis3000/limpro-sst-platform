import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    evaluacion: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
    pdfGenerado: {
      url: String,
      publicId: String
    },
    excelGenerado: {
      url: String,
      publicId: String
    },
    wordGenerado: {
      url: String,
      publicId: String
    },
    formato: { type: String, enum: ["pdf", "docx", "xlsx"] },
    archivo: {
      datos: Buffer,
      nombreArchivo: String,
      mimeType: String,
      tamaño: Number
    },
    version: { type: Number, default: 1 },
    firmaIncluida: { type: Boolean, default: false },
    fechaEmision: { type: Date, default: Date.now },
    generadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

reportSchema.index({ generadoPor: 1, fechaEmision: -1 });
reportSchema.index({ evaluacion: 1, fechaEmision: -1 });

export default mongoose.model("Report", reportSchema);
