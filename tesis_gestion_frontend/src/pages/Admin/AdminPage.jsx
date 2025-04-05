import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Users, Activity, ShieldAlert, BarChart } from "lucide-react"; // Iconos para tarjetas

function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    pendingTasks: 0,
  }); // Estado para estadísticas

  // Verifica si el usuario es admin, si no, redirige
  useEffect(() => {
    if (user?.nombre_rol?.toLowerCase() !== "administrador") {
      console.warn("Acceso no autorizado a AdminPage, redirigiendo...");
      navigate("/"); // O a /user si prefieres
    } else {
      // Aquí harías la llamada a la API para obtener las estadísticas reales
      // fetchAdminStats().then(data => setStats(data));
      // Por ahora, usamos datos de ejemplo después de un pequeño delay
      const timer = setTimeout(() => {
        setStats({ totalUsers: 125, activeSessions: 15, pendingTasks: 8 });
      }, 500); // Simula carga
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  // Componente reutilizable para las tarjetas
  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div
      className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${
        color || "border-indigo-500"
      } flex items-center space-x-4`}
    >
      <div
        className={`p-3 rounded-full ${color
          ?.replace("border-", "bg-")
          ?.replace("500", "100")} ${color?.replace("border-", "text-")}`}
      >
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );

  // Si aún no se ha verificado el rol o se está redirigiendo, no mostrar nada
  if (user?.nombre_rol?.toLowerCase() !== "administrador") {
    return null; // O un spinner de carga
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Panel de Administración
      </h1>

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          title="Total Usuarios Registrados"
          value={stats.totalUsers}
          color="border-blue-500"
        />
        <StatCard
          icon={Activity}
          title="Sesiones Activas"
          value={stats.activeSessions}
          color="border-green-500"
        />
        <StatCard
          icon={ShieldAlert} // O un icono más apropiado para tareas
          title="Tareas Pendientes"
          value={stats.pendingTasks}
          color="border-yellow-500"
        />
        {/* Puedes añadir más tarjetas aquí */}
        <StatCard
          icon={BarChart}
          title="Reporte X"
          value={"Ver"} // O un valor numérico
          color="border-purple-500"
        />
      </div>

      {/* Aquí podrías añadir más secciones, tablas, etc. */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Otras Acciones
        </h2>
        {/* Contenido adicional */}
        <p>Más contenido del panel de administración...</p>
      </div>
    </div>
  );
}

export default AdminPage;
