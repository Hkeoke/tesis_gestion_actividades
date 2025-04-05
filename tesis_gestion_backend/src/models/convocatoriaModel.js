const db = require("../config/db");

const convocatoriaModel = {
  /**
   * Crea una nueva convocatoria.
   * @param {string} titulo
   * @param {string} descripcion

   * @param {boolean} [publico=true] - Visibilidad de la convocatoria (usa columna existente)
   * @returns {Promise<object>} La convocatoria creada.
   */
  create: async (titulo, descripcion, publico = true) => {
    console.log("titulo", titulo);
    console.log("descripcion", descripcion);
    console.log("publico", publico);
    const query = `
      INSERT INTO convocatorias (titulo, descripcion, publico)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    try {
      const { rows } = await db.query(query, [titulo, descripcion, publico]);
      return rows[0];
    } catch (error) {
      console.error("Error creando convocatoria:", error);
      throw error;
    }
  },

  /**
   * Busca todas las convocatorias marcadas como PÚBLICAS (publico = TRUE), ordenadas por fecha.
   * @returns {Promise<Array<object>>} Lista de convocatorias públicas.
   */
  findAllPublic: async () => {
    const query = `
      SELECT id, titulo, descripcion, fecha_creacion, publico
      FROM convocatorias
      WHERE publico = TRUE
      ORDER BY fecha_creacion ASC;
    `;
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Error buscando todas las convocatorias públicas:", error);
      throw error;
    }
  },
  findAll: async () => {
    const query = `
      SELECT c.*
      FROM convocatorias c
      ORDER BY c.fecha_creacion ASC
    `;
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Error buscando todas las convocatorias:", error);
      throw error;
    }
  },

  /**
   * Busca una convocatoria por su ID. Devuelve la convocatoria independientemente de su estado 'publico'.
   * @param {number} id
   * @returns {Promise<object|null>} La convocatoria encontrada o null.
   */
  findById: async (id) => {
    const query = `
      SELECT c.*, u.nombre_usuario as admin_creador
      FROM convocatorias c
      JOIN usuarios u ON c.creado_por_admin_id = u.id
      WHERE c.id = $1;
    `;
    try {
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error buscando convocatoria con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza una convocatoria existente.
   * @param {number} id
   * @param {object} data - { titulo, descripcion, publico }
   * @returns {Promise<object|null>} La convocatoria actualizada o null si no se encontró.
   */
  update: async (id, data) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Mapear campos del objeto 'data' a columnas de la tabla
    // Asegurarse de incluir 'publico' aquí
    const allowedFields = ["titulo", "descripcion", "publico"];

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
      console.warn(`Intento de actualizar convocatoria ID ${id} sin datos.`);
      // Podríamos devolver la convocatoria existente o null/error según preferencia
      return convocatoriaModel.findById(id); // Devolver la convocatoria sin cambios
    }

    // Añadir siempre la actualización de fecha_actualizacion
    fields.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);

    // Añadir el ID como último parámetro para el WHERE
    values.push(id);
    const whereClause = `id = $${paramIndex}`;

    const query = `
      UPDATE convocatorias
      SET ${fields.join(", ")}
      WHERE ${whereClause}
      RETURNING *;
    `;
    try {
      const { rows } = await db.query(query, values);
      return rows[0] || null; // Devuelve null si el ID no existía
    } catch (error) {
      console.error(`Error actualizando convocatoria con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una convocatoria por su ID.
   * @param {number} id
   * @returns {Promise<boolean>} True si se eliminó, false si no se encontró.
   */
  delete: async (id) => {
    const query = "DELETE FROM convocatorias WHERE id = $1 RETURNING id;";
    try {
      const { rowCount } = await db.query(query, [id]);
      return rowCount > 0;
    } catch (error) {
      console.error(`Error eliminando convocatoria con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cuenta el total de convocatorias PÚBLICAS (publico = TRUE).
   * @returns {Promise<number>}
   */
  countPublic: async () => {
    const query = "SELECT COUNT(*) FROM convocatorias WHERE publico = TRUE;";
    try {
      const { rows } = await db.query(query);
      return parseInt(rows[0].count, 10);
    } catch (error) {
      console.error("Error contando convocatorias públicas:", error);
      throw error;
    }
  },

  /**
   * Cuenta el total de TODAS las convocatorias cuya fecha sea hoy o futura (para paginación de admin).
   * @returns {Promise<number>}
   */
  countAll: async () => {
    const query =
      "SELECT COUNT(*) FROM convocatorias WHERE fecha_creacion >= CURRENT_DATE;";
    try {
      const { rows } = await db.query(query);
      return parseInt(rows[0].count, 10);
    } catch (error) {
      console.error("Error contando todas las convocatorias:", error);
      throw error;
    }
  },
};

module.exports = convocatoriaModel;
