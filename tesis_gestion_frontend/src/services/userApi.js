import api from "../api/api";

// --- Funciones para Planificación (USUARIO NORMAL) ---

/**
 * Obtiene los tipos de actividad disponibles.
 * @returns {Promise<Array>} - Lista de tipos de actividad
 */
export const getActivityTypesApi = async () => {
  try {
    const response = await api.get("/planning/activity-types");
    return response.data;
  } catch (error) {
    console.error(
      "Error obteniendo tipos de actividad:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || new Error("Error al obtener tipos de actividad")
    );
  }
};

/**
 * Obtiene las actividades del plan del usuario actual en un rango de fechas.
 * @param {string} startDate - Fecha inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Fecha final (formato YYYY-MM-DD)
 * @returns {Promise<Array>} - Lista de actividades
 */
export const getUserPlanApi = async (startDate, endDate) => {
  try {
    const response = await api.get(`/planning/activities`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error obteniendo plan de usuario:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al obtener plan de trabajo");
  }
};

/**
 * Crea una nueva actividad en el plan del usuario actual.
 * @param {Object} activityData - Datos de la actividad
 * @returns {Promise<Object>} - Actividad creada
 */
export const createActivityApi = async (activityData) => {
  try {
    const response = await api.post("/planning/activities", activityData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creando actividad:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al crear actividad");
  }
};

/**
 * Actualiza una actividad existente en el plan del usuario.
 * @param {number} activityId - ID de la actividad a actualizar
 * @param {Object} activityData - Datos actualizados de la actividad
 * @returns {Promise<Object>} - Actividad actualizada
 */
export const updateActivityApi = async (activityId, activityData) => {
  try {
    const response = await api.put(
      `/planning/activities/${activityId}`,
      activityData
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error actualizando actividad ${activityId}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al actualizar actividad");
  }
};

/**
 * Elimina una actividad del plan del usuario.
 * @param {number} activityId - ID de la actividad a eliminar
 * @returns {Promise<void>}
 */
export const deleteActivityApi = async (activityId) => {
  try {
    await api.delete(`/planning/activities/${activityId}`);
    return true; // La operación fue exitosa
  } catch (error) {
    console.error(
      `Error eliminando actividad ${activityId}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al eliminar actividad");
  }
};

/**
 * Obtiene un resumen de horas por tipo de actividad para el usuario actual.
 * @param {string} startDate - Fecha inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Fecha final (formato YYYY-MM-DD)
 * @returns {Promise<Array>} - Resumen de horas por tipo de actividad
 */
export const getPlanSummaryApi = async (startDate, endDate) => {
  try {
    const response = await api.get(`/planning/activities/summary`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error obteniendo resumen del plan:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || new Error("Error al obtener resumen del plan")
    );
  }
};
