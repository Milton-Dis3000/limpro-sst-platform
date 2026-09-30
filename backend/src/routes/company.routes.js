import { Router } from "express";
import { createCompany, deleteCompany, getCompany, listCompanies, updateCompany, uploadCompanyLogo } from "../controllers/company.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(protect);
router.get("/", listCompanies);
router.post("/", allowRoles("admin", "consultor", "empresa"), createCompany);
router.get("/:id", getCompany);
router.patch("/:id", updateCompany);
router.delete("/:id", allowRoles("admin", "consultor", "empresa"), deleteCompany);
router.post("/:id/logo", upload.single("logo"), uploadCompanyLogo);

export default router;
