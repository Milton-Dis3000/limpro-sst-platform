import mongoose from "mongoose";

const responseSchema = new mongoose.Schema(
  {
    evaluacion: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true, index: true },
    participante: {
      anonimo: { type: Boolean, default: true },
      codigo: String,
      area: String,
      metadata: mongoose.Schema.Types.Mixed
    },
    respuestas: [
      {
        item: Number,
        value: Number
      }
    ],
    puntajes: {
      total: Number,
      dimensiones: [mongoose.Schema.Types.Mixed]
    },
    resultadoPorDimension: [mongoose.Schema.Types.Mixed],
    resultadoGlobal: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

export default mongoose.model("Response", responseSchema);
