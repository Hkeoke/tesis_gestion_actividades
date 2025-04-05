const db = require("../config/db");

const eventModel = {
  /**
   * Crea un nuevo evento.
   * @param {string} titulo
   * @param {string} descripcion
   * @param {string} fecha_evento - Formato ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
   * @param {string} ubicacion
   * @param {number} creado_por_admin_id
   * @param {boolean} [publico=true] - Visibilidad del evento (usa columna existente)
   * @returns {Promise<object>} El evento creado.
   */
  create: async (
    titulo,
    descripcion,
    fecha_evento,
    ubicacion,
    creado_por_admin_id,
    publico = true
  ) => {
    const query = `
      INSERT INTO eventos (titulo, descripcion, fecha_evento, ubicacion, creado_por_admin_id, publico)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    try {
      const { rows } = await db.query(query, [
        titulo,
        descripcion,
        fecha_evento,
        ubicacion,
        creado_por_admin_id,
        publico,
      ]);
      return rows[0];
    } catch (error) {
      console.error("Error creando evento:", error);
      throw error;
    }
  },

  /**
   * Busca todos los eventos marcados como PÚBLICOS (publico = TRUE), ordenados por fecha.
   * Permite paginación.
   * @param {number} [limit=10]
   * @param {number} [offset=0]
   * @returns {Promise<Array<object>>} Lista de eventos públicos.
   */
  findAllPublic: async () => {
    const query = `
      SELECT id, titulo, descripcion, fecha_evento, ubicacion, fecha_creacion, publico
      FROM eventos
      WHERE publico = TRUE
      ORDER BY fecha_evento ASC
      LIMIT $1 OFFSET $2;
    `;
    try {
      const { rows } = await db.query(query, [limit, offset]);
      return rows;
    } catch (error) {
      console.error("Error buscando todos los eventos públicos:", error);
      throw error;
    }
  },

  /**
   * Busca TODOS los eventos (públicos o no) cuya fecha sea hoy o futura,
   * ordenados por fecha. Útil para el panel de administración. Permite paginación.
   * @param {number} [limit=10]
   * @param {number} [offset=0]
   * @returns {Promise<Array<object>>} Lista de todos los eventos futuros o de hoy.
   */
  findAll: async () => {
    const query = `
      SELECT e.*
      FROM eventos e
      WHERE e.fecha_evento >= CURRENT_DATE
      ORDER BY e.fecha_evento ASC
    `;
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error(
        "Error buscando todos los eventos futuros/hoy (admin):",
        error
      );
      throw error;
    }
  },

  /**
   * Busca un evento por su ID. Devuelve el evento independientemente de su estado 'publico'.
   * @param {number} id
   * @returns {Promise<object|null>} El evento encontrado o null.
   */
  findById: async (id) => {
    const query = `
      SELECT e.*, u.nombre_usuario as admin_creador
      FROM eventos e
      JOIN usuarios u ON e.creado_por_admin_id = u.id
      WHERE e.id = $1;
    `;
    try {
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error buscando evento con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza un evento existente.
   * @param {number} id
   * @param {object} data - { titulo, descripcion, fecha_evento, ubicacion, publico }
   * @returns {Promise<object|null>} El evento actualizado o null si no se encontró.
   */
  update: async (id, data) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Mapear campos del objeto 'data' a columnas de la tabla
    // Asegurarse de incluir 'publico' aquí
    const allowedFields = [
      "titulo",
      "descripcion",
      "fecha_evento",
      "ubicacion",
      "publico",
    ];

    allowedFields.forEach((field) => {
      // Verificar si el campo existe en 'data' (incluso si es false o null)
      // Usamos hasOwnProperty para asegurarnos de que el campo fue explícitamente enviado
      if (data.hasOwnProperty(field)) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(data[field]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      console.warn(`Intento de actualizar evento ID ${id} sin datos.`);
      // Podríamos devolver el evento existente o null/error según preferencia
      return eventModel.findById(id); // Devolver el evento sin cambios
    }

    // Añadir siempre la actualización de fecha_actualizacion
    fields.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);

    // Añadir el ID como último parámetro para el WHERE
    values.push(id);
    const whereClause = `id = $${paramIndex}`;

    const query = `
      UPDATE eventos
      SET ${fields.join(", ")}
      WHERE ${whereClause}
      RETURNING *;
    `;
    try {
      const { rows } = await db.query(query, values);
      return rows[0] || null; // Devuelve null si el ID no existía
    } catch (error) {
      console.error(`Error actualizando evento con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un evento por su ID.
   * @param {number} id
   * @returns {Promise<boolean>} True si se eliminó, false si no se encontró.
   */
  delete: async (id) => {
    const query = "DELETE FROM eventos WHERE id = $1 RETURNING id;";
    try {
      const { rowCount } = await db.query(query, [id]);
      return rowCount > 0;
    } catch (error) {
      console.error(`Error eliminando evento con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cuenta el total de eventos PÚBLICOS (publico = TRUE).
   * @returns {Promise<number>}
   */
  countPublic: async () => {
    const query = "SELECT COUNT(*) FROM eventos WHERE publico = TRUE;";
    try {
      const { rows } = await db.query(query);
      return parseInt(rows[0].count, 10);
    } catch (error) {
      console.error("Error contando eventos públicos:", error);
      throw error;
    }
  },

  /**
   * Cuenta el total de TODOS los eventos cuya fecha sea hoy o futura (para paginación de admin).
   * @returns {Promise<number>}
   */
  countAll: async () => {
    const query =
      "SELECT COUNT(*) FROM eventos WHERE fecha_evento >= CURRENT_DATE;";
    try {
      const { rows } = await db.query(query);
      return parseInt(rows[0].count, 10);
    } catch (error) {
      console.error("Error contando todos los eventos futuros/hoy:", error);
      throw error;
    }
  },
};

module.exports = eventModel;
