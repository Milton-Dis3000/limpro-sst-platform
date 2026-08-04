import mongoose from "mongoose";
import logger from "../utils/logger.js";

export const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI no está configurado.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info("MongoDB conectado");
};
