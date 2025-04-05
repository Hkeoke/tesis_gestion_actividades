import api from "../api/api";

export const listCategoriasApi = async () => {
  try {
    // Usamos la instancia 'api' y ajustamos la ruta
    const response = await api.get("/categories");
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching categorias:",
      error.response?.data || error.message
    );
    // Lanza el error para que el componente lo maneje (puede mostrar mensaje)
    throw error.response?.data || new Error("Error al listar categorias");
  }
};

// --- Funciones para Contenido Público/Usuario ---

// Obtiene noticias visibles para el usuario (públicas + privadas si es miembro)
export const listVisibleNewsApi = async () => {
  try {
    // El backend debería filtrar según el token de autenticación
    const response = await api.get("/news");
    return response.data; // Espera { news: [] } o similar
  } catch (error) {
    console.error(
      "Error fetching visible news:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al obtener noticias");
  }
};

// Obtiene eventos visibles para el usuario (públicos + privados si es miembro)
export const listVisibleEventsApi = async () => {
  try {
    // El backend debería filtrar según el token de autenticación
    const response = await api.get("/events");
    return response.data; // Espera { events: [] } o similar
  } catch (error) {
    console.error(
      "Error fetching visible events:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al obtener eventos");
  }
};

// Obtiene convocatorias visibles para el usuario (públicas + privadas si es miembro)
export const listVisibleConvocatoriasApi = async () => {
  try {
    // El backend debería filtrar según el token de autenticación
    const response = await api.get("/convocatorias");
    return response.data; // Espera { convocatorias: [] } o similar
  } catch (error) {
    console.error(
      "Error fetching visible convocatorias:",
      error.response?.data || error.message
    );
    throw error.response?.data || new Error("Error al obtener convocatorias");
  }
};

// Obtiene la lista de miembros que han pagado (requiere ser miembro)
export const listPaidMembersApi = async () => {
  try {
    // Asume un nuevo endpoint "/members/paid" que devuelve la lista
    const response = await api.get("events/members-paid");
    return response.data;
    console.log(response.data); // Espera { members: [{id, nombre, apellidos, ...}] } o similar
  } catch (error) {
    console.error(
      "Error fetching paid members:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data ||
      new Error("Error al obtener la lista de miembros al día")
    );
  }
};
