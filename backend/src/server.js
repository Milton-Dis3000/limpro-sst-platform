import app from "./app.js";
import { connectDB } from "./config/db.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => logger.info(`LIMPRO API escuchando en puerto ${PORT}`));
  })
  .catch((error) => {
    logger.error("No se pudo iniciar el servidor", { message: error.message });
    process.exit(1);
  });
