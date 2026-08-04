import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    nombreComercial: { type: String, required: true, trim: true },
    razonSocial: { type: String, required: true, trim: true },
    identificacionFiscal: { type: String, required: true, trim: true },
    pais: { type: String, required: true, trim: true },
    ciudad: { type: String, required: true, trim: true },
    sector: { type: String, trim: true },
    logo: {
      url: String,
      publicId: String
    },
    slug: { type: String, required: true, unique: true },
    propietario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
