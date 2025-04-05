import axios from "axios";

// Lee la variable de entorno definida en .env
const baseURL = import.meta.env.VITE_API_BASE_URL;

// Crea una instancia de Axios con la configuración base
const axiosInstance = axios.create({
  baseURL: baseURL,
  headers: { "Content-Type": "application/json" },
  // withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Añadir token de autenticación si existe
    const token = localStorage.getItem("authToken");
    console.log("Token en interceptor:", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Cualquier código de estado que este dentro del rango de 2xx causa que esta función se active
    return response;
  },
  (error) => {
    // Cualquier código de estado que caiga fuera del rango de 2xx causa que esta función se active
    // Aquí puedes manejar errores globales (ej. 401 Unauthorized)
    if (error.response && error.response.status === 403) {
      // Redirigir al login, limpiar localStorage, etc.
      console.error("No autorizado. Redirigiendo al login...");
      window.location.href = "/login";
    }
    if (error.response && error.response.status === 401) {
      // Redirigir al login, limpiar localStorage, etc.
      console.error("No autorizado. Redirigiendo al login...");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
