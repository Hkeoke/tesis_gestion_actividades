import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  PlusCircle,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  FileText,
  Users,
  Clock,
  BarChart3,
  BookOpen,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ActivityModal from "../../components/Planning/ActivityModal";
import {
  getActivityTypesApi,
  getUserPlanApi,
  createActivityApi,
  updateActivityApi,
  deleteActivityApi,
  getPlanSummaryApi,
} from "../../services/userApi";

// Para formatear la fecha en formato legible
const formatDate = (dateString) => {
  if (!dateString) return "Fecha no disponible";
  try {
    return format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: es });
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "Fecha inválida";
  }
};

function PlanningPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados principales
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

  // Cargar tipos de actividad (una sola vez)
  useEffect(() => {
    const loadActivityTypes = async () => {
      try {
        const types = await getActivityTypesApi();
        setActivityTypes(types);
      } catch (err) {
        console.error("Error cargando tipos de actividad:", err);
        setError("No se pudieron cargar los tipos de actividad.");
      }
    };

    loadActivityTypes();
  }, []);

  // Cargar actividades cuando cambian las fechas
  const loadActivities = async () => {
    if (!startDate || !endDate) {
      setError("Por favor selecciona un rango de fechas válido.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Cargar actividades
      const activitiesData = await getUserPlanApi(startDate, endDate);
      setActivities(activitiesData);

      // Cargar resumen de horas
      const summaryData = await getPlanSummaryApi(startDate, endDate);
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

  // Cargar datos al montar y cuando cambie el rango de fechas
  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user, startDate, endDate]);

  // Abrir modal para crear
  const handleCreate = () => {
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
    if (!window.confirm("¿Estás seguro de eliminar esta actividad?")) {
      return;
    }

    try {
      await deleteActivityApi(activityId);
      // Recargar las actividades
      loadActivities();
    } catch (err) {
      console.error(`Error eliminando actividad ${activityId}:`, err);
      setError(
        err.message || "No se pudo eliminar la actividad. Intenta nuevamente."
      );
    }
  };

  // Guardar actividad (crear o actualizar)
  const handleSaveActivity = async (activityData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      if (editingActivity) {
        // Actualizar actividad existente
        await updateActivityApi(editingActivity.id, activityData);
      } else {
        // Crear nueva actividad
        await createActivityApi(activityData);
      }

      // Cerrar modal y recargar datos
      setIsModalOpen(false);
      loadActivities();
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
          <Calendar size={30} className="mr-3" />
          Mi Plan de Trabajo
        </h1>
        <div className="flex items-center space-x-3 flex-wrap gap-2">
          <button
            onClick={handleCreate}
            className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusCircle size={18} className="mr-1" />
            <span>Añadir Actividad</span>
          </button>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
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
                onClick={loadActivities}
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

      {/* Contenido principal */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabla de actividades (2/3 del ancho en escritorio) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-medium text-gray-800 flex items-center">
                  <FileText size={18} className="mr-2" />
                  Actividades Registradas
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
                      ? "No se encontraron actividades que coincidan con tu búsqueda."
                      : "No tienes actividades registradas en este período."}
                  </p>
                  <button
                    onClick={handleCreate}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <PlusCircle size={16} className="inline mr-1" />
                    Añadir actividad
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
                  Resumen de Horas
                </h2>
              </div>
              <div className="p-4">
                {!isLoading && summary.length > 0 ? (
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
      )}

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

export default PlanningPage;
