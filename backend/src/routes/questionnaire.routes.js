import { Router } from "express";
import { getQuestionnaire, listQuestionnaires } from "../controllers/questionnaire.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", protect, listQuestionnaires);
router.get("/:id", protect, getQuestionnaire);

export default router;
