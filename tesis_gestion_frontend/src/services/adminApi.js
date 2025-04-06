import api from "../api/api"; // Importa la instancia configurada de Axios desde api.js

// --- Funciones del Servicio ---

// Gestión de Usuarios
export const listUsersApi = async () => {
  try {
    // Usamos la instancia 'api' y ajustamos la ruta
    const response = await api.get("/admin/users");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching users:",
      error.response?.data || error.message
    );
    // Lanza el error para que el componente lo maneje (puede mostrar mensaje)
    throw error.response?.data || new Error("Error al listar usuarios");
  }
};

export const getUserByIdApi = async (userId) => {
  try {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching user ${userId}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al obtener usuario");
  }
};

// NOTA: La creación de usuarios parece ser vía /register público según tu backend.
// Si necesitas una función admin para crear, deberías añadirla al backend.
// Esta función es para ACTUALIZAR
export const updateUserApi = async (userId, userData) => {
  try {
    // Asegúrate de que 'aprobado' sea booleano si lo envías
    if (userData.aprobado !== undefined) {
      userData.aprobado = Boolean(userData.aprobado);
    }
    // Asegúrate de que los IDs sean números
    if (
      userData.rol_id !== undefined &&
      userData.rol_id !== null &&
      userData.rol_id !== ""
    ) {
      userData.rol_id = parseInt(userData.rol_id, 10);
    } else {
      // Si rol_id es vacío o null, quizás quieras enviarlo como null explícitamente
      // o eliminarlo del objeto si tu backend espera que no esté presente.
      // Ajusta según la lógica de tu API.
      // delete userData.rol_id; // O userData.rol_id = null;
    }

    if (
      userData.categoria_id !== undefined &&
      userData.categoria_id !== null &&
      userData.categoria_id !== ""
    ) {
      userData.categoria_id = parseInt(userData.categoria_id, 10);
    } else {
      // Similar a rol_id, decide cómo manejar categoría vacía/null
      // delete userData.categoria_id; // O userData.categoria_id = null;
    }

    // Elimina la contraseña si está presente, ya que updateUser no la maneja
    delete userData.password;

    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data; // Devuelve { message, user }
  } catch (error) {
    console.error(
      `Error updating user ${userId}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al actualizar usuario");
  }
};

export const deleteUserApi = async (userId) => {
  try {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data; // Devuelve { message }
  } catch (error) {
    console.error(
      `Error deleting user ${userId}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al eliminar usuario");
  }
};

// Gestión de Roles
export const listRolesApi = async () => {
  try {
    const response = await api.get("/admin/roles");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching roles:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al listar roles");
  }
};

// --- Añade aquí más funciones para otras rutas de admin si las necesitas ---
// ej: approveUserApi, rejectUserApi, getPendingRegistrationsApi, etc.
// Recuerda usar la instancia 'api' y prefijar las rutas con '/admin/'

// Ejemplo para aprobar usuario (si la ruta es PUT /api/admin/users/:userId/approve)
export const approveUserApi = async (userId) => {
  try {
    // Asumiendo que no necesita body, si lo necesita, añádelo como segundo argumento del put
    const response = await api.put(`/admin/users/${userId}/approve`);
    return response.data; // Devuelve { message, user }
  } catch (error) {
    console.error(
      `Error approving user ${userId}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al aprobar usuario");
  }
};

// Ejemplo para rechazar usuario (si la ruta es DELETE /api/admin/users/:userId/reject)
export const rejectUserApi = async (userId) => {
  try {
    const response = await api.delete(`/admin/users/${userId}/reject`);
    return response.data; // Devuelve { message }
  } catch (error) {
    console.error(
      `Error rejecting user ${userId}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al rechazar usuario");
  }
};

// Ejemplo para obtener registros pendientes (si la ruta es GET /api/admin/pending-registrations)
export const getPendingRegistrationsApi = async () => {
  try {
    const response = await api.get("/admin/pending-registrations");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching pending registrations:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || new Error("Error al obtener registros pendientes")
    );
  }
};

// Marca a un usuario como miembro de la sociedad
export const makeUserMemberApi = async (userId) => {
  try {
    // Usamos PATCH según la definición de la ruta en adminRoutes.js
    const response = await api.patch(
      `/admin/users/${userId}/hacerMiembroSociedad`
    );
    return response.data; // Devuelve { message, user }
  } catch (error) {
    console.error(
      `Error making user ${userId} a member:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data || new Error("Error al hacer miembro al usuario")
    );
  }
};

// Cambia el estado de cotización (pago) de un usuario
export const toggleUserCotizacionApi = async (userId) => {
  try {
    // Usamos PATCH según la definición de la ruta en adminRoutes.js
    const response = await api.patch(`/admin/users/${userId}/cotizar`);
    return response.data; // Devuelve { message, user }
  } catch (error) {
    console.error(
      `Error toggling cotizacion for user ${userId}:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data || new Error("Error al cambiar estado de cotización")
    );
  }
};

// --- Gestión de Noticias (Admin) ---

// Lista TODAS las noticias (publicadas o no) para el admin
export const listAllNewsAdminApi = async (params = {}) => {
  // params puede incluir page, limit, sortBy, sortOrder si implementas ordenación avanzada
  try {
    const response = await api.get("/news", { params }); // Asumiendo ruta GET /api/news/admin/all
    return response.data; // Espera { news: [], currentPage, totalPages, totalNews }
  } catch (error) {
    console.error(
      "Error fetching all news (admin):",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || new Error("Error al obtener lista de noticias")
    );
  }
};

// Crea una nueva noticia
export const createNewsApi = async (newsData) => {
  // newsData debe contener { titulo, contenido, imagen_base64?, ispublica?, publicada? }
  try {
    const response = await api.post("/news", newsData); // POST /api/news
    return response.data; // Devuelve la noticia creada
  } catch (error) {
    console.error(
      "Error creating news:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al crear la noticia");
  }
};

// Actualiza una noticia existente
export const updateNewsApi = async (newsId, newsData) => {
  // newsData puede contener { titulo, contenido, imagen_base64?, ispublica?, publicada? }
  // Si imagen_base64 es "" o null, se eliminará la imagen.
  try {
    const response = await api.put(`/news/${newsId}`, newsData); // PUT /api/news/:newsId
    return response.data; // Devuelve { message, news }
  } catch (error) {
    console.error(
      `Error updating news ${newsId}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al actualizar la noticia");
  }
};

// Elimina una noticia
export const deleteNewsApi = async (newsId) => {
  try {
    const response = await api.delete(`/news/${newsId}`); // DELETE /api/news/:newsId
    return response.data; // Devuelve { message }
  } catch (error) {
    console.error(
      `Error deleting news ${newsId}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al eliminar la noticia");
  }
};

// --- Fin Gestión de Noticias ---

// --- Gestión de Eventos (Admin) ---

// Lista TODOS los eventos (públicos o no) para el admin
// Asume una ruta GET /api/events/admin o que GET /api/events devuelve todo para admin
export const listAllEventsAdminApi = async () => {
  try {
    // Ajusta la ruta si es diferente, ej: /events/admin/all o solo /events si el backend diferencia por rol
    const response = await api.get("/events");
    console.log(response.data);
    return response.data; // Espera { events: [], currentPage, totalPages, totalEvents }
  } catch (error) {
    console.error(
      "Error fetching all events (admin):",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || new Error("Error al obtener lista de eventos")
    );
  }
};

// Crea un nuevo evento
export const createEventApi = async (eventData) => {
  // eventData: { titulo, descripcion, fecha_evento (ISO), ubicacion, publico? }
  try {
    const response = await api.post("/events", eventData); // POST /api/events
    return response.data; // Devuelve el evento creado
  } catch (error) {
    console.error(
      "Error creating event:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al crear el evento");
  }
};

// Actualiza un evento existente
export const updateEventApi = async (eventId, eventData) => {
  // eventData: { titulo?, descripcion?, fecha_evento?, ubicacion?, publico? }
  try {
    const response = await api.put(`/events/${eventId}`, eventData); // PUT /api/events/:eventId
    return response.data; // Devuelve el evento actualizado
  } catch (error) {
    console.error(
      `Error updating event ${eventId}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al actualizar el evento");
  }
};

// Elimina un evento
export const deleteEventApi = async (eventId) => {
  try {
    // DELETE /api/events/:eventId devuelve 204 si tiene éxito
    await api.delete(`/events/${eventId}`);
    return { message: "Evento eliminado exitosamente." }; // Devolvemos un mensaje genérico
  } catch (error) {
    console.error(
      `Error deleting event ${eventId}:`,
      error.response?.data || error.message
    );
    // Si el backend devuelve un JSON en el error, lo usamos, si no, mensaje genérico
    throw error.response?.data || new Error("Error al eliminar el evento");
  }
};

// --- Fin Gestión de Eventos ---

export const listAllConvocatoriasAdminApi = async () => {
  try {
    // Ajusta la ruta si es diferente, ej: /events/admin/all o solo /events si el backend diferencia por rol
    const response = await api.get("/convocatorias"); // <-- Ruta para admin
    return response.data; // Espera { events: [], currentPage, totalPages, totalEvents }
  } catch (error) {
    console.error(
      "Error fetching all convocatorias (admin):",
      error.response?.data || error.message
    );
    throw (
      error.response?.data ||
      new Error("Error al obtener lista de convocatorias")
    );
  }
};

// Crea una nueva convocatoria
export const createConvocatoriaApi = async (convocatoriaData) => {
  // convocatoriaData: { titulo, descripcion, fecha_evento (ISO), ubicacion, publico? }
  try {
    const response = await api.post("/convocatorias", convocatoriaData); // POST /api/convocatorias
    return response.data; // Devuelve la convocatoria creada
  } catch (error) {
    console.error(
      "Error creating convocatoria:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al crear la convocatoria");
  }
};

// Actualiza una convocatoria existente
export const updateConvocatoriaApi = async (
  convocatoriaId,
  convocatoriaData
) => {
  // convocatoriaData: { titulo?, descripcion?, fecha_evento?, ubicacion?, publico? }
  try {
    const response = await api.put(
      `/convocatorias/${convocatoriaId}`,
      convocatoriaData
    ); // PUT /api/convocatorias/:convocatoriaId
    return response.data; // Devuelve la convocatoria actualizada
  } catch (error) {
    console.error(
      `Error updating convocatoria ${convocatoriaId}:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data || new Error("Error al actualizar la convocatoria")
    );
  }
};

// Elimina una convocatoria
export const deleteConvocatoriaApi = async (convocatoriaId) => {
  try {
    // DELETE /api/convocatorias/:convocatoriaId devuelve 204 si tiene éxito
    await api.delete(`/convocatorias/${convocatoriaId}`);
    return { message: "Convocatoria eliminada exitosamente." }; // Devolvemos un mensaje genérico
  } catch (error) {
    console.error(
      `Error deleting convocatoria ${convocatoriaId}:`,
      error.response?.data || error.message
    );
    // Si el backend devuelve un JSON en el error, lo usamos, si no, mensaje genérico
    throw (
      error.response?.data || new Error("Error al eliminar la convocatoria")
    );
  }
};

// --- Funciones de Planificación (ADMIN) ---

/**
 * Obtiene los tipos de actividad disponibles.
 * @returns {Promise<Array>} - Lista de tipos de actividad
 */
export const getActivityTypesAdminApi = async () => {
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
 * Obtiene las actividades del plan de un usuario específico en un rango de fechas.
 * @param {number} userId - ID del usuario
 * @param {string} startDate - Fecha inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Fecha final (formato YYYY-MM-DD)
 * @returns {Promise<Array>} - Lista de actividades
 */
export const getUserPlanAdminApi = async (userId, startDate, endDate) => {
  try {
    const response = await api.get(
      `/admin/planning/users/${userId}/activities`,
      {
        params: { startDate, endDate },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error obteniendo plan del usuario ${userId}:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data ||
      new Error("Error al obtener plan de trabajo del usuario")
    );
  }
};

/**
 * Crea una nueva actividad en el plan de un usuario específico.
 * @param {number} userId - ID del usuario
 * @param {Object} activityData - Datos de la actividad
 * @returns {Promise<Object>} - Actividad creada
 */
export const createActivityAdminApi = async (userId, activityData) => {
  try {
    const response = await api.post(
      `/admin/planning/users/${userId}/activities`,
      activityData
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error creando actividad para usuario ${userId}:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data ||
      new Error("Error al crear actividad para el usuario")
    );
  }
};

/**
 * Actualiza una actividad existente en el plan de un usuario específico.
 * @param {number} userId - ID del usuario
 * @param {number} activityId - ID de la actividad
 * @param {Object} activityData - Datos actualizados
 * @returns {Promise<Object>} - Actividad actualizada
 */
export const updateActivityAdminApi = async (
  userId,
  activityId,
  activityData
) => {
  try {
    const response = await api.put(
      `/admin/planning/users/${userId}/activities/${activityId}`,
      activityData
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error actualizando actividad ${activityId} del usuario ${userId}:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data ||
      new Error("Error al actualizar actividad del usuario")
    );
  }
};

/**
 * Elimina una actividad del plan de un usuario específico.
 * @param {number} userId - ID del usuario
 * @param {number} activityId - ID de la actividad
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
export const deleteActivityAdminApi = async (userId, activityId) => {
  try {
    await api.delete(
      `/admin/planning/users/${userId}/activities/${activityId}`
    );
    return true;
  } catch (error) {
    console.error(
      `Error eliminando actividad ${activityId} del usuario ${userId}:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data ||
      new Error("Error al eliminar actividad del usuario")
    );
  }
};

/**
 * Obtiene un resumen de horas por tipo de actividad para un usuario específico.
 * @param {number} userId - ID del usuario
 * @param {string} startDate - Fecha inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Fecha final (formato YYYY-MM-DD)
 * @returns {Promise<Array>} - Resumen de horas por tipo de actividad
 */
export const getPlanSummaryAdminApi = async (userId, startDate, endDate) => {
  try {
    const response = await api.get(`/admin/planning/users/${userId}/summary`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error(
      `Error obteniendo resumen del plan del usuario ${userId}:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data ||
      new Error("Error al obtener resumen del plan del usuario")
    );
  }
};

/**
 * Obtiene los filtros (roles y categorías) para reportes
 */
export const getReportFiltersApi = async () => {
  try {
    const response = await api.get("/reports/filters");
    return response.data;
  } catch (error) {
    console.error("Error fetching report filters:", error);
    throw (
      error.response?.data ||
      new Error("Error al obtener filtros para reportes")
    );
  }
};

/**
 * Obtiene datos de sobrecarga docente
 */
export const getTeachingOverloadDataApi = async (
  startDate,
  endDate,
  roleId = null,
  categoryId = null
) => {
  try {
    let url = `/reports/teaching-overload?startDate=${startDate}&endDate=${endDate}`;
    if (roleId) url += `&roleId=${roleId}`;
    if (categoryId) url += `&categoryId=${categoryId}`;

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching teaching overload data:", error);
    throw (
      error.response?.data ||
      new Error("Error al obtener datos de sobrecarga docente")
    );
  }
};

/**
 * Calcula el pago por sobrecarga docente
 */
export const calculateOverloadPaymentApi = async (
  startDate,
  endDate,
  fondoSalario
) => {
  try {
    const url = `/reports/overload-payment?startDate=${startDate}&endDate=${endDate}&fondoSalario=${fondoSalario}`;

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error calculating overload payment:", error);
    throw (
      error.response?.data || new Error("Error al calcular pago por sobrecarga")
    );
  }
};

/**
 * Descarga el reporte de sobrecarga docente en formato PDF o Excel
 * @param {string} type - Tipo de reporte (teaching-overload, overload-payment)
 * @param {string} format - Formato de descarga (pdf, excel)
 * @param {object} params - Parámetros adicionales (startDate, endDate, roleId, categoryId, fondoSalario)
 */
export const downloadReportApi = async (type, format, params) => {
  try {
    // Construir URL base con parámetros obligatorios
    let url = `/reports/${type}/${format}?startDate=${params.startDate}&endDate=${params.endDate}`;

    // Añadir parámetros opcionales si existen
    if (params.roleId) url += `&roleId=${params.roleId}`;
    if (params.categoryId) url += `&categoryId=${params.categoryId}`;
    if (params.fondoSalario) url += `&fondoSalario=${params.fondoSalario}`;

    // Configurar la respuesta como un blob para descargar
    const response = await api.get(url, {
      responseType: "blob",
    });

    // Crear un objeto URL y un enlace para descargar el archivo
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);

    // Determinar el nombre del archivo y extensión
    const fileExtension = format === "pdf" ? "pdf" : "xlsx";
    const reportType =
      type === "teaching-overload" ? "Sobrecarga_Docente" : "Pago_Sobrecarga";
    const fileName = `${reportType}_${params.startDate}_a_${params.endDate}.${fileExtension}`;

    // Crear elemento de enlace temporal para la descarga
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();

    // Limpiar
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    console.error(
      `Error descargando reporte ${type} en formato ${format}:`,
      error
    );
    throw new Error(
      `Error al descargar el reporte. ${error.message || "Intente nuevamente."}`
    );
  }
};
