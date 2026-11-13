import { Router } from "express";
import { activateMasterAdmin, adminBootstrapStatus, login, logout, me, refresh, register } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/bootstrap-admin", activateMasterAdmin);
router.get("/bootstrap-status", adminBootstrapStatus);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, me);

export default router;
