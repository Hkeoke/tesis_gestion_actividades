import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  UserCircle,
  LogOut,
  ChevronDown,
  Settings,
  ShieldCheck,
} from "lucide-react"; // Importa iconos

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // Ref para detectar clics fuera

  const handleLogout = () => {
    logout();
    navigate("/login"); // Redirige al login después de cerrar sesión
    setIsDropdownOpen(false);
  };

  // Cerrar dropdown si se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    // Bind el event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind el event listener en la limpieza
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Capitalizar Rol
  const capitalize = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <nav className="bg-white shadow-md h-16 flex items-center justify-end px-6 relative z-10">
      {/* Menú Desplegable del Usuario */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <UserCircle className="h-6 w-6 text-gray-600" />
          <span className="text-sm font-medium text-gray-700 hidden md:inline">
            {user?.nombre_usuario || "Usuario"}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {/* Contenido del Dropdown */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user?.nombre_usuario || "Usuario"}
              </p>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <ShieldCheck size={14} className="mr-1 text-indigo-500" />
                {capitalize(user?.nombre_rol || "Rol Desconocido")}
              </p>
            </div>
            <Link
              to="/profile" // Asume que tienes una ruta /profile
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Settings size={16} className="mr-2" />
              Mi Perfil
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={16} className="mr-2" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
