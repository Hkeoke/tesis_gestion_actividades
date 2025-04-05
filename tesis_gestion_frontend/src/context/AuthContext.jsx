import React, { createContext, useState, useContext, useEffect } from "react";
import { registerRequest, loginRequest, verifyTokenRequest } from "../api/auth";

// Crear el contexto
export const AuthContext = createContext();

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken") || null); // Inicializa desde localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Para saber si estamos verificando el token inicial
  const [authErrors, setAuthErrors] = useState([]); // Para mostrar errores de login/registro

  // Función para registrar usuario
  const signup = async (userData) => {
    try {
      const res = await registerRequest(userData);
      // Opcional: podrías iniciar sesión automáticamente si el registro no requiere aprobación,
      // pero según tu backend, solo muestra mensaje.
      console.log("Registro exitoso (pendiente aprobación):", res);
      // Limpia errores previos
      setAuthErrors([]);
      // Devuelve la respuesta por si quieres mostrar el mensaje en el componente
      return res;
    } catch (error) {
      console.error("Error en signup:", error);
      // Asume que el error tiene una propiedad 'message'
      setAuthErrors(
        error.message ? [error.message] : ["Error desconocido en el registro."]
      );
      throw error; // Lanza el error para manejo adicional si es necesario
    }
  };

  // Función para iniciar sesión
  const signin = async (credentials) => {
    try {
      setIsLoading(true); // Muestra carga durante el login
      const res = await loginRequest(credentials);
      console.log("Token recibido contexto:", res.token);
      // Guardar token en localStorage y estado
      localStorage.setItem("authToken", res.token);
      setToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
      setAuthErrors([]); // Limpia errores previos
      console.log("Inicio de sesión exitoso:", res.user);
    } catch (error) {
      console.error("Error en signin:", error);
      localStorage.removeItem("authToken"); // Asegura limpiar token si falla
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      // Asume que el error tiene una propiedad 'message'
      setAuthErrors(
        error.message
          ? [error.message]
          : ["Error desconocido en el inicio de sesión."]
      );
    } finally {
      setIsLoading(false); // Termina la carga
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthErrors([]);
    console.log("Sesión cerrada.");
  };

  // Efecto para limpiar errores después de un tiempo
  useEffect(() => {
    if (authErrors.length > 0) {
      const timer = setTimeout(() => {
        setAuthErrors([]);
      }, 5000); // Limpia errores después de 5 segundos
      return () => clearTimeout(timer); // Limpia el timer si el componente se desmonta o los errores cambian
    }
  }, [authErrors]);

  // Efecto para verificar el token al cargar la aplicación
  useEffect(() => {
    const checkLogin = async () => {
      const storedToken = localStorage.getItem("authToken");
      if (!storedToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        setUser(null);
        setToken(null);
        return;
      }

      // Si hay token, intenta verificarlo con el backend
      try {
        // No necesitas pasar el token aquí, el interceptor de Axios lo hará
        const userData = await verifyTokenRequest();
        setUser(userData);
        setToken(storedToken); // Asegura que el token en estado es el correcto
        setIsAuthenticated(true);
        console.log("Token verificado, usuario:", userData);
      } catch (error) {
        // Si el token no es válido (ej. 401 Unauthorized)
        console.error("Error verificando token:", error);
        localStorage.removeItem("authToken"); // Limpia el token inválido
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false); // Termina la carga inicial
      }
    };

    checkLogin();
  }, []); // Se ejecuta solo una vez al montar el componente

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        authErrors,
        signup,
        signin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
