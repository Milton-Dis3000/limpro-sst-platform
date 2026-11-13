import { Router } from "express";
import { getProfile, upsertProfile, uploadProfileAsset } from "../controllers/evaluator.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(protect, allowRoles("admin", "consultor"));
router.get("/profile", getProfile);
router.put("/profile", upsertProfile);
router.post("/profile/:type", upload.single("image"), uploadProfileAsset);

export default router;
