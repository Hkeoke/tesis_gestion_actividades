import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Home,
  UserCheck, // Icono para UserPage
  ShieldCheck, // Icono para AdminPage
  UserPlus, // <-- Icono para aprobaciones
  Newspaper, // <-- Importar icono para noticias
  CalendarDays, // <-- Importar icono para eventos
  Megaphone, // <-- Importar icono para convocatorias
  ClipboardList, // <-- Importar icono para planificación
  ScrollText, // <-- Importar icono para sobrecarga docente
} from "lucide-react";

function Sidebar({ isExpanded, setIsExpanded }) {
  const { user } = useAuth();
  const isAdmin = user?.nombre_rol?.toLowerCase() === "administrador"; // Verifica si es admin

  const commonLinkClasses =
    "flex items-center py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700 hover:text-white";
  const activeLinkClasses = "bg-indigo-800 text-white";
  const iconClasses = "h-5 w-5 mr-3"; // Margen derecho para icono cuando está expandido

  return (
    <aside
      className={`bg-gray-900 text-gray-200 transition-all duration-300 ease-in-out flex flex-col ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      {/* Logo / Título (Opcional) */}
      <div className="h-16 flex items-center justify-center border-b border-gray-700 relative">
        <span
          className={`font-bold text-xl text-white ${!isExpanded && "hidden"}`}
        >
          Sistemas de Gestión
        </span>
        {/* Botón para colapsar/expandir */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white rounded-full p-1.5 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 z-20"
          aria-label={isExpanded ? "Colapsar sidebar" : "Expandir sidebar"}
        >
          {isExpanded ? (
            <ChevronsLeft size={18} />
          ) : (
            <ChevronsRight size={18} />
          )}
        </button>
      </div>

      {/* Enlaces de Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {/* Enlaces Condicionales */}
        {isAdmin ? (
          // Enlaces de Administrador
          <>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
              title="Panel Admin"
            >
              <ShieldCheck className={iconClasses} />
              <span className={`${!isExpanded && "hidden"}`}>Admin</span>
            </NavLink>
            <NavLink
              to="/users" // Ejemplo de otra ruta admin
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
              title="Gestionar Usuarios"
            >
              <Users className={iconClasses} />
              <span className={`${!isExpanded && "hidden"}`}>Usuarios</span>
            </NavLink>
            <NavLink
              to="/approvals"
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
              title="Aprobaciones Pendientes"
            >
              <UserPlus className={iconClasses} />
              <span className={`${!isExpanded && "hidden"}`}>Aprobaciones</span>
            </NavLink>
            <NavLink
              to="/adminnews"
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
              title="Gestionar Noticias"
            >
              <Newspaper className={iconClasses} />
              <span className={`${!isExpanded && "hidden"}`}>Noticias</span>
            </NavLink>
            <NavLink
              to="/adminevents"
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
              title="Gestionar Eventos"
            >
              <CalendarDays className={iconClasses} />
              <span className={`${!isExpanded && "hidden"}`}>Eventos</span>
            </NavLink>
            <NavLink
              to="/adminconvocatorias"
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
              title="Gestionar Convocatorias"
            >
              <Megaphone className={iconClasses} />
              <span className={`${!isExpanded && "hidden"}`}>
                Convocatorias
              </span>
            </NavLink>
            <NavLink
              to="/adminplanning"
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
              title="Gestionar Planes de Trabajo"
            >
              <ClipboardList className={iconClasses} />
              <span className={`${!isExpanded && "hidden"}`}>
                Planes de Trabajo
              </span>
            </NavLink>
            <NavLink
              to="/adminsobrecarga"
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
              title="Sobrecarga Docente"
            >
              <ScrollText className={iconClasses} />
              <span className={`${!isExpanded && "hidden"}`}>
                Sobrecarga Docente
              </span>
            </NavLink>
            <NavLink
              to="/planning"
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
              title="Mi Plan de Trabajo"
            >
              <ClipboardList className={iconClasses} />
              <span className={`${!isExpanded && "hidden"}`}>
                Mi Plan de Trabajo
              </span>
            </NavLink>
          </>
        ) : (
          // Enlaces de Usuario Normal
          <>
            <NavLink
              to="/user"
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
              title="Mi Panel"
            >
              <UserCheck className={iconClasses} />
              <span className={`${!isExpanded && "hidden"}`}>Principal</span>
            </NavLink>
            <NavLink
              to="/planning"
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
              title="Mi Plan de Trabajo"
            >
              <ClipboardList className={iconClasses} />
              <span className={`${!isExpanded && "hidden"}`}>
                Mi Plan de Trabajo
              </span>
            </NavLink>
          </>
        )}

        {/* Enlace a Perfil (Común) */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
          }
          title="Mi Perfil"
        >
          <Settings className={iconClasses} />
          <span className={`${!isExpanded && "hidden"}`}>Perfil</span>
        </NavLink>
      </nav>

      {/* Footer del Sidebar (Opcional) */}
      <div className="p-4 border-t border-gray-700">
        {/* Puedes poner info adicional aquí */}
      </div>
    </aside>
  );
}

export default Sidebar;
