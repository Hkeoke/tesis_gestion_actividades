import React from "react";
import { Link } from "react-router-dom"; // Importa Link para la navegación
import { useAuth } from "../context/AuthContext"; // Importa useAuth para ver si el usuario está logueado

function HomePage() {
  const { isAuthenticated, user } = useAuth(); // Obtiene el estado de autenticación y los datos del usuario

  return (
    <div className="bg-lime-500 flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 text-gray-800 p-6">
      <div className="text-center bg-white p-10 rounded-xl shadow-lg max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-indigo-700">
          Bienvenid@ al Sistema de Gestión de Actividades del Departamento de
          Matemáticas
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-600">
          Tu solución centralizada para la gestión eficiente.
        </p>

        {isAuthenticated ? (
          // Contenido si el usuario está autenticado
          <div>
            <p className="text-xl mb-4">
              Hola,{" "}
              <span className="font-semibold">
                {user?.nombre_usuario || "Usuario"}
              </span>
              !
            </p>
            <p className="mb-6">
              Ya has iniciado sesión. ¿Qué te gustaría hacer?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/profile" // Enlace al perfil
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition duration-300"
              >
                Ver mi Perfil
              </Link>
              {/* Puedes añadir más enlaces a otras secciones aquí */}
              {/* Ejemplo:
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition duration-300"
              >
                Ir al Dashboard
              </Link>
              */}
            </div>
          </div>
        ) : (
          // Contenido si el usuario NO está autenticado
          <div>
            <p className="mb-6">
              Por favor, inicia sesión o regístrate para continuar.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/login"
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition duration-300"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow hover:bg-gray-700 transition duration-300"
              >
                Registrarse
              </Link>
            </div>
          </div>
        )}

        <footer className="mt-10 text-sm text-gray-500">
          © {new Date().getFullYear()} UCI. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}

export default HomePage;
