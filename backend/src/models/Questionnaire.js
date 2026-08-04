import mongoose from "mongoose";

const rangeSchema = new mongoose.Schema(
  {
    min: Number,
    max: Number
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    order: Number,
    text: String,
    dimension: String,
    required: { type: Boolean, default: true }
  },
  { _id: false }
);

const generalDataSchema = new mongoose.Schema(
  {
    id: String,
    label: String,
    type: String,
    options: [String]
  },
  { _id: false }
);

const dimensionSchema = new mongoose.Schema(
  {
    name: String,
    code: String,
    items: [Number],
    ranges: {
      bajo: rangeSchema,
      medio: rangeSchema,
      alto: rangeSchema
    },
    parent: String,
    description: String
  },
  { _id: false }
);

const questionnaireSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    pais: { type: String, default: "Ecuador" },
    modulo: { type: String, required: true, index: true },
    version: { type: String, default: "1.0.0" },
    instrucciones: [String],
    datosGenerales: [generalDataSchema],
    preguntas: [questionSchema],
    opcionesRespuesta: [
      {
        label: String,
        value: Number
      }
    ],
    dimensiones: [dimensionSchema],
    reglasPuntuacion: {
      global: {
        items: [Number],
        ranges: {
          bajo: rangeSchema,
          medio: rangeSchema,
          alto: rangeSchema
        }
      }
    },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

questionnaireSchema.index({ modulo: 1, pais: 1, version: 1 }, { unique: true });

export default mongoose.model("Questionnaire", questionnaireSchema);
