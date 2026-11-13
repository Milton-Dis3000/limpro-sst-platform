import { Router } from "express";
import { downloadStoredReport, generateExcelReport, generatePdfReport, generateWordReport, listReports } from "../controllers/report.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(protect, allowRoles("admin", "consultor"));
router.get("/", listReports);
router.get("/:id/download", downloadStoredReport);
router.post("/:assessmentId/pdf", generatePdfReport);
router.post("/:assessmentId/excel", generateExcelReport);
router.post("/:assessmentId/word", generateWordReport);

export default router;
