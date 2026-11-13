import { Router } from "express";
import { getAdminOverview, listUsers, updateUserAccess } from "../controllers/admin.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(protect, allowRoles("admin"));
router.get("/overview", getAdminOverview);
router.get("/users", listUsers);
router.patch("/users/:id", updateUserAccess);

export default router;
