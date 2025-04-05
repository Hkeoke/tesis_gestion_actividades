const db = require("../config/db");

const notificationModel = {
  /**
   * Crea una nueva notificación para un usuario.
   * @param {number} usuarioId
   * @param {string} mensaje
   * @param {string} [tipo] - Tipo opcional de notificación
   * @param {string} [enlace] - Enlace opcional
   * @returns {Promise<object>} La notificación creada.
   */
  create: async (usuarioId, mensaje, tipo = null, enlace = null) => {
    const query = `
      INSERT INTO notificaciones (usuario_id, mensaje, tipo, enlace)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    try {
      const { rows } = await db.query(query, [
        usuarioId,
        mensaje,
        tipo,
        enlace,
      ]);
      return rows[0];
    } catch (error) {
      console.error("Error creando notificación:", error);
      throw error;
    }
  },

  /**
   * Busca notificaciones para un usuario específico, opcionalmente filtrando por estado 'leida'.
   * @param {number} usuarioId
   * @param {boolean} [soloNoLeidas=false] - Si es true, devuelve solo las no leídas.
   * @param {number} [limit=20] - Límite de resultados.
   * @param {number} [offset=0] - Desplazamiento para paginación.
   * @returns {Promise<Array<object>>} Lista de notificaciones.
   */
  findByUserId: async (
    usuarioId,
    soloNoLeidas = false,
    limit = 20,
    offset = 0
  ) => {
    let query = `
      SELECT * FROM notificaciones
      WHERE usuario_id = $1
    `;
    const params = [usuarioId];

    if (soloNoLeidas) {
      query += " AND leida = FALSE";
    }

    query += " ORDER BY fecha_creacion DESC LIMIT $2 OFFSET $3;";
    params.push(limit, offset);

    try {
      const { rows } = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error(
        `Error buscando notificaciones para usuario ${usuarioId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Cuenta las notificaciones no leídas de un usuario.
   * @param {number} usuarioId
   * @returns {Promise<number>} Número de notificaciones no leídas.
   */
  countUnreadByUserId: async (usuarioId) => {
    const query =
      "SELECT COUNT(*) FROM notificaciones WHERE usuario_id = $1 AND leida = FALSE;";
    try {
      const { rows } = await db.query(query, [usuarioId]);
      return parseInt(rows[0].count, 10);
    } catch (error) {
      console.error(
        `Error contando notificaciones no leídas para usuario ${usuarioId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Marca una notificación específica como leída.
   * @param {number} notificationId
   * @param {number} usuarioId - Para asegurar que solo el dueño la marque.
   * @returns {Promise<boolean>} True si se marcó, false si no se encontró o no pertenece al usuario.
   */
  markAsRead: async (notificationId, usuarioId) => {
    const query = `
      UPDATE notificaciones
      SET leida = TRUE
      WHERE id = $1 AND usuario_id = $2 AND leida = FALSE
      RETURNING id;
    `;
    try {
      const { rowCount } = await db.query(query, [notificationId, usuarioId]);
      return rowCount > 0;
    } catch (error) {
      console.error(
        `Error marcando notificación ${notificationId} como leída:`,
        error
      );
      throw error;
    }
  },

  /**
   * Marca todas las notificaciones de un usuario como leídas.
   * @param {number} usuarioId
   * @returns {Promise<number>} Número de notificaciones marcadas como leídas.
   */
  markAllAsRead: async (usuarioId) => {
    const query = `
      UPDATE notificaciones
      SET leida = TRUE
      WHERE usuario_id = $1 AND leida = FALSE
      RETURNING id;
    `;
    try {
      const { rowCount } = await db.query(query, [usuarioId]);
      return rowCount;
    } catch (error) {
      console.error(
        `Error marcando todas las notificaciones como leídas para usuario ${usuarioId}:`,
        error
      );
      throw error;
    }
  },
};

module.exports = notificationModel;
