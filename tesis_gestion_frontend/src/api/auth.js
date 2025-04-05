import api from "./api"; // Importa la instancia configurada de Axios

/**
 * Envía una solicitud para iniciar sesión.
 * @param {object} credentials - Objeto con nombre_usuario y password.
 * @returns {Promise<object>} - Promesa que resuelve con los datos de la respuesta (token y usuario).
 */
export const loginRequest = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    console.log("Token recibido:", response.data.token);
    return response.data; // Devuelve { message, token, user }
  } catch (error) {
    // Lanza el error para que sea manejado por el que llama a la función
    throw error.response ? error.response.data : new Error(error.message);
  }
};

/**
 * Envía una solicitud para registrar un nuevo usuario.
 * @param {object} userData - Datos del usuario a registrar.
 * @returns {Promise<object>} - Promesa que resuelve con los datos de la respuesta.
 */
export const registerRequest = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data; // Devuelve { message, user }
  } catch (error) {
    throw error.response ? error.response.data : new Error(error.message);
  }
};

/**
 * Envía una solicitud para verificar el token y obtener los datos del usuario.
 * Se asume que el token ya está en localStorage y será añadido por el interceptor de Axios.
 * @returns {Promise<object>} - Promesa que resuelve con los datos del usuario autenticado.
 */
export const verifyTokenRequest = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data; // Devuelve los datos del usuario (sin password_hash)
  } catch (error) {
    // Si el token no es válido o expiró, el backend devolverá un error (ej. 401)
    throw error.response ? error.response.data : new Error(error.message);
  }
};

// Podrías añadir aquí una función para logout si necesitas hacer algo en el backend al cerrar sesión,
// aunque generalmente solo se limpia el token del frontend.
// export const logoutRequest = async () => { ... }
