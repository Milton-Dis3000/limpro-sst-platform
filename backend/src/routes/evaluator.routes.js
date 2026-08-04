import { Router } from "express";
import { getProfile, upsertProfile, uploadProfileAsset } from "../controllers/evaluator.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(protect);
router.get("/profile", getProfile);
router.put("/profile", upsertProfile);
router.post("/profile/:type", upload.single("image"), uploadProfileAsset);

export default router;
