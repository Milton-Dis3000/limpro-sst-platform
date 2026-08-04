import { Router } from "express";
import { generateExcelReport, generatePdfReport, generateWordReport, listReports } from "../controllers/report.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);
router.get("/", listReports);
router.post("/:assessmentId/pdf", generatePdfReport);
router.post("/:assessmentId/excel", generateExcelReport);
router.post("/:assessmentId/word", generateWordReport);

export default router;
