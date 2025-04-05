const notificationModel = require("../models/notificationModel");
const Joi = require("joi");

// Esquema para query params de paginación y filtro
const getNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20), // Límite máximo de 100
  unreadOnly: Joi.boolean().default(false),
});

const notificationController = {
  /**
   * Obtiene las notificaciones del usuario autenticado (paginado).
   */
  getMyNotifications: async (req, res) => {
    const usuarioId = req.user.id;
    const { error, value } = getNotificationsSchema.validate(req.query);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { page, limit, unreadOnly } = value;
    const offset = (page - 1) * limit;

    try {
      const [notifications, totalUnread] = await Promise.all([
        notificationModel.findByUserId(usuarioId, unreadOnly, limit, offset),
        notificationModel.countUnreadByUserId(usuarioId), // Contar siempre las no leídas totales
      ]);

      // Podríamos calcular el total de páginas si es necesario para el frontend
      // const totalItems = await notificationModel.countByUserId(usuarioId, unreadOnly); // Necesitaría nueva función en model
      // const totalPages = Math.ceil(totalItems / limit);

      res.status(200).json({
        notifications,
        currentPage: page,
        limit,
        unreadCount: totalUnread, // Número total de no leídas para el badge
        // totalPages: totalPages // Opcional
      });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener las notificaciones." });
    }
  },

  /**
   * Marca una notificación específica como leída.
   */
  markNotificationAsRead: async (req, res) => {
    const usuarioId = req.user.id;
    const { notificationId } = req.params;
    const idNotificacion = parseInt(notificationId, 10);

    if (isNaN(idNotificacion)) {
      return res.status(400).json({ message: "ID de notificación inválido." });
    }

    try {
      const marked = await notificationModel.markAsRead(
        idNotificacion,
        usuarioId
      );
      if (marked) {
        res.status(200).json({ message: "Notificación marcada como leída." });
      } else {
        // No encontrada o no pertenece al usuario o ya estaba leída
        res
          .status(404)
          .json({ message: "Notificación no encontrada o ya leída." });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error al marcar la notificación como leída." });
    }
  },

  /**
   * Marca todas las notificaciones del usuario como leídas.
   */
  markAllMyNotificationsAsRead: async (req, res) => {
    const usuarioId = req.user.id;
    try {
      const count = await notificationModel.markAllAsRead(usuarioId);
      res
        .status(200)
        .json({ message: `${count} notificaciones marcadas como leídas.` });
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error al marcar todas las notificaciones como leídas.",
        });
    }
  },
};

module.exports = notificationController;
