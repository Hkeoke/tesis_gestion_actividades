const notificationModel = require("../models/notificationModel");

const notificationService = {
  /**
   * Notifica a un usuario que su cuenta ha sido aprobada.
   * @param {number} usuarioId
   */
  notifyUserApproved: async (usuarioId) => {
    const mensaje = "¡Tu cuenta ha sido aprobada! Ya puedes iniciar sesión.";
    try {
      await notificationModel.create(usuarioId, mensaje, "aprobacion_usuario");
      console.log(`Notificación de aprobación enviada al usuario ${usuarioId}`);
    } catch (error) {
      console.error(
        `Error al crear notificación de aprobación para usuario ${usuarioId}:`,
        error
      );
      // Considerar añadir un reintento o logging más robusto aquí
    }
  },

  /**
   * Notifica a un usuario sobre la revisión de su solicitud de cambio de categoría.
   * @param {number} usuarioId
   * @param {number} solicitudId
   * @param {string} estado - 'Aprobada' o 'Rechazada'
   * @param {string|null} [observaciones] - Observaciones del admin si fue rechazada.
   */
  notifyCategoryRequestReviewed: async (
    usuarioId,
    solicitudId,
    estado,
    observaciones = null
  ) => {
    let mensaje = `Tu solicitud de cambio de categoría (ID: ${solicitudId}) ha sido ${estado}.`;
    if (estado === "Rechazada" && observaciones) {
      mensaje += ` Observaciones: ${observaciones}`;
    }
    // Enlace relativo que el frontend puede usar para redirigir
    const enlace = `/professor/category-requests`; // O un enlace más específico si existe

    try {
      await notificationModel.create(
        usuarioId,
        mensaje,
        "revision_solicitud",
        enlace
      );
      console.log(
        `Notificación de revisión de solicitud ${solicitudId} enviada al usuario ${usuarioId}`
      );
    } catch (error) {
      console.error(
        `Error al crear notificación de revisión de solicitud ${solicitudId} para usuario ${usuarioId}:`,
        error
      );
    }
  },

  // --- Añadir aquí más funciones para otros tipos de notificaciones ---
  // notifyNewEvent(eventId, eventTitle) -> para todos los usuarios o por rol/categoría
  // notifySystemMessage(message) -> para todos los usuarios
};

module.exports = notificationService;
