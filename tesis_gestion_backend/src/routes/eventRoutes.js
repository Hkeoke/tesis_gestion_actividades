const express = require("express");
const eventController = require("../controllers/eventController");
const adminController = require("../controllers/adminController");
const { authenticateToken, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(authenticateToken);

// --- Rutas Públicas ---
// GET /api/events?page=1&limit=10 - Listar eventos paginados
router.get("/", eventController.listEvents);
router.get("/members-paid", adminController.listMembersPaid);
// GET /api/events/:eventId - Obtener detalles de un evento
router.get("/:eventId", eventController.getEventDetails);

// --- Rutas de Administración (requieren token y rol de admin) ---
// POST /api/events - Crear un nuevo evento
router.post("/", isAdmin, eventController.createEvent);

// PUT /api/events/:eventId - Actualizar un evento
router.put(
  "/:eventId",

  isAdmin,
  eventController.updateEvent
);

// DELETE /api/events/:eventId - Eliminar un evento
router.delete(
  "/:eventId",

  isAdmin,
  eventController.deleteEvent
);

module.exports = router;
