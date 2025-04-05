import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Users,
  PlusCircle,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  FileText,
  Clock,
  BarChart3,
  BookOpen,
  Info,
  User,
  CalendarDays,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ActivityModal from "../../components/Planning/ActivityModal";
import {
  getActivityTypesAdminApi,
  getUserPlanAdminApi,
  createActivityAdminApi,
  updateActivityAdminApi,
  deleteActivityAdminApi,
  getPlanSummaryAdminApi,
  listUsersApi,
} from "../../services/adminApi";

// Formatear fecha para mostrar
const formatDate = (dateString) => {
  if (!dateString) return "Fecha no disponible";
  try {
    return format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: es });
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "Fecha inválida";
  }
};

function AdminPlanningPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados para usuarios
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [searchUserTerm, setSearchUserTerm] = useState("");

  // Estados principales para actividades
  const [activities, setActivities] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [summary, setSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Estados para filtrado y fecha
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(() => {
    // Por defecto, primer día del mes actual
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    // Por defecto, último día del mes actual
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
  });

  // Cargar lista de usuarios al iniciar
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await listUsersApi();
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        console.error("Error cargando usuarios:", err);
        setError("No se pudieron cargar los usuarios.");
      }
    };

    // Verificar que el usuario actual es administrador
    if (user?.nombre_rol?.toLowerCase() !== "administrador") {
      console.warn("Usuario no autorizado, redirigiendo...");
      navigate("/");
      return;
    }

    loadUsers();
  }, [user, navigate]);

  // Cargar tipos de actividad (una sola vez)
  useEffect(() => {
    const loadActivityTypes = async () => {
      try {
        const types = await getActivityTypesAdminApi();
        setActivityTypes(types);
      } catch (err) {
        console.error("Error cargando tipos de actividad:", err);
        setError("No se pudieron cargar los tipos de actividad.");
      }
    };

    loadActivityTypes();
  }, []);

  // Cargar actividades cuando se selecciona un usuario y cambian las fechas
  const loadUserActivities = async () => {
    if (!selectedUserId || !startDate || !endDate) {
      // No cargar si no hay usuario seleccionado o fechas
      setActivities([]);
      setSummary([]);
      setError(
        selectedUserId
          ? "Por favor selecciona un rango de fechas válido."
          : null
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Cargar actividades del usuario seleccionado
      const activitiesData = await getUserPlanAdminApi(
        selectedUserId,
        startDate,
        endDate
      );
      setActivities(activitiesData);

      // Cargar resumen de horas del usuario seleccionado
      const summaryData = await getPlanSummaryAdminApi(
        selectedUserId,
        startDate,
        endDate
      );
      setSummary(summaryData);
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError(
        err.message || "Error al cargar las actividades. Intenta nuevamente."
      );
      setActivities([]);
      setSummary([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos cuando cambia el usuario seleccionado o las fechas
  useEffect(() => {
    if (selectedUserId) {
      loadUserActivities();
      // Actualizar el nombre del usuario seleccionado
      const selectedUser = users.find(
        (u) => u.id === parseInt(selectedUserId, 10)
      );
      if (selectedUser) {
        setSelectedUserName(
          `${selectedUser.nombre || ""} ${
            selectedUser.apellidos || ""
          }`.trim() ||
            selectedUser.nombre_usuario ||
            `Usuario #${selectedUserId}`
        );
      }
    }
  }, [selectedUserId, startDate, endDate, users]);

  // Buscar usuarios filtrados
  const filteredUsers = useMemo(() => {
    if (!searchUserTerm.trim()) return users;

    const searchLower = searchUserTerm.toLowerCase();
    return users.filter(
      (u) =>
        (u.nombre && u.nombre.toLowerCase().includes(searchLower)) ||
        (u.apellidos && u.apellidos.toLowerCase().includes(searchLower)) ||
        (u.nombre_usuario &&
          u.nombre_usuario.toLowerCase().includes(searchLower)) ||
        (u.email && u.email.toLowerCase().includes(searchLower))
    );
  }, [users, searchUserTerm]);

  // Abrir modal para crear
  const handleCreate = () => {
    if (!selectedUserId) {
      setError("Debes seleccionar un usuario antes de crear una actividad.");
      return;
    }
    setEditingActivity(null);
    setApiError(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setApiError(null);
    setIsModalOpen(true);
  };

  // Confirmar y eliminar
  const handleDelete = async (activityId) => {
    if (!selectedUserId) {
      setError("Usuario no seleccionado.");
      return;
    }

    if (!window.confirm("¿Estás seguro de eliminar esta actividad?")) {
      return;
    }

    try {
      await deleteActivityAdminApi(selectedUserId, activityId);
      // Recargar las actividades
      loadUserActivities();
    } catch (err) {
      console.error(`Error eliminando actividad ${activityId}:`, err);
      setError(
        err.message || "No se pudo eliminar la actividad. Intenta nuevamente."
      );
    }
  };

  // Guardar actividad (crear o actualizar)
  const handleSaveActivity = async (activityData) => {
    if (!selectedUserId) {
      setApiError("No hay usuario seleccionado.");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      if (editingActivity) {
        // Actualizar actividad existente
        await updateActivityAdminApi(
          selectedUserId,
          editingActivity.id,
          activityData
        );
      } else {
        // Crear nueva actividad
        await createActivityAdminApi(selectedUserId, activityData);
      }

      // Cerrar modal y recargar datos
      setIsModalOpen(false);
      loadUserActivities();
    } catch (err) {
      console.error("Error guardando actividad:", err);
      setApiError(
        err.message || "Error al guardar la actividad. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar actividades según término de búsqueda
  const filteredActivities = useMemo(() => {
    if (!searchTerm.trim()) return activities;

    const searchLower = searchTerm.toLowerCase();
    return activities.filter(
      (activity) =>
        (activity.nombre_tipo_actividad &&
          activity.nombre_tipo_actividad.toLowerCase().includes(searchLower)) ||
        (activity.descripcion_adicional &&
          activity.descripcion_adicional.toLowerCase().includes(searchLower)) ||
        (activity.grupo_clase &&
          activity.grupo_clase.toLowerCase().includes(searchLower))
    );
  }, [activities, searchTerm]);

  // Calcular total de horas
  const totalHours = useMemo(() => {
    return summary.reduce(
      (total, item) => total + parseFloat(item.total_horas || 0),
      0
    );
  }, [summary]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Encabezado */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <CalendarDays size={30} className="mr-3" />
          Gestión de Planes de Trabajo
        </h1>
      </div>

      {/* Selector de usuario */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
          <User size={20} className="mr-2" />
          Seleccionar Usuario
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Usuario:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchUserTerm}
                onChange={(e) => setSearchUserTerm(e.target.value)}
                placeholder="Buscar usuario..."
                className="block w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search
                size={16}
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md mt-2">
              {filteredUsers.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredUsers.map((u) => (
                    <li key={u.id}>
                      <button
                        onClick={() => setSelectedUserId(u.id)}
                        className={`w-full text-left p-2 hover:bg-gray-100 flex items-center ${
                          selectedUserId === u.id ? "bg-indigo-50" : ""
                        }`}
                      >
                        <User
                          size={16}
                          className={`mr-2 ${
                            selectedUserId === u.id
                              ? "text-indigo-600"
                              : "text-gray-500"
                          }`}
                        />
                        <div className="truncate">
                          <span className="font-medium">
                            {u.nombre} {u.apellidos}
                          </span>{" "}
                          <span className="text-gray-500">
                            ({u.nombre_usuario})
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron usuarios
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2 flex flex-col justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Usuario Seleccionado:
              </label>
              <div className="p-2 border border-gray-300 rounded-md bg-gray-50">
                {selectedUserId ? (
                  <div className="font-medium text-gray-800">
                    {selectedUserName}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    Ningún usuario seleccionado
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCreate}
                disabled={!selectedUserId}
                className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircle size={18} className="mr-1" />
                <span>Añadir Actividad</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y controles de fecha (solo visibles si hay usuario seleccionado) */}
      {selectedUserId && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Calendar size={20} className="mr-2" />
            Período
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Control de fechas */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Desde:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Hasta:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2 md:flex md:items-end">
              <div className="w-full flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar actividades..."
                    className="block w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <Search
                    size={16}
                    className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                </div>
                <button
                  onClick={loadUserActivities}
                  disabled={isLoading}
                  className="ml-2 p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center justify-center disabled:opacity-50"
                  title="Actualizar datos"
                >
                  <RefreshCw
                    size={18}
                    className={isLoading ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mostrar error si existe */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle size={20} className="mr-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 size={36} className="animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Cargando actividades...</span>
        </div>
      )}

      {/* Contenido principal - Solo visible si hay usuario seleccionado */}
      {!isLoading && !error && selectedUserId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabla de actividades (2/3 del ancho en escritorio) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-medium text-gray-800 flex items-center">
                  <FileText size={18} className="mr-2" />
                  Actividades de {selectedUserName}
                </h2>
              </div>

              {filteredActivities.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo de Actividad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Horas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grupo / Estudiantes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(activity.fecha)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {activity.nombre_tipo_actividad}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {activity.horas_dedicadas}
                          </td>
                          <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                            {activity.grupo_clase && (
                              <div className="flex items-center text-gray-700 mb-1">
                                <span className="font-medium">Grupo:</span>{" "}
                                <span className="ml-1">
                                  {activity.grupo_clase}
                                </span>
                              </div>
                            )}
                            {activity.cantidad_estudiantes && (
                              <div className="flex items-center text-gray-700">
                                <Users size={14} className="mr-1" />
                                <span>
                                  {activity.cantidad_estudiantes} estudiantes
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(activity)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Editar actividad"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(activity.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Eliminar actividad"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info size={40} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">
                    {searchTerm
                      ? "No se encontraron actividades que coincidan con la búsqueda."
                      : "No hay actividades registradas en este período."}
                  </p>
                  <button
                    onClick={handleCreate}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <PlusCircle size={16} className="inline mr-1" />
                    Añadir actividad para {selectedUserName}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Panel de resumen (1/3 del ancho en escritorio) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-medium text-gray-800 flex items-center">
                  <BarChart3 size={18} className="mr-2" />
                  Resumen de Horas - {selectedUserName}
                </h2>
              </div>
              <div className="p-4">
                {summary.length > 0 ? (
                  <>
                    <div className="mb-2 pb-2 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">
                          Total de horas:
                        </span>
                        <span className="text-lg font-bold text-indigo-600">
                          {totalHours.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 mt-4">
                      {summary.map((item) => (
                        <div
                          key={item.tipo_actividad_id}
                          className="flex items-start"
                        >
                          <div className="mr-2 mt-1 text-indigo-500">
                            <BookOpen size={16} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-800">
                                {item.nombre_tipo_actividad}
                              </span>
                              <span className="font-medium text-gray-900">
                                {parseFloat(item.total_horas).toFixed(1)}h
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (parseFloat(item.total_horas) /
                                      totalHours) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Clock size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">
                      No hay datos de horas para mostrar en este período.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : !isLoading && !selectedUserId ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            Selecciona un usuario
          </h3>
          <p className="text-gray-600">
            Para gestionar las actividades del plan de trabajo, primero debes
            seleccionar un usuario de la lista.
          </p>
        </div>
      ) : null}

      {/* Modal para crear/editar actividad */}
      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activityToEdit={editingActivity}
        activityTypes={activityTypes}
        onSave={handleSaveActivity}
        apiError={apiError}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default AdminPlanningPage;
