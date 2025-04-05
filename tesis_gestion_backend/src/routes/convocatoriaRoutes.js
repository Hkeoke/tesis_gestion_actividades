const express = require("express");
const convocatoriaController = require("../controllers/convocatoriaController");
const { authenticateToken, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(authenticateToken);

// --- Rutas Públicas ---
// GET /api/events?page=1&limit=10 - Listar eventos paginados
router.get("/", convocatoriaController.listEvents);

// GET /api/events/:eventId - Obtener detalles de un evento
router.get("/:convocatoriaId", convocatoriaController.getConvocatoriaDetails);

// --- Rutas de Administración (requieren token y rol de admin) ---
// POST /api/events - Crear un nuevo evento
router.post("/", isAdmin, convocatoriaController.createConvocatoria);

// PUT /api/events/:eventId - Actualizar un evento
router.put(
  "/:convocatoriaId",

  isAdmin,
  convocatoriaController.updateConvocatoria
);

// DELETE /api/events/:eventId - Eliminar un evento
router.delete(
  "/:convocatoriaId",

  isAdmin,
  convocatoriaController.deleteConvocatoria
);

module.exports = router;
