const db = require("../config/db");
const { hashPassword } = require("../utils/helpers");
const bcrypt = require("bcrypt");

const userModel = {
  /**
   * Busca un usuario por su nombre de usuario, incluyendo detalles de rol, categoría y subcategoría admin.
   * @param {string} nombreUsuario
   * @returns {Promise<object|null>} Datos del usuario o null si no se encuentra.
   */
  findByUsername: async (nombreUsuario) => {
    const query = `
      SELECT
        u.*,                                      -- Selecciona todas las columnas de usuarios (incluye aprobado, miembro_sociedad)
        r.nombre AS nombre_rol,                   -- Nombre del rol
        c.nombre AS nombre_categoria,             -- Nombre de la categoría docente (puede ser NULL)
        sa.nombre AS nombre_subcategoria_admin    -- Nombre de la subcategoría admin (puede ser NULL)
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN categorias c ON u.categoria_id = c.id -- LEFT JOIN por si no tiene categoría
      LEFT JOIN subcategorias_admin sa ON u.subcategoria_admin_id = sa.id -- LEFT JOIN por si no es admin o no tiene subcategoría
      WHERE u.nombre_usuario = $1;
    `;
    try {
      const { rows } = await db.query(query, [nombreUsuario]);
      // Devolver el primer resultado o null si no se encontró
      return rows[0] || null;
    } catch (error) {
      console.error("Error en findByUsername:", error);
      throw error; // Re-lanzar para manejo en el controlador
    }
  },

  /**
   * Busca un usuario por su ID.
   * @param {number} id
   * @returns {Promise<object|null>} Datos del usuario o null si no se encuentra.
   */
  findById: async (id) => {
    const query = `
      SELECT u.id, u.nombre_usuario, u.email, u.nombre, u.apellidos, u.rol_id, u.categoria_id, u.subcategoria_admin_id, u.aprobado, u.cotizo, u.miembro_sociedad, r.nombre as nombre_rol
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `;
    try {
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error("Error en findById:", error);
      throw error;
    }
  },

  /**
   * Crea un nuevo usuario y registra la solicitud de aprobación.
   * @param {object} userData Datos del usuario (nombre_usuario, email, password, nombre, apellidos, rol_id, categoria_id, subcategoria_admin_id)
   * @returns {Promise<object>} Datos del usuario creado (sin contraseña).
   */
  create: async (userData) => {
    const {
      nombre_usuario,
      email,
      password,
      nombre,
      apellidos,
      rol_id,
      categoria_id,
      subcategoria_admin_id,
    } = userData;
    const hashedPassword = await hashPassword(password);

    // Usar una transacción para asegurar atomicidad
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Insertar usuario
      const insertUserQuery = `
        INSERT INTO usuarios (nombre_usuario, email, password_hash, nombre, apellidos, rol_id, categoria_id, subcategoria_admin_id, aprobado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
        RETURNING id, nombre_usuario, email, nombre, apellidos, rol_id, categoria_id, subcategoria_admin_id, aprobado, fecha_creacion;
      `;
      const userResult = await client.query(insertUserQuery, [
        nombre_usuario,
        email,
        hashedPassword,
        nombre,
        apellidos,
        rol_id,
        categoria_id,
        subcategoria_admin_id ? subcategoria_admin_id : null,
      ]);
      const nuevoUsuario = userResult.rows[0];

      await client.query("COMMIT");
      return nuevoUsuario;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error en create user:", error);
      // Manejar errores específicos (ej. usuario duplicado)
      if (error.code === "23505") {
        // Código de error de violación de unicidad en PostgreSQL
        if (error.constraint === "usuarios_nombre_usuario_key") {
          throw new Error("El nombre de usuario ya existe.");
        }
        if (error.constraint === "usuarios_email_key") {
          throw new Error("El correo electrónico ya está registrado.");
        }
      }
      throw error; // Re-lanzar otros errores
    } finally {
      client.release(); // Liberar la conexión al pool
    }
  },

  /**
   * Aprueba un usuario pendiente.
   * @param {number} userId ID del usuario a aprobar.
   * @returns {Promise<boolean>} True si se aprobó, false si no se encontró o ya estaba aprobado.
   */
  approveUser: async (userId) => {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Actualizar estado del usuario
      const updateUserQuery = `
              UPDATE usuarios SET aprobado = TRUE
              WHERE id = $1 AND aprobado = FALSE
              RETURNING id;
          `;
      const updateResult = await client.query(updateUserQuery, [userId]);

      if (updateResult.rowCount === 0) {
        // El usuario no existe o ya estaba aprobado
        await client.query("ROLLBACK");
        return false;
      }

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error en approveUser:", error);
      throw error;
    } finally {
      client.release();
    }
  },
  cotizarUser: async (userId) => {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Consulta única para invertir (toggle) el valor booleano de cotizo
      const updateUserQuery = `
        UPDATE usuarios
        SET cotizo = NOT cotizo
        WHERE id = $1
        RETURNING id, cotizo, miembro_sociedad; -- Devolvemos datos útiles
      `;
      const updateResult = await client.query(updateUserQuery, [userId]);

      if (updateResult.rowCount === 0) {
        // El usuario no existe
        await client.query("ROLLBACK");
        console.warn(
          `Intento de actualizar cotización para usuario inexistente: ${userId}`
        );
        return null; // Indicar que no se encontró/actualizó
      }

      await client.query("COMMIT");
      // Devolvemos el usuario actualizado (o al menos la info relevante)
      return updateResult.rows[0]; // Devuelve { id, cotizo, miembro_sociedad }
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`Error en cotizarUser para usuario ${userId}:`, error);
      throw error; // Re-lanzar para manejo en el controlador
    } finally {
      client.release();
    }
  },
  hacerMiembroSociedad: async (userId) => {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Actualizar estado del usuario
      const updateUserQuery = `
              UPDATE usuarios SET miembro_sociedad = TRUE
              WHERE id = $1 AND miembro_sociedad = FALSE
              RETURNING id;
          `;
      const updateResult = await client.query(updateUserQuery, [userId]);

      if (updateResult.rowCount === 0) {
        // El usuario no existe o ya ES miembro de la sociedad
        await client.query("ROLLBACK");
        return false;
      }

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error en approveUser:", error);
      throw error;
    } finally {
      client.release();
    }
  },
  // --- Añadir aquí más funciones según sea necesario ---
  // findPendingRegistrations, findAll, update, delete, etc.
  findPendingRegistrations: async () => {
    const query = `
      SELECT
        u.id,
        u.nombre_usuario,
        u.email,
        u.nombre,
        u.apellidos,
        u.fecha_creacion,
        r.nombre AS nombre_rol,           -- Nombre del rol
        c.nombre AS nombre_categoria      -- Nombre de la categoría (puede ser NULL)
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id     -- Unimos con la tabla roles
      LEFT JOIN categorias c ON u.categoria_id = c.id -- Unimos con categorias (LEFT JOIN por si es NULL)
      WHERE u.aprobado = FALSE
      ORDER BY u.fecha_creacion DESC;
    `;
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Error en findPendingRegistrations:", error);
      throw error; // Re-lanzar para manejo en el controlador
    }
  },

  /**
   * Encuentra todos los usuarios con detalles de rol y categoría.
   * @returns {Promise<Array<object>>} Lista de usuarios con detalles.
   */
  findAllWithDetails: async () => {
    const query = `
      SELECT
        u.id, u.nombre_usuario, u.email, u.nombre, u.apellidos, u.aprobado, u.fecha_creacion,u.cotizo,u.miembro_sociedad,
        r.id as rol_id, r.nombre as rol_nombre,
        c.id as categoria_id, c.nombre as categoria_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN categorias c ON u.categoria_id = c.id
      WHERE u.aprobado = TRUE
      ORDER BY u.nombre, u.apellidos;
    `;
    try {
      const { rows } = await db.query(query);
      // Mapear para estructurar rol y categoría como objetos anidados
      return rows.map((row) => ({
        id: row.id,
        nombre_usuario: row.nombre_usuario,
        email: row.email,
        nombre: row.nombre,
        apellidos: row.apellidos,
        aprobado: row.aprobado,
        fecha_creacion: row.fecha_creacion,
        rol: row.rol_id ? { id: row.rol_id, nombre: row.rol_nombre } : null,
        categoria: row.categoria_id
          ? { id: row.categoria_id, nombre: row.categoria_nombre }
          : null,
        cotizo: row.cotizo,
        miembro_sociedad: row.miembro_sociedad,
      }));
    } catch (error) {
      console.error("Error finding all users with details:", error);
      throw error;
    }
  },
  findAllMembersPaid: async () => {
    const query = `
      SELECT
        u.id, u.nombre_usuario, u.email, u.nombre, u.apellidos, u.aprobado, u.fecha_creacion,u.cotizo,u.miembro_sociedad,
        r.id as rol_id, r.nombre as rol_nombre,
        c.id as categoria_id, c.nombre as categoria_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN categorias c ON u.categoria_id = c.id
      WHERE u.aprobado = TRUE AND u.miembro_sociedad = TRUE AND u.cotizo = TRUE
      ORDER BY u.nombre, u.apellidos;
    `;
    try {
      const { rows } = await db.query(query);
      // Mapear para estructurar rol y categoría como objetos anidados
      return rows.map((row) => ({
        id: row.id,
        nombre_usuario: row.nombre_usuario,
        email: row.email,
        nombre: row.nombre,
        apellidos: row.apellidos,
        aprobado: row.aprobado,
        fecha_creacion: row.fecha_creacion,
        rol: row.rol_id ? { id: row.rol_id, nombre: row.rol_nombre } : null,
        categoria: row.categoria_id
          ? { id: row.categoria_id, nombre: row.categoria_nombre }
          : null,
        cotizo: row.cotizo,
        miembro_sociedad: row.miembro_sociedad,
      }));
    } catch (error) {
      console.error("Error finding all users with details:", error);
      throw error;
    }
  },

  /**
   * Encuentra un usuario por ID con detalles de rol y categoría.
   * @param {number} id - ID del usuario.
   * @returns {Promise<object|null>} Usuario con detalles o null.
   */
  findByIdWithDetails: async (id) => {
    const query = `
      SELECT
        u.id, u.nombre_usuario, u.email, u.nombre, u.apellidos, u.aprobado, u.fecha_creacion, u.password_hash,
        r.id as rol_id, r.nombre as rol_nombre,
        c.id as categoria_id, c.nombre as categoria_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN categorias c ON u.categoria_id = c.id
      WHERE u.id = $1;
    `;
    try {
      const { rows } = await db.query(query, [id]);
      if (rows.length === 0) return null;
      const row = rows[0];
      // Estructurar rol y categoría
      return {
        id: row.id,
        nombre_usuario: row.nombre_usuario,
        email: row.email,
        nombre: row.nombre,
        apellidos: row.apellidos,
        aprobado: row.aprobado,
        fecha_creacion: row.fecha_creacion,
        password_hash: row.password_hash, // Incluir hash para lógica interna si es necesario
        rol: row.rol_id
          ? {
              id: row.rol_id,
              nombre: row.rol_nombre,
            }
          : null,
        categoria: row.categoria_id
          ? { id: row.categoria_id, nombre: row.categoria_nombre }
          : null,
      };
    } catch (error) {
      console.error(`Error finding user by id ${id} with details:`, error);
      throw error;
    }
  },

  /**
   * Actualiza datos de un usuario.
   * @param {number} id - ID del usuario a actualizar.
   * @param {object} userData - Objeto con los campos a actualizar (ej: { nombre, email, rol_id, aprobado, ... }).
   *                            NO incluye password_hash aquí.
   * @returns {Promise<object|null>} El usuario actualizado (sin hash) o null si no se encontró.
   */
  update: async (id, userData) => {
    const fields = [];
    const values = [];
    let valueIndex = 1;

    // Construir dinámicamente los campos a actualizar
    // Asegúrate de validar los nombres de campo para evitar inyección SQL si userData viniera directamente del cliente sin sanitizar
    const allowedFields = [
      "nombre_usuario",
      "email",
      "nombre",
      "apellidos",
      "rol_id",
      "categoria_id",
      "aprobado",
    ];
    for (const key in userData) {
      if (allowedFields.includes(key) && userData[key] !== undefined) {
        // Manejo especial para 'aprobado' si viene como string
        let value = userData[key];
        if (key === "aprobado" && typeof value === "string") {
          value = value.toLowerCase() === "true" || value === "1";
        }
        if (key === "rol_id" || key === "categoria_id") {
          value = parseInt(value, 10); // Asegurar que IDs sean números
          if (isNaN(value)) continue; // Saltar si no es un número válido
        }

        fields.push(`${key} = $${valueIndex++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      // No hay campos válidos para actualizar, devolver el usuario actual sin cambios
      // O lanzar un error, según prefieras
      console.warn(`No valid fields provided for updating user ${id}`);
      return this.findById(id); // Devuelve el usuario existente
    }

    values.push(id); // Añadir el ID al final para la cláusula WHERE

    const query = `
      UPDATE usuarios
      SET ${fields.join(", ")}
      WHERE id = $${valueIndex}
      RETURNING id, nombre_usuario, email, nombre, apellidos, rol_id, categoria_id, aprobado, fecha_creacion;
    `;

    try {
      const { rows } = await db.query(query, values);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error; // Re-lanzar para manejo en el controlador (ej. constraints)
    }
  },

  /**
   * Elimina un usuario por su ID.
   * @param {number} id - ID del usuario a eliminar.
   * @returns {Promise<boolean>} True si se eliminó, false si no se encontró.
   */
  delete: async (id) => {
    const query = "DELETE FROM usuarios WHERE id = $1";
    try {
      const { rowCount } = await db.query(query, [id]);
      return rowCount > 0;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      // Considerar errores de FK si el usuario está referenciado en otras tablas
      throw error;
    }
  },
};

module.exports = userModel;
