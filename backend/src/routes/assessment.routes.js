import { Router } from "express";
import {
  createAssessment,
  deleteAssessment,
  getAssessment,
  getPublicAssessment,
  listAssessments,
  recalculateAssessment,
  submitPublicResponse,
  updateAssessment,
  uploadAssessmentEvidence
} from "../controllers/assessment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.get("/public/:token", getPublicAssessment);
router.post("/public/:token/responses", submitPublicResponse);
router.use(protect);
router.get("/", listAssessments);
router.post("/", createAssessment);
router.get("/:id", getAssessment);
router.patch("/:id", updateAssessment);
router.delete("/:id", deleteAssessment);
router.post("/:id/evidences", upload.single("file"), uploadAssessmentEvidence);
router.post("/:id/recalculate", recalculateAssessment);

export default router;
