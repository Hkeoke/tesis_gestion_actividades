const express = require("express");
const notificationController = require("../controllers/notificationController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Todas las rutas aquí requieren autenticación
router.use(authenticateToken);

// GET /api/notifications?page=1&limit=10&unreadOnly=true - Obtener mis notificaciones
router.get("/", notificationController.getMyNotifications);

// PUT /api/notifications/mark-all-read - Marcar todas como leídas
router.put(
  "/mark-all-read",
  notificationController.markAllMyNotificationsAsRead
);

// PUT /api/notifications/:notificationId/mark-read - Marcar una específica como leída
router.put(
  "/:notificationId/mark-read",
  notificationController.markNotificationAsRead
);

module.exports = router;
