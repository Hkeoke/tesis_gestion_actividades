const db = require("../config/db");

const roleModel = {
  /**
   * Encuentra todos los roles.
   * @returns {Promise<Array<object>>} Lista de roles [{ id, nombre }, ...]
   */
  findAll: async () => {
    const query = "SELECT id, nombre FROM roles ORDER BY nombre";
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Error finding all roles:", error);
      throw error; // Re-lanzar para manejo superior
    }
  },

  /**
   * Encuentra un rol por su ID.
   * @param {number} id - ID del rol.
   * @returns {Promise<object|null>} Objeto del rol o null si no se encuentra.
   */
  findById: async (id) => {
    const query = "SELECT id, nombre FROM roles WHERE id = $1";
    try {
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error finding role by id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Encuentra un rol por su nombre.
   * @param {string} nombre - Nombre del rol.
   * @returns {Promise<object|null>} Objeto del rol o null si no se encuentra.
   */
  findByName: async (nombre) => {
    const query = "SELECT id, nombre FROM roles WHERE nombre = $1";
    try {
      const { rows } = await db.query(query, [nombre]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error finding role by name ${nombre}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo rol.
   * @param {object} roleData - { nombre }
   * @returns {Promise<object>} El rol creado.
   */
  create: async ({ nombr }) => {
    const query = "INSERT INTO roles (nombre) VALUES ($1) RETURNING id, nombre";
    try {
      const { rows } = await db.query(query, [nombre]);
      return rows[0];
    } catch (error) {
      console.error("Error creating role:", error);
      // Podrías añadir manejo específico para errores de constraint (ej. nombre duplicado)
      if (error.code === "23505") {
        // Código de violación de unicidad en PostgreSQL
        throw new Error(`El rol con nombre '${nombre}' ya existe.`);
      }
      throw error;
    }
  },

  /**
   * Actualiza un rol existente.
   * @param {number} id - ID del rol a actualizar.
   * @param {object} roleData - { nombre } (campos a actualizar)
   * @returns {Promise<object|null>} El rol actualizado o null si no se encontró.
   */
  update: async (id, { nombre }) => {
    // Construir la consulta dinámicamente es más complejo y propenso a errores.
    // Es más simple requerir ambos campos o actualizar todo.
    // Aquí asumimos que se actualizan ambos.
    const query =
      "UPDATE roles SET nombre = $1 WHERE id = $2 RETURNING id, nombre";
    try {
      const { rows } = await db.query(query, [nombre, id]);
      return rows[0] || null; // Devuelve null si el ID no existía
    } catch (error) {
      console.error(`Error updating role ${id}:`, error);
      if (error.code === "23505") {
        throw new Error(
          `El nombre de rol '${nombre}' ya está en uso por otro rol.`
        );
      }
      throw error;
    }
  },

  /**
   * Elimina un rol por su ID.
   * ¡Precaución! Asegúrate de manejar qué pasa con los usuarios que tienen este rol.
   * Podrías impedir eliminar roles en uso o reasignar usuarios a un rol por defecto.
   * @param {number} id - ID del rol a eliminar.
   * @returns {Promise<boolean>} True si se eliminó, false en caso contrario.
   */
  deleteById: async (id) => {
    // ANTES de eliminar, verificar si algún usuario tiene este rol_id
    const checkUsageQuery = "SELECT COUNT(*) FROM usuarios WHERE rol_id = $1";
    const deleteQuery = "DELETE FROM roles WHERE id = $1 RETURNING id";
    try {
      const usageResult = await db.query(checkUsageQuery, [id]);
      if (parseInt(usageResult.rows[0].count, 10) > 0) {
        throw new Error(
          `No se puede eliminar el rol ID ${id} porque está asignado a uno o más usuarios.`
        );
      }

      // Si no está en uso, proceder a eliminar
      const { rowCount } = await db.query(deleteQuery, [id]);
      return rowCount > 0;
    } catch (error) {
      console.error(`Error deleting role ${id}:`, error);
      // Re-lanzar el error específico de uso si fue ese
      if (error.message.includes("asignado a uno o más usuarios")) {
        throw error;
      }
      throw new Error(`Error interno al intentar eliminar el rol ${id}.`); // Error genérico para otros casos
    }
  },
};

module.exports = roleModel;
