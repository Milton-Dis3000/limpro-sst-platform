import "dotenv/config";
import { connectDB } from "../config/db.js";
import Questionnaire from "../models/Questionnaire.js";
import { psychosocialQuestionnaire } from "./psychosocialQuestionnaire.js";
import logger from "../utils/logger.js";

await connectDB();

await Questionnaire.findOneAndUpdate(
  {
    modulo: psychosocialQuestionnaire.modulo,
    pais: psychosocialQuestionnaire.pais,
    version: psychosocialQuestionnaire.version
  },
  psychosocialQuestionnaire,
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

logger.info("Cuestionario psicosocial sembrado correctamente.");
process.exit(0);
