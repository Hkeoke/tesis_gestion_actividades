const db = require("../config/db");

const categoryModel = {
  /**
   * Encuentra todas las categorías.
   * @returns {Promise<Array<object>>} Lista de categorías.
   */
  findAll: async () => {
    const query = "SELECT * FROM categorias ORDER BY nombre ASC";
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Error en categoryModel.findAll:", error);
      throw error;
    }
  },

  /**
   * Encuentra una categoría por su ID.
   * @param {number} id - ID de la categoría.
   * @returns {Promise<object|null>} La categoría o null si no se encuentra.
   */
  findById: async (id) => {
    const query = "SELECT * FROM categorias WHERE id = $1";
    try {
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error en categoryModel.findById (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * Encuentra una categoría por su nombre (útil para evitar duplicados).
   * @param {string} nombre - Nombre de la categoría.
   * @returns {Promise<object|null>} La categoría o null si no se encuentra.
   */
  findByName: async (nombre) => {
    const query = "SELECT * FROM categorias WHERE nombre = $1";
    try {
      const { rows } = await db.query(query, [nombre]);
      return rows[0] || null;
    } catch (error) {
      console.error(
        `Error en categoryModel.findByName (Nombre: ${nombre}):`,
        error
      );
      throw error;
    }
  },

  /**
   * Crea una nueva categoría.
   * @param {object} categoryData - Datos de la categoría { nombre, horas_norma_semanal }.
   * @returns {Promise<object>} La categoría creada.
   */
  create: async (categoryData) => {
    const { nombre, horas_norma_semanal } = categoryData;
    // Verificar si ya existe por nombre
    const existing = await categoryModel.findByName(nombre);
    if (existing) {
      const error = new Error(`La categoría '${nombre}' ya existe.`);
      error.code = "DUPLICATE_ENTRY"; // Código personalizado para identificar el error
      throw error;
    }

    const query = `
      INSERT INTO categorias (nombre, horas_norma_semanal)
      VALUES ($1, $2)
      RETURNING *;
    `;
    try {
      const { rows } = await db.query(query, [nombre, horas_norma_semanal]);
      return rows[0];
    } catch (error) {
      console.error("Error en categoryModel.create:", error);
      throw error;
    }
  },

  /**
   * Actualiza una categoría existente.
   * @param {number} id - ID de la categoría a actualizar.
   * @param {object} categoryData - Datos a actualizar { nombre, horas_norma_semanal }.
   * @returns {Promise<object|null>} La categoría actualizada o null si no se encontró.
   */
  update: async (id, categoryData) => {
    const { nombre, horas_norma_semanal } = categoryData;

    // Verificar si el nuevo nombre ya existe en OTRA categoría
    if (nombre) {
      const existing = await categoryModel.findByName(nombre);
      if (existing && existing.id !== id) {
        const error = new Error(
          `El nombre de categoría '${nombre}' ya está en uso por otra categoría.`
        );
        error.code = "DUPLICATE_ENTRY";
        throw error;
      }
    }

    // Construir la consulta dinámicamente para actualizar solo los campos proporcionados
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      fields.push(`nombre = $${paramIndex++}`);
      values.push(nombre);
    }
    if (horas_norma_semanal !== undefined) {
      fields.push(`horas_norma_semanal = $${paramIndex++}`);
      values.push(horas_norma_semanal);
    }

    if (fields.length === 0) {
      // No hay nada que actualizar, devolver la categoría existente
      return categoryModel.findById(id);
    }

    // Añadir el ID como último parámetro para el WHERE
    values.push(id);

    const query = `
      UPDATE categorias
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    try {
      const { rows } = await db.query(query, values);
      return rows[0] || null; // Devuelve null si el ID no existía
    } catch (error) {
      console.error(`Error en categoryModel.update (ID: ${id}):`, error);
      // Podría haber un error de constraint si se intenta poner un nombre duplicado (aunque ya lo validamos)
      throw error;
    }
  },

  /**
   * Elimina una categoría por su ID.
   * @param {number} id - ID de la categoría a eliminar.
   * @returns {Promise<boolean>} True si se eliminó, false si no se encontró.
   */
  delete: async (id) => {
    const query = "DELETE FROM categorias WHERE id = $1 RETURNING id;";
    try {
      const { rowCount } = await db.query(query, [id]);
      return rowCount > 0;
    } catch (error) {
      console.error(`Error en categoryModel.delete (ID: ${id}):`, error);
      // Capturar error de FK si la categoría está en uso
      if (error.code === "23503") {
        // Código de error de FK violation en PostgreSQL
        const customError = new Error(
          "No se puede eliminar la categoría porque está asignada a uno o más usuarios o solicitudes."
        );
        customError.code = "FK_VIOLATION";
        throw customError;
      }
      throw error;
    }
  },
};

module.exports = categoryModel;
