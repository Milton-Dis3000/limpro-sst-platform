import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import evaluatorRoutes from "./routes/evaluator.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import questionnaireRoutes from "./routes/questionnaire.routes.js";
import reportRoutes from "./routes/report.routes.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => res.json({ ok: true, service: "LIMPRO API" }));
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/evaluator", evaluatorRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/questionnaires", questionnaireRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
