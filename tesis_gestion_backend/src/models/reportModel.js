const db = require("../config/db");

const reportModel = {
  /**
   * Obtiene datos de usuarios (con su categoría y norma) y sus horas planificadas
   * en un rango de fechas, para calcular el sobrecumplimiento.
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
   * @param {number | null} [roleId=null] - Filtrar por rol (opcional)
   * @param {number | null} [categoryId=null] - Filtrar por categoría (opcional)
   * @returns {Promise<Array<object>>} Lista de usuarios con sus horas y norma.
   */
  getOverComplianceData: async (
    startDate,
    endDate,
    roleId = null,
    categoryId = null
  ) => {
    let params = [startDate, endDate];
    let filterConditions = "u.aprobado = TRUE"; // Solo usuarios aprobados

    if (roleId) {
      params.push(roleId);
      filterConditions += ` AND u.rol_id = $${params.length}`;
    }
    if (categoryId) {
      params.push(categoryId);
      filterConditions += ` AND u.categoria_id = $${params.length}`;
    }

    // Calcular el número de semanas (aproximado) en el rango para ajustar la norma
    // Se puede mejorar esta lógica si se necesita precisión exacta por días laborales, etc.
    // Aquí asumimos semanas completas o parciales cuentan.
    const dateDiffQuery = `SELECT (DATE '${endDate}' - DATE '${startDate}') / 7.0 as weeks;`;
    const diffResult = await db.query(dateDiffQuery);
    // Usamos Math.ceil para contar semanas parciales como completas para la norma.
    // O podrías usar un cálculo más preciso basado en días trabajados si es necesario.
    const numberOfWeeks = Math.max(1, Math.ceil(diffResult.rows[0].weeks)); // Al menos 1 semana

    const query = `
      SELECT
          u.id as usuario_id,
          u.nombre_usuario,
          u.nombre,
          u.apellidos,
          r.nombre as nombre_rol,
          c.nombre as nombre_categoria,
          c.horas_norma_semanal,
          -- Calcular la norma total para el período
          (c.horas_norma_semanal * $${
            params.length + 1
          }) as horas_norma_periodo,
          COALESCE(SUM(ap.horas_dedicadas), 0) as horas_registradas_periodo,
          -- Calcular sobrecumplimiento (horas registradas - norma)
          (COALESCE(SUM(ap.horas_dedicadas), 0) - (c.horas_norma_semanal * $${
            params.length + 1
          })) as horas_sobrecumplimiento
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN categorias c ON u.categoria_id = c.id -- LEFT JOIN por si un usuario no tiene categoría asignada aún
      LEFT JOIN actividades_plan ap ON u.id = ap.usuario_id AND ap.fecha BETWEEN $1 AND $2
      WHERE ${filterConditions} AND c.horas_norma_semanal IS NOT NULL -- Solo usuarios con norma definida
      GROUP BY
          u.id, u.nombre_usuario, u.nombre, u.apellidos, r.nombre, c.nombre, c.horas_norma_semanal
      ORDER BY
          horas_sobrecumplimiento DESC, u.apellidos, u.nombre;
    `;

    // Añadir el número de semanas calculado a los parámetros
    params.push(numberOfWeeks);

    try {
      const { rows } = await db.query(query, params);
      // Convertir strings numéricos de la BD a números si es necesario
      return rows.map((row) => ({
        ...row,
        horas_norma_semanal: parseFloat(row.horas_norma_semanal),
        horas_norma_periodo: parseFloat(row.horas_norma_periodo),
        horas_registradas_periodo: parseFloat(row.horas_registradas_periodo),
        horas_sobrecumplimiento: parseFloat(row.horas_sobrecumplimiento),
      }));
    } catch (error) {
      console.error(
        "Error obteniendo datos para reporte de sobrecumplimiento:",
        error
      );
      throw error;
    }
  },

  /**
   * Obtiene todas las categorías para usar en filtros de reportes.
   */
  getAllCategories: async () => {
    const query = "SELECT id, nombre FROM categorias ORDER BY nombre ASC;";
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Error obteniendo todas las categorías:", error);
      throw error;
    }
  },

  /**
   * Obtiene todos los roles para usar en filtros de reportes.
   */
  getAllRoles: async () => {
    const query = "SELECT id, nombre FROM roles ORDER BY nombre ASC;";
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Error obteniendo todos los roles:", error);
      throw error;
    }
  },

  /**
   * Obtiene los datos detallados de actividades docentes por profesor
   * para calcular la sobrecarga según la Resolución 32/2024.
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
   * @param {number | null} [roleId=null] - Filtrar por rol (opcional)
   * @param {number | null} [categoryId=null] - Filtrar por categoría (opcional)
   * @param {number | null} [departmentId=null] - Filtrar por departamento (opcional)
   * @returns {Promise<Array<object>>} Lista detallada de actividades y horas por profesor.
   */
  getTeachingOverloadData: async (
    startDate,
    endDate,
    roleId = null,
    categoryId = null,
    departmentId = null
  ) => {
    let params = [startDate, endDate];
    let filterConditions = "u.aprobado = TRUE"; // Solo usuarios aprobados

    if (roleId) {
      params.push(roleId);
      filterConditions += ` AND u.rol_id = $${params.length}`;
    }
    if (categoryId) {
      params.push(categoryId);
      filterConditions += ` AND u.categoria_id = $${params.length}`;
    }

    // Query para obtener actividades por tipo para cada profesor
    const query = `
      SELECT
          u.id as usuario_id,
          u.nombre_usuario,
          u.nombre,
          u.apellidos,
          r.nombre as nombre_rol,
          c.nombre as nombre_categoria,
          c.horas_norma_semanal,
          ta.id as tipo_actividad_id,
          ta.nombre as nombre_tipo_actividad,
          COUNT(DISTINCT ap.grupo_clase) FILTER (WHERE ap.grupo_clase IS NOT NULL) as cantidad_grupos,
          COUNT(DISTINCT ap.id) as cantidad_actividades,
          SUM(ap.horas_dedicadas) as horas_dedicadas,
          SUM(ap.cantidad_estudiantes) FILTER (WHERE ap.cantidad_estudiantes IS NOT NULL) as cantidad_estudiantes
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN categorias c ON u.categoria_id = c.id
      LEFT JOIN actividades_plan ap ON u.id = ap.usuario_id AND ap.fecha BETWEEN $1 AND $2
      LEFT JOIN tipos_actividad ta ON ap.tipo_actividad_id = ta.id
      WHERE ${filterConditions} AND c.horas_norma_semanal IS NOT NULL
          AND EXISTS (
              SELECT 1 FROM actividades_plan 
              WHERE usuario_id = u.id AND fecha BETWEEN $1 AND $2
              AND tipo_actividad_id IN (
                  SELECT id FROM tipos_actividad 
                  WHERE nombre LIKE '%Pregrado%' OR nombre = 'Docencia Directa de Pregrado y Posgrado'
              )
          )
      GROUP BY
          u.id, u.nombre_usuario, u.nombre, u.apellidos, r.nombre, c.nombre, c.horas_norma_semanal, 
          ta.id, ta.nombre
      ORDER BY
          u.apellidos, u.nombre, ta.nombre;
    `;

    try {
      const { rows } = await db.query(query, params);

      // Agrupar actividades por profesor
      const profesoresMap = new Map();

      rows.forEach((row) => {
        const profesorId = row.usuario_id;

        if (!profesoresMap.has(profesorId)) {
          profesoresMap.set(profesorId, {
            usuario_id: row.usuario_id,
            nombre_usuario: row.nombre_usuario,
            nombre: row.nombre,
            apellidos: row.apellidos,
            nombre_rol: row.nombre_rol,
            nombre_categoria: row.nombre_categoria,
            horas_norma_semanal: parseFloat(row.horas_norma_semanal),
            actividades: [],
            total_horas: 0,
            horas_pregrado: 0,
            horas_preparacion: 0,
          });
        }

        const profesor = profesoresMap.get(profesorId);
        const horasDedicadas = parseFloat(row.horas_dedicadas || 0);

        // Añadir actividad si existe
        if (row.tipo_actividad_id) {
          profesor.actividades.push({
            tipo_actividad_id: row.tipo_actividad_id,
            nombre_tipo_actividad: row.nombre_tipo_actividad,
            cantidad_grupos: parseInt(row.cantidad_grupos || 0),
            cantidad_actividades: parseInt(row.cantidad_actividades || 0),
            cantidad_estudiantes: parseInt(row.cantidad_estudiantes || 0),
            horas_dedicadas: horasDedicadas,
          });

          profesor.total_horas += horasDedicadas;

          // Contar horas de pregrado y preparación
          if (
            row.nombre_tipo_actividad.includes("Pregrado") ||
            row.nombre_tipo_actividad ===
              "Docencia Directa de Pregrado y Posgrado"
          ) {
            profesor.horas_pregrado += horasDedicadas;
          }
          if (row.nombre_tipo_actividad.includes("Preparación")) {
            profesor.horas_preparacion += horasDedicadas;
          }
        }
      });

      // Calcular sobrecarga para cada profesor
      const profesores = Array.from(profesoresMap.values());
      profesores.forEach((profesor) => {
        // Norma estándar según resolución: 60% de 190.6 horas mensuales = 114 horas
        const horasNormaDocente = 114;
        profesor.horas_sobrecarga = Math.max(
          0,
          profesor.total_horas - horasNormaDocente
        );

        // Ordenar actividades por horas dedicadas (de mayor a menor)
        profesor.actividades.sort(
          (a, b) => b.horas_dedicadas - a.horas_dedicadas
        );
      });

      // Ordenar profesores por sobrecarga (de mayor a menor)
      return profesores.sort((a, b) => b.horas_sobrecarga - a.horas_sobrecarga);
    } catch (error) {
      console.error(
        "Error obteniendo datos para reporte de sobrecarga docente:",
        error
      );
      throw error;
    }
  },

  /**
   * Calcula el fondo de salario y los coeficientes de sobrecarga por categoría
   * para el pago de sobrecarga docente según Resolución 32/2024.
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
   * @param {number} fondoSalarioNoEjecutado - Fondo disponible para pagos
   * @returns {Promise<object>} Coeficientes por categoría y datos para el cálculo.
   */
  calculateOverloadCoefficients: async (
    startDate,
    endDate,
    fondoSalarioNoEjecutado
  ) => {
    try {
      // 1. Obtener datos de sobrecarga
      const profesores = await reportModel.getTeachingOverloadData(
        startDate,
        endDate
      );

      // 2. Agrupar horas de sobrecarga por categoría
      const categorias = {};
      let totalHorasSobrecarga = 0;

      profesores.forEach((profesor) => {
        const categoria = profesor.nombre_categoria;
        if (!categorias[categoria]) {
          categorias[categoria] = {
            nombre: categoria,
            horas_sobrecarga: 0,
            profesores: [],
            tarifa_horaria: getTarifaPorCategoria(categoria),
            coeficiente: 0,
          };
        }

        if (profesor.horas_sobrecarga > 0) {
          categorias[categoria].horas_sobrecarga += profesor.horas_sobrecarga;
          categorias[categoria].profesores.push({
            usuario_id: profesor.usuario_id,
            nombre_completo: `${profesor.apellidos}, ${profesor.nombre}`,
            horas_sobrecarga: profesor.horas_sobrecarga,
          });
          totalHorasSobrecarga += profesor.horas_sobrecarga;
        }
      });

      // 3. Calcular fondo de salario necesario
      let fondoSalarioNecesario = 0;
      Object.values(categorias).forEach((cat) => {
        fondoSalarioNecesario += cat.horas_sobrecarga * cat.tarifa_horaria;
      });

      // 4. Calcular porcentaje de fondo disponible
      const porcentajeFondo = Math.min(
        1,
        fondoSalarioNoEjecutado / fondoSalarioNecesario
      );

      // 5. Calcular coeficiente por categoría
      Object.values(categorias).forEach((cat) => {
        cat.coeficiente = Math.min(
          cat.tarifa_horaria,
          porcentajeFondo * cat.tarifa_horaria
        );
      });

      // 6. Calcular monto a pagar por profesor
      const profesoresAPagar = [];
      Object.values(categorias).forEach((cat) => {
        cat.profesores.forEach((profesor) => {
          const montoPagar = parseFloat(
            (cat.coeficiente * profesor.horas_sobrecarga).toFixed(2)
          );
          profesoresAPagar.push({
            ...profesor,
            categoria: cat.nombre,
            coeficiente: cat.coeficiente,
            monto_pagar: montoPagar,
          });
        });
      });

      return {
        coeficientes_por_categoria: Object.values(categorias).map((cat) => ({
          categoria: cat.nombre,
          tarifa_horaria: cat.tarifa_horaria,
          horas_sobrecarga: cat.horas_sobrecarga,
          coeficiente: cat.coeficiente,
        })),
        profesores_a_pagar: profesoresAPagar.sort((a, b) =>
          a.nombre_completo.localeCompare(b.nombre_completo)
        ),
        resumen: {
          fondo_salario_no_ejecutado: fondoSalarioNoEjecutado,
          fondo_salario_necesario: fondoSalarioNecesario,
          porcentaje_fondo: porcentajeFondo,
          total_horas_sobrecarga: totalHorasSobrecarga,
          total_profesores: profesoresAPagar.length,
          total_a_pagar: profesoresAPagar.reduce(
            (sum, prof) => sum + prof.monto_pagar,
            0
          ),
        },
      };
    } catch (error) {
      console.error("Error calculando coeficientes de sobrecarga:", error);
      throw error;
    }
  },

  /**
   * Calcula el coeficiente de sobrecarga por categoría docente
   * @param {number} fondoSalarioNoEjecutado - Fondo disponible para pagos
   * @param {object} horasPorCategoria - Horas de sobrecarga por categoría
   * @returns {object} Coeficientes por categoría
   */
  calcularCoeficientesSobrecarga: (
    fondoSalarioNoEjecutado,
    horasPorCategoria
  ) => {
    // Tarifas horarias por categoría según resolución
    const tarifasHorarias = {
      Titular: 100,
      Auxiliar: 90,
      Asistente: 80,
      Instructor: 70,
      "Recién graduado": 70,
    };

    // Calcular fondo necesario total
    let fondoNecesario = 0;
    Object.entries(horasPorCategoria).forEach(([categoria, horas]) => {
      fondoNecesario += horas * tarifasHorarias[categoria];
    });

    // Calcular porcentaje del fondo disponible
    const porcentajeFondo = Math.min(
      1,
      fondoSalarioNoEjecutado / fondoNecesario
    );

    // Calcular coeficiente por categoría
    const coeficientes = {};
    Object.entries(horasPorCategoria).forEach(([categoria, _]) => {
      coeficientes[categoria] = Math.min(
        tarifasHorarias[categoria],
        porcentajeFondo * tarifasHorarias[categoria]
      );
    });

    return coeficientes;
  },

  /**
   * Genera el reporte de sobrecarga docente según Resolución 32/2024
   */
  generateTeachingOverloadReport: async (
    startDate,
    endDate,
    departmentId = null
  ) => {
    // Consulta SQL para obtener datos de actividades docentes
    const query = `
      SELECT 
        u.id,
        u.nombre,
        u.apellidos,
        c.nombre as categoria,
        SUM(CASE 
          WHEN ta.nombre LIKE '%Pregrado%' THEN ap.horas_dedicadas
          ELSE 0 
        END) as horas_pregrado,
        SUM(CASE 
          WHEN ta.nombre LIKE '%Preparación%' THEN ap.horas_dedicadas
          ELSE 0 
        END) as horas_preparacion,
        COUNT(DISTINCT ap.grupo_clase) as cantidad_grupos,
        SUM(ap.cantidad_estudiantes) as total_estudiantes,
        SUM(ap.horas_dedicadas) as total_horas
      FROM usuarios u
      JOIN categorias c ON u.categoria_id = c.id
      LEFT JOIN actividades_plan ap ON u.id = ap.usuario_id
      LEFT JOIN tipos_actividad ta ON ap.tipo_actividad_id = ta.id
      WHERE ap.fecha BETWEEN $1 AND $2
      ${departmentId ? "AND u.departamento_id = $3" : ""}
      GROUP BY u.id, u.nombre, u.apellidos, c.nombre
      HAVING SUM(CASE WHEN ta.nombre LIKE '%Pregrado%' THEN ap.horas_dedicadas ELSE 0 END) > 0
    `;

    const params = [startDate, endDate];
    if (departmentId) params.push(departmentId);

    const { rows } = await db.query(query, params);

    // Procesar resultados
    const profesores = rows.map((row) => ({
      ...row,
      horas_sobrecarga: Math.max(0, row.total_horas - 114), // 114 = 60% de 190.6
      horas_dia: row.total_horas / 24, // Considerando mes de 24 días laborables
      horas_sin_domingos: row.total_horas / 21, // Considerando mes sin domingos
    }));

    return profesores;
  },

  /**
   * Calcula el pago por sobrecarga docente según la Resolución 32/2024
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
   * @param {number} fondoSalario - Fondo de salario no ejecutado disponible
   * @returns {Promise<object>} Datos de pago calculados
   */
  calculateOverloadPayment: async (startDate, endDate, fondoSalario) => {
    try {
      // 1. Obtener profesores con horas trabajadas
      const query = `
        SELECT 
          u.id, 
          u.nombre, 
          u.apellidos, 
          CONCAT(u.apellidos, ' ', u.nombre) as nombre_completo,
          c.nombre as categoria,
          c.horas_norma_semanal,
          SUM(ap.horas_dedicadas) as total_horas,
          SUM(CASE 
            WHEN ta.nombre LIKE '%Pregrado%' OR ta.nombre = 'Docencia Directa de Pregrado y Posgrado' 
            THEN ap.horas_dedicadas 
            ELSE 0 
          END) as horas_pregrado
        FROM usuarios u
        JOIN categorias c ON u.categoria_id = c.id
        JOIN actividades_plan ap ON u.id = ap.usuario_id
        JOIN tipos_actividad ta ON ap.tipo_actividad_id = ta.id
        WHERE ap.fecha BETWEEN $1 AND $2
        GROUP BY u.id, u.nombre, u.apellidos, c.nombre, c.horas_norma_semanal
        HAVING SUM(CASE 
          WHEN ta.nombre LIKE '%Pregrado%' OR ta.nombre = 'Docencia Directa de Pregrado y Posgrado' 
          THEN ap.horas_dedicadas 
          ELSE 0 
        END) > 0
      `;

      const { rows } = await db.query(query, [startDate, endDate]);

      // 2. Calcular horas de sobrecarga por profesor (THP - 114h)
      const profesores = rows.map((profesor) => ({
        ...profesor,
        horas_sobrecarga: Math.max(0, parseFloat(profesor.total_horas) - 114), // 114 = 60% de 190.6
      }));

      // 3. Definir tarifas por categoría
      const tarifasPorCategoria = {
        Titular: 100,
        Auxiliar: 90,
        Asistente: 80,
        Instructor: 70,
        "Recién Graduado": 70,
      };

      // 4. Calcular horas por categoría y fondo necesario
      const horasPorCategoria = {};
      let fondoNecesario = 0;
      let totalHorasSobrecarga = 0;

      profesores.forEach((profesor) => {
        if (profesor.horas_sobrecarga > 0) {
          const categoria = profesor.categoria;
          if (!horasPorCategoria[categoria]) {
            horasPorCategoria[categoria] = 0;
          }
          horasPorCategoria[categoria] += profesor.horas_sobrecarga;
          totalHorasSobrecarga += profesor.horas_sobrecarga;
          fondoNecesario +=
            profesor.horas_sobrecarga * tarifasPorCategoria[categoria];
        }
      });

      // 5. Calcular porcentaje del fondo disponible
      const porcentajeFondo = Math.min(1, fondoSalario / fondoNecesario);

      // 6. Calcular coeficientes por categoría
      const coeficientesPorCategoria = [];
      Object.entries(horasPorCategoria).forEach(([categoria, horas]) => {
        const tarifa = tarifasPorCategoria[categoria] || 70;
        const coeficiente = Math.min(tarifa, porcentajeFondo * tarifa);

        coeficientesPorCategoria.push({
          categoria,
          tarifa_horaria: tarifa,
          horas_sobrecarga: horas,
          coeficiente,
        });
      });

      // 7. Calcular pago por profesor
      const profesoresAPagar = profesores
        .filter((p) => p.horas_sobrecarga > 0)
        .map((profesor) => {
          const categoria = profesor.categoria;
          const tarifa = tarifasPorCategoria[categoria] || 70;
          const coeficiente = Math.min(tarifa, porcentajeFondo * tarifa);

          return {
            id: profesor.id,
            nombre_completo: profesor.nombre_completo,
            categoria,
            horas_sobrecarga: profesor.horas_sobrecarga,
            coeficiente,
            monto_pagar: parseFloat(
              (coeficiente * profesor.horas_sobrecarga).toFixed(2)
            ),
          };
        });

      // 8. Calcular total a pagar
      const totalAPagar = profesoresAPagar.reduce(
        (sum, prof) => sum + prof.monto_pagar,
        0
      );

      return {
        coeficientes_por_categoria: coeficientesPorCategoria,
        profesores_a_pagar: profesoresAPagar,
        resumen: {
          fondo_salario_no_ejecutado: fondoSalario,
          fondo_salario_necesario: fondoNecesario,
          porcentaje_fondo: porcentajeFondo,
          total_horas_sobrecarga: totalHorasSobrecarga,
          total_profesores: profesoresAPagar.length,
          total_a_pagar: totalAPagar,
        },
      };
    } catch (error) {
      console.error("Error calculando pago por sobrecarga:", error);
      throw error;
    }
  },
};

// Función auxiliar para obtener la tarifa horaria por categoría
function getTarifaPorCategoria(categoria) {
  const tarifas = {
    Titular: 100, // Estos son valores de ejemplo, deben ajustarse según la normativa
    Auxiliar: 90, // a los valores reales de las tarifas horarias por categoría docente
    Asistente: 80,
    "Recién Graduado": 70,
    Instructor: 70,
  };

  return tarifas[categoria] || 70; // Valor por defecto si no está en la lista
}

module.exports = reportModel;
