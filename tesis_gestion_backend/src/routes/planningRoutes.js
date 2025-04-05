const express = require("express");
const planningController = require("../controllers/planningController");
const { authenticateToken } = require("../middlewares/authMiddleware");
// Podríamos añadir middlewares específicos si ciertas acciones solo las hacen profesores, etc.

const router = express.Router();

// Rutas públicas o semi-públicas (podrían requerir solo autenticación básica)
router.get(
  "/activity-types",
  authenticateToken,
  planningController.listActivityTypes
);

// Rutas que requieren que el usuario esté autenticado para operar sobre su propio plan
router.use(authenticateToken);

router.post("/activities", planningController.createActivity);
router.get("/activities", planningController.getPlan); // Requiere startDate y endDate como query params
router.get("/activities/summary", planningController.getPlanSummary); // Requiere startDate y endDate como query params
router.put("/activities/:activityId", planningController.editActivity);
router.delete("/activities/:activityId", planningController.removeActivity);

// --- Posibles rutas para Administradores (irían en adminRoutes.js) ---
// GET /api/admin/planning/users/:userId/activities?startDate=...&endDate=...
// GET /api/admin/planning/users/:userId/summary?startDate=...&endDate=...

module.exports = router;
