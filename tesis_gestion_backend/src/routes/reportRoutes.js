const express = require("express");
const reportController = require("../controllers/reportController");
const { authenticateToken, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Todas las rutas de reportes requieren ser administrador
router.use(authenticateToken, isAdmin);

// GET /api/reports/filters - Obtener roles y categorías para los filtros
router.get("/filters", reportController.getReportFilters);

// GET /api/reports/over-compliance/pdf?startDate=...&endDate=...[&roleId=...][&categoryId=...]
router.get("/over-compliance/pdf", reportController.generateOverCompliancePDF);

// GET /api/reports/over-compliance/excel?startDate=...&endDate=...[&roleId=...][&categoryId=...]
router.get(
  "/over-compliance/excel",
  reportController.generateOverComplianceExcel
);

// --- Rutas para sobrecarga docente según Resolución 32/2024 ---

// GET /api/reports/teaching-overload?startDate=...&endDate=...[&roleId=...][&categoryId=...]
router.get("/teaching-overload", reportController.getTeachingOverloadData);

// GET /api/reports/teaching-overload/pdf?startDate=...&endDate=...[&roleId=...][&categoryId=...]
router.get(
  "/teaching-overload/pdf",
  reportController.generateTeachingOverloadPDF
);

// GET /api/reports/teaching-overload/excel?startDate=...&endDate=...[&roleId=...][&categoryId=...]
router.get(
  "/teaching-overload/excel",
  reportController.generateTeachingOverloadExcel
);

module.exports = router;
