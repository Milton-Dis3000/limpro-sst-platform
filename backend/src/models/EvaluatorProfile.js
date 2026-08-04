import mongoose from "mongoose";

const evaluatorProfileSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    nombreProfesional: { type: String, required: true, trim: true },
    cargo: { type: String, trim: true },
    registroProfesional: { type: String, trim: true },
    firmaDigital: {
      url: String,
      publicId: String
    },
    logoConsultora: {
      url: String,
      publicId: String
    },
    contacto: {
      telefono: String,
      email: String,
      direccion: String,
      sitioWeb: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("EvaluatorProfile", evaluatorProfileSchema);
