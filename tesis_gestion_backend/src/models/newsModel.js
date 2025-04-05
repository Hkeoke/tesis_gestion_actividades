const db = require("../config/db");

const newsModel = {
  /**
   * Crea una nueva noticia.
   * @param {object} newsData - Datos de la noticia { titulo, contenido, imagen_base64, creado_por_admin_id, ispublica (opcional, default true), publicada (opcional, default true) }
   * @returns {Promise<object>} La noticia creada.
   */
  create: async (newsData) => {
    const {
      titulo,
      contenido,
      imagen_base64,
      creado_por_admin_id,
      ispublica = true,
      publicada = true,
    } = newsData;

    const query = `
      INSERT INTO noticias (titulo, contenido, imagen_base64, creado_por_admin_id, ispublica, publicada)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    try {
      const { rows } = await db.query(query, [
        titulo,
        contenido,
        imagen_base64,
        creado_por_admin_id,
        ispublica,
        publicada,
      ]);
      return rows[0];
    } catch (error) {
      console.error("Error creando noticia:", error);
      throw error;
    }
  },

  /**
   * Busca todas las noticias marcadas como publicadas (publicada = TRUE), ordenadas por fecha.
   * Permite paginación. Incluye datos del admin creador.
   * @param {number} [limit=10]
   * @param {number} [offset=0]
   * @returns {Promise<Array<object>>} Lista de noticias publicadas.
   */
  findAllPublished: async (limit = 10, offset = 0) => {
    const query = `
      SELECT n.id, n.titulo, n.contenido, n.imagen_base64, n.fecha_creacion, n.ispublica,
             u.nombre as admin_nombre, u.apellidos as admin_apellidos
      FROM noticias n
      JOIN usuarios u ON n.creado_por_admin_id = u.id
      WHERE n.publicada = TRUE
      ORDER BY n.fecha_creacion DESC
      LIMIT $1 OFFSET $2;
    `;
    try {
      const { rows } = await db.query(query, [limit, offset]);
      return rows;
    } catch (error) {
      console.error("Error buscando todas las noticias publicadas:", error);
      throw error;
    }
  },

  /**
   * Busca TODAS las noticias (publicadas o no), ordenadas por fecha.
   * Útil para el panel de administración. Permite paginación. Incluye datos del admin creador.
   * @param {number} [limit=10]
   * @param {number} [offset=0]
   * @returns {Promise<Array<object>>} Lista de todas las noticias.
   */
  findAll: async (limit = 10, offset = 0) => {
    const query = `
      SELECT n.*,
             u.nombre as admin_nombre, u.apellidos as admin_apellidos
      FROM noticias n
      JOIN usuarios u ON n.creado_por_admin_id = u.id
      ORDER BY n.fecha_creacion DESC
      LIMIT $1 OFFSET $2;
    `;
    try {
      const { rows } = await db.query(query, [limit, offset]);
      return rows;
    } catch (error) {
      console.error("Error buscando todas las noticias (admin):", error);
      throw error;
    }
  },

  /**
   * Busca una noticia por su ID (incluyendo datos del admin creador).
   * @param {number} id
   * @returns {Promise<object|null>} La noticia encontrada o null.
   */
  findById: async (id) => {
    const query = `
      SELECT n.*, u.nombre_usuario as admin_creador_username, u.nombre as admin_nombre, u.apellidos as admin_apellidos
      FROM noticias n
      JOIN usuarios u ON n.creado_por_admin_id = u.id
      WHERE n.id = $1;
    `;
    try {
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error buscando noticia con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza una noticia existente.
   * @param {number} id
   * @param {object} data - { titulo?, contenido?, imagen_base64?, ispublica?, publicada? } Al menos un campo debe estar presente.
   * @returns {Promise<object|null>} La noticia actualizada o null si no se encontró.
   */
  update: async (id, data) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (data.titulo !== undefined) {
      fields.push(`titulo = $${paramIndex++}`);
      values.push(data.titulo);
    }
    if (data.contenido !== undefined) {
      fields.push(`contenido = $${paramIndex++}`);
      values.push(data.contenido);
    }
    if (data.imagen_base64 !== undefined) {
      fields.push(`imagen_base64 = $${paramIndex++}`);
      values.push(data.imagen_base64);
    }
    if (data.ispublica !== undefined) {
      fields.push(`ispublica = $${paramIndex++}`);
      values.push(data.ispublica);
    }
    if (data.publicada !== undefined) {
      fields.push(`publicada = $${paramIndex++}`);
      values.push(data.publicada);
    }

    if (fields.length === 0) {
      console.warn(`Intento de actualizar noticia ID ${id} sin datos.`);
      return newsModel.findById(id);
    }

    fields.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);

    values.push(id);

    const query = `
      UPDATE noticias
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    try {
      const { rows } = await db.query(query, values);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error actualizando noticia con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una noticia por su ID.
   * @param {number} id
   * @returns {Promise<object|null>} La noticia eliminada (para obtener imagen_base64) o null.
   */
  delete: async (id) => {
    const query =
      "DELETE FROM noticias WHERE id = $1 RETURNING id, imagen_base64;";
    try {
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error eliminando noticia con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cuenta el total de noticias publicadas (publicada = TRUE).
   * @returns {Promise<number>}
   */
  countPublished: async () => {
    const query = "SELECT COUNT(*) FROM noticias WHERE publicada = TRUE;";
    try {
      const { rows } = await db.query(query);
      return parseInt(rows[0].count, 10);
    } catch (error) {
      console.error("Error contando noticias publicadas:", error);
      throw error;
    }
  },

  /**
   * Cuenta el total de TODAS las noticias.
   * Útil para la paginación en el panel de administración.
   * @returns {Promise<number>}
   */
  countAll: async () => {
    const query = "SELECT COUNT(*) FROM noticias;";
    try {
      const { rows } = await db.query(query);
      return parseInt(rows[0].count, 10);
    } catch (error) {
      console.error("Error contando todas las noticias (admin):", error);
      throw error;
    }
  },
};

module.exports = newsModel;
