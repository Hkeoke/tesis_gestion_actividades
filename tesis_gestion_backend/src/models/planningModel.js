const db = require("../config/db");

const planningModel = {
  /**
   * Obtiene todos los tipos de actividad disponibles.
   * @returns {Promise<Array<object>>}
   */
  getActivityTypes: async () => {
    const query = "SELECT * FROM tipos_actividad ORDER BY nombre ASC;";
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Error obteniendo tipos de actividad:", error);
      throw error;
    }
  },

  /**
   * Añade una nueva actividad al plan de trabajo de un usuario.
   * Incluye validación básica para grupo requerido.
   * @param {number} usuarioId
   * @param {object} activityData - { tipo_actividad_id, fecha, horas_dedicadas, grupo_clase, descripcion_adicional, cantidad_estudiantes }
   * @returns {Promise<object>} La actividad creada.
   */
  addActivity: async (usuarioId, activityData) => {
    const {
      tipo_actividad_id,
      fecha,
      horas_dedicadas,
      grupo_clase,
      descripcion_adicional,
      cantidad_estudiantes,
    } = activityData;

    // Validación interna: Verificar si el tipo de actividad requiere grupo o estudiantes
    const tipoActividadQuery =
      "SELECT requiere_grupo, requiere_estudiantes FROM tipos_actividad WHERE id = $1";
    const tipoActividadResult = await db.query(tipoActividadQuery, [
      tipo_actividad_id,
    ]);

    if (tipoActividadResult.rows.length === 0) {
      throw new Error(
        `Tipo de actividad con ID ${tipo_actividad_id} no encontrado.`
      );
    }

    const { requiere_grupo, requiere_estudiantes } =
      tipoActividadResult.rows[0];

    if (requiere_grupo && !grupo_clase) {
      throw new Error(
        `La actividad seleccionada requiere especificar un grupo de clase.`
      );
    }

    if (
      requiere_estudiantes &&
      (!cantidad_estudiantes || cantidad_estudiantes <= 0)
    ) {
      throw new Error(
        `La actividad seleccionada requiere especificar la cantidad de estudiantes.`
      );
    }

    // Si no requiere grupo, nos aseguramos de que grupo_clase sea NULL
    const finalGrupoClase = requiere_grupo ? grupo_clase : null;
    // Si no requiere estudiantes, nos aseguramos que cantidad_estudiantes sea NULL
    const finalCantidadEstudiantes = requiere_estudiantes
      ? cantidad_estudiantes
      : null;

    const insertQuery = `
      INSERT INTO actividades_plan (
        usuario_id, 
        tipo_actividad_id, 
        fecha, 
        horas_dedicadas, 
        grupo_clase, 
        cantidad_estudiantes,
        descripcion_adicional
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    try {
      const { rows } = await db.query(insertQuery, [
        usuarioId,
        tipo_actividad_id,
        fecha,
        horas_dedicadas,
        finalGrupoClase, // Usar el valor ajustado
        finalCantidadEstudiantes, // Usar el valor ajustado
        descripcion_adicional,
      ]);
      return rows[0];
    } catch (error) {
      console.error(
        `Error añadiendo actividad para usuario ${usuarioId}:`,
        error
      );
      // Podríamos tener errores de FK si los IDs no existen, o de check constraint
      throw error;
    }
  },

  /**
   * Obtiene las actividades del plan de un usuario en un rango de fechas.
   * @param {number} usuarioId
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
   * @returns {Promise<Array<object>>}
   */
  getUserPlan: async (usuarioId, startDate, endDate) => {
    // Asegurarse de que las fechas son válidas antes de la consulta es buena práctica (se hará en el controller)
    const query = `
      SELECT
        ap.*,
        ta.nombre as nombre_tipo_actividad,
        ta.requiere_grupo,
        ta.requiere_estudiantes
      FROM actividades_plan ap
      JOIN tipos_actividad ta ON ap.tipo_actividad_id = ta.id
      WHERE ap.usuario_id = $1 AND ap.fecha BETWEEN $2 AND $3
      ORDER BY ap.fecha DESC, ap.fecha_registro DESC;
    `;
    try {
      const { rows } = await db.query(query, [usuarioId, startDate, endDate]);
      return rows;
    } catch (error) {
      console.error(
        `Error obteniendo plan para usuario ${usuarioId} entre ${startDate} y ${endDate}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Obtiene una actividad específica por su ID, verificando que pertenece al usuario.
   * @param {number} activityId
   * @param {number} usuarioId
   * @returns {Promise<object|null>}
   */
  getActivityById: async (activityId, usuarioId) => {
    const query = `SELECT * FROM actividades_plan WHERE id = $1 AND usuario_id = $2;`;
    try {
      const { rows } = await db.query(query, [activityId, usuarioId]);
      return rows[0] || null;
    } catch (error) {
      console.error(
        `Error buscando actividad ${activityId} para usuario ${usuarioId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Actualiza una actividad existente.
   * @param {number} activityId
   * @param {number} usuarioId - Para verificar propiedad.
   * @param {object} updateData - Campos a actualizar (ej. { fecha, horas_dedicadas, descripcion_adicional, grupo_clase })
   * @returns {Promise<object|null>} La actividad actualizada o null si no se encontró/no pertenece al usuario.
   */
  updateActivity: async (activityId, usuarioId, updateData) => {
    // Primero, verificar que la actividad existe y pertenece al usuario
    const existingActivity = await planningModel.getActivityById(
      activityId,
      usuarioId
    );
    if (!existingActivity) {
      return null; // O lanzar un error específico
    }

    // Construir la parte SET de la consulta dinámicamente
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Campos permitidos para actualizar (evitar actualizar usuario_id o tipo_actividad_id directamente aquí)
    const allowedUpdates = [
      "fecha",
      "horas_dedicadas",
      "grupo_clase",
      "cantidad_estudiantes",
      "descripcion_adicional",
    ];

    allowedUpdates.forEach((key) => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(updateData[key]);
      }
    });

    // Validar grupo_clase si se está actualizando (o si el tipo de actividad lo requiere)
    // Esta lógica podría ser más compleja si se permite cambiar el tipo de actividad
    const tipoActividadId = existingActivity.tipo_actividad_id; // Usar el tipo existente
    const tipoActividadQuery =
      "SELECT requiere_grupo, requiere_estudiantes FROM tipos_actividad WHERE id = $1";
    const tipoActividadResult = await db.query(tipoActividadQuery, [
      tipoActividadId,
    ]);
    const { requiere_grupo, requiere_estudiantes } =
      tipoActividadResult.rows[0] || {};

    // Validación para grupo de clase
    if (requiere_grupo && updateData.grupo_clase === null) {
      throw new Error(
        `La actividad requiere un grupo de clase y no puede ser nulo.`
      );
    }

    // Validación para cantidad de estudiantes
    if (
      requiere_estudiantes &&
      (updateData.cantidad_estudiantes === null ||
        updateData.cantidad_estudiantes <= 0)
    ) {
      throw new Error(
        `La actividad requiere especificar la cantidad de estudiantes.`
      );
    }

    // Si no requiere grupo, nos aseguramos que sea NULL
    if (
      !requiere_grupo &&
      updateData.grupo_clase !== undefined &&
      updateData.grupo_clase !== null
    ) {
      const grupoIndex = fields.findIndex((f) => f.startsWith("grupo_clase"));
      if (grupoIndex !== -1) {
        fields[grupoIndex] = `grupo_clase = $${grupoIndex + 1}`;
        values[grupoIndex] = null;
      } else {
        fields.push(`grupo_clase = $${paramIndex++}`);
        values.push(null);
      }
    }

    // Si no requiere estudiantes, nos aseguramos que cantidad_estudiantes sea NULL
    if (
      !requiere_estudiantes &&
      updateData.cantidad_estudiantes !== undefined &&
      updateData.cantidad_estudiantes !== null
    ) {
      const estudiantesIndex = fields.findIndex((f) =>
        f.startsWith("cantidad_estudiantes")
      );
      if (estudiantesIndex !== -1) {
        fields[estudiantesIndex] = `cantidad_estudiantes = $${
          estudiantesIndex + 1
        }`;
        values[estudiantesIndex] = null;
      } else {
        fields.push(`cantidad_estudiantes = $${paramIndex++}`);
        values.push(null);
      }
    }

    if (fields.length === 0) {
      return existingActivity; // No hay nada que actualizar
    }

    values.push(activityId);
    values.push(usuarioId);

    const query = `
      UPDATE actividades_plan
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex++} AND usuario_id = $${paramIndex++}
      RETURNING *;
    `;

    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error(`Error actualizando actividad ${activityId}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una actividad del plan.
   * @param {number} activityId
   * @param {number} usuarioId - Para verificar propiedad.
   * @returns {Promise<boolean>} True si se eliminó, false si no se encontró o no pertenece al usuario.
   */
  deleteActivity: async (activityId, usuarioId) => {
    const query = `DELETE FROM actividades_plan WHERE id = $1 AND usuario_id = $2 RETURNING id;`;
    try {
      const { rowCount } = await db.query(query, [activityId, usuarioId]);
      return rowCount > 0;
    } catch (error) {
      console.error(`Error eliminando actividad ${activityId}:`, error);
      throw error;
    }
  },

  // --- Funciones para Reportes (Ejemplo básico) ---

  /**
   * Calcula el total de horas por tipo de actividad para un usuario en un rango.
   * @param {number} usuarioId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Array<object>>} Array con { tipo_actividad_id, nombre_tipo_actividad, total_horas }
   */
  getHoursSummaryByUser: async (usuarioId, startDate, endDate) => {
    const query = `
          SELECT
              ta.id as tipo_actividad_id,
              ta.nombre as nombre_tipo_actividad,
              SUM(ap.horas_dedicadas) as total_horas
          FROM actividades_plan ap
          JOIN tipos_actividad ta ON ap.tipo_actividad_id = ta.id
          WHERE ap.usuario_id = $1 AND ap.fecha BETWEEN $2 AND $3
          GROUP BY ta.id, ta.nombre
          ORDER BY ta.nombre;
      `;
    try {
      const { rows } = await db.query(query, [usuarioId, startDate, endDate]);
      return rows;
    } catch (error) {
      console.error(
        `Error generando resumen de horas para usuario ${usuarioId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Obtiene las actividades del plan de un usuario específico en un rango de fechas.
   * (Similar a getPlanByDateRange pero toma userId como argumento)
   * @param {number} usuarioId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Array<object>>}
   */
  getPlanByUserId: async (usuarioId, startDate, endDate) => {
    const query = `
      SELECT
          ap.id,
          ap.fecha,
          ap.horas_dedicadas,
          ap.descripcion_adicional,
          ap.tipo_actividad_id,
          ap.cantidad_estudiantes,
          ta.nombre as nombre_tipo_actividad,
          ta.requiere_grupo,
          ta.requiere_estudiantes,
          ap.grupo_clase
      FROM actividades_plan ap
      JOIN tipos_actividad ta ON ap.tipo_actividad_id = ta.id
      WHERE ap.usuario_id = $1 AND ap.fecha BETWEEN $2 AND $3
      ORDER BY ap.fecha DESC, ap.fecha_registro DESC;
    `;
    try {
      const { rows } = await db.query(query, [usuarioId, startDate, endDate]);
      return rows.map((row) => ({
        ...row,
        horas_dedicadas: parseFloat(row.horas_dedicadas), // Asegurar que sea número
        cantidad_estudiantes: row.cantidad_estudiantes
          ? parseInt(row.cantidad_estudiantes, 10)
          : null, // Asegurar que sea número entero
      }));
    } catch (error) {
      console.error(`Error obteniendo plan para usuario ${usuarioId}:`, error);
      throw error;
    }
  },

  /**
   * Calcula el total de horas por tipo de actividad para un usuario específico en un rango.
   * (Similar a getHoursSummaryByUser pero toma userId como argumento)
   * @param {number} usuarioId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Array<object>>} Array con { tipo_actividad_id, nombre_tipo_actividad, total_horas }
   */
  getHoursSummaryByUserId: async (usuarioId, startDate, endDate) => {
    const query = `
          SELECT
              ta.id as tipo_actividad_id,
              ta.nombre as nombre_tipo_actividad,
              SUM(ap.horas_dedicadas) as total_horas
          FROM actividades_plan ap
          JOIN tipos_actividad ta ON ap.tipo_actividad_id = ta.id
          WHERE ap.usuario_id = $1 AND ap.fecha BETWEEN $2 AND $3
          GROUP BY ta.id, ta.nombre
          ORDER BY ta.nombre;
      `;
    try {
      const { rows } = await db.query(query, [usuarioId, startDate, endDate]);
      return rows.map((row) => ({
        ...row,
        total_horas: parseFloat(row.total_horas), // Asegurar que sea número
      }));
    } catch (error) {
      console.error(
        `Error generando resumen de horas para usuario ${usuarioId}:`,
        error
      );
      throw error;
    }
  },
};

module.exports = planningModel;
