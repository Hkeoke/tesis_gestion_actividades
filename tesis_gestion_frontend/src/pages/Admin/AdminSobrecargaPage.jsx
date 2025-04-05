import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  PlusCircle,
  Loader2,
  AlertCircle,
  Search,
  RefreshCw,
  Calendar,
  Download,
  Calculator,
  DollarSign,
  BarChart3,
  ScrollText,
  GraduationCap,
  FileArchive,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  getReportFiltersApi,
  getTeachingOverloadDataApi,
  calculateOverloadPaymentApi,
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

function AdminSobrecargaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados para filtros
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // Estados para fecha
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

  // Estados para sobrecarga docente
  const [overloadData, setOverloadData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para cálculo de pago
  const [showPaymentCalc, setShowPaymentCalc] = useState(false);
  const [fondoSalario, setFondoSalario] = useState("");
  const [paymentData, setPaymentData] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState(null);

  // Verificar acceso de administrador
  useEffect(() => {
    if (user?.nombre_rol?.toLowerCase() !== "administrador") {
      console.warn("Usuario no autorizado, redirigiendo...");
      navigate("/");
      return;
    }

    // Cargar filtros iniciales
    loadFilters();
  }, [user, navigate]);

  // Cargar filtros (roles y categorías)
  const loadFilters = async () => {
    try {
      const filters = await getReportFiltersApi();
      setRoles(filters.roles || []);
      setCategories(filters.categories || []);
    } catch (err) {
      console.error("Error cargando filtros:", err);
      setError(
        "No se pudieron cargar los filtros: " +
          (err.message || "Error desconocido")
      );
    }
  };

  // Cargar datos de sobrecarga docente
  const loadOverloadData = async () => {
    if (!startDate || !endDate) {
      setError("Por favor selecciona un rango de fechas válido.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getTeachingOverloadDataApi(
        startDate,
        endDate,
        selectedRoleId || null,
        selectedCategoryId || null
      );
      setOverloadData(data);
    } catch (err) {
      console.error("Error cargando datos de sobrecarga:", err);
      setError(
        err.message ||
          "Error al cargar los datos de sobrecarga. Intenta nuevamente."
      );
      setOverloadData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular pago por sobrecarga
  const calculatePayment = async () => {
    if (!startDate || !endDate || !fondoSalario) {
      setCalcError("Por favor ingresa todos los datos necesarios.");
      return;
    }

    setIsCalculating(true);
    setCalcError(null);

    try {
      const data = await calculateOverloadPaymentApi(
        startDate,
        endDate,
        fondoSalario
      );
      setPaymentData(data);
    } catch (err) {
      console.error("Error calculando pago:", err);
      setCalcError(
        err.message ||
          "Error al calcular el pago por sobrecarga. Intenta nuevamente."
      );
      setPaymentData(null);
    } finally {
      setIsCalculating(false);
    }
  };

  // Descargar reportes
  const downloadReport = (type, format) => {
    const params = {
      roleId: selectedRoleId || null,
      categoryId: selectedCategoryId || null,
    };

    if (type === "overload-payment" && fondoSalario) {
      params.fondoSalario = fondoSalario;
    }

    // Construir URL según el formato de la API con el prefijo api
    let url = `${
      process.env.REACT_APP_API_URL || ""
    }/api/reports/${type}/${format}?startDate=${startDate}&endDate=${endDate}`;

    Object.keys(params).forEach((key) => {
      if (params[key]) url += `&${key}=${params[key]}`;
    });

    // Usar window.open para abrir en una nueva pestaña
    window.open(url, "_blank");
  };

  // Botón para descargar PDF
  const handleDownloadPDF = () => {
    downloadReport("teaching-overload", "pdf");
  };

  // Botón para descargar Excel
  const handleDownloadExcel = () => {
    downloadReport("teaching-overload", "excel");
  };

  // Botón para descargar informe de pago PDF
  const handleDownloadPaymentPDF = () => {
    downloadReport("overload-payment", "pdf");
  };

  // Botón para descargar informe de pago Excel
  const handleDownloadPaymentExcel = () => {
    downloadReport("overload-payment", "excel");
  };

  // Cargar datos cuando cambian los filtros o el rango de fechas
  useEffect(() => {
    if (startDate && endDate) {
      loadOverloadData();
    }
  }, [startDate, endDate, selectedRoleId, selectedCategoryId]);

  // Filtrado de datos local para la búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return overloadData;

    return overloadData.filter(
      (item) =>
        item.profesor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.categoria &&
          item.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [overloadData, searchTerm]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <ScrollText size={30} className="mr-3" />
          Sobrecarga Docente
        </h1>
        <p className="text-gray-600 mt-1">
          Consulta y análisis de horas de sobrecarga docente por profesor
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
          <Search size={20} className="mr-2" />
          Filtros de Búsqueda
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Filtro por fecha inicial */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Fecha Inicial
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Filtro por fecha final */}
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Fecha Final
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Filtro por rol */}
          <div>
            <label
              htmlFor="roleFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Rol Docente
            </label>
            <select
              id="roleFilter"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Todos los roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por categoría */}
          <div>
            <label
              htmlFor="categoryFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Categoría Docente
            </label>
            <select
              id="categoryFilter"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones de filtrado y búsqueda */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center w-full md:w-auto">
            <div className="relative flex-grow md:max-w-xs">
              <input
                type="text"
                placeholder="Buscar profesor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
            </div>
            <button
              onClick={() => loadOverloadData()}
              disabled={isLoading}
              className="ml-2 p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center justify-center disabled:opacity-50"
              title="Recargar datos"
            >
              <RefreshCw
                size={18}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={!overloadData.length}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm disabled:opacity-50"
            >
              <FileText size={18} className="mr-2" />
              PDF
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={!overloadData.length}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm disabled:opacity-50"
            >
              <FileArchive size={18} className="mr-2" />
              Excel
            </button>
            <button
              onClick={() => setShowPaymentCalc(!showPaymentCalc)}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 shadow-sm"
            >
              <Calculator size={18} className="mr-2" />
              {showPaymentCalc ? "Ocultar Calculadora" : "Calculadora de Pago"}
            </button>
          </div>
        </div>
      </div>

      {/* Calculadora de Pago */}
      {showPaymentCalc && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
            <Calculator size={20} className="mr-2" />
            Calculadora de Pago por Sobrecarga
          </h2>

          {calcError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <AlertCircle size={18} className="inline-block mr-2" />
              {calcError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período Seleccionado
              </label>
              <div className="text-sm bg-gray-100 p-3 rounded">
                <Calendar size={16} className="inline-block mr-2" />
                <span>
                  {formatDate(startDate)} - {formatDate(endDate)}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="fondoSalario"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Fondo de Salario (CUP)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign
                    size={16}
                    className="text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="number"
                  name="fondoSalario"
                  id="fondoSalario"
                  value={fondoSalario}
                  onChange={(e) => setFondoSalario(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">CUP</span>
                </div>
              </div>
            </div>

            <div className="md:flex md:items-end">
              <div className="flex space-x-2">
                <button
                  onClick={calculatePayment}
                  disabled={isCalculating || !fondoSalario}
                  className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {isCalculating ? (
                    <Loader2 size={18} className="animate-spin mr-2" />
                  ) : (
                    <Calculator size={18} className="mr-2" />
                  )}
                  Calcular Pago
                </button>

                {paymentData && (
                  <>
                    <button
                      onClick={handleDownloadPaymentPDF}
                      className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm"
                    >
                      <FileText size={18} className="mr-2" />
                      PDF
                    </button>
                    <button
                      onClick={handleDownloadPaymentExcel}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm"
                    >
                      <FileArchive size={18} className="mr-2" />
                      Excel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {paymentData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div>
                <h3 className="font-medium text-gray-700">Total Profesores</h3>
                <p className="text-2xl font-bold text-indigo-700 flex items-center">
                  <Users size={20} className="mr-2" />
                  {paymentData.total_profesores || 0}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">
                  Total Horas Sobrecarga
                </h3>
                <p className="text-2xl font-bold text-indigo-700 flex items-center">
                  <Clock size={20} className="mr-2" />
                  {paymentData.total_horas || 0}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">
                  Monto Total a Pagar
                </h3>
                <p className="text-2xl font-bold text-indigo-700 flex items-center">
                  <DollarSign size={20} className="mr-2" />
                  {Number(paymentData.monto_total || 0).toLocaleString(
                    "es-CU",
                    {
                      style: "currency",
                      currency: "CUP",
                    }
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de Sobrecarga Docente */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center">
            <BarChart3 size={20} className="mr-2" />
            Listado de Sobrecarga Docente
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={50} className="text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-500">Cargando datos de sobrecarga...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={loadOverloadData}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Reintentar
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center">
            <ScrollText size={40} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              No se encontraron datos de sobrecarga para el período
              seleccionado.
            </p>
            <p className="text-gray-400 text-sm">
              Intenta modificar los filtros o seleccionar otro rango de fechas.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profesor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas Semana
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas Sobrecarga
                    </th>
                    {paymentData && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto a Pagar
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item, index) => (
                    <tr
                      key={item.profesor_id || index}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.profesor}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <GraduationCap
                            size={16}
                            className="text-indigo-500 mr-2"
                          />
                          <span className="text-sm text-gray-700">
                            {item.categoria || "No asignada"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.horas_semana || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 inline-flex text-sm leading-5 font-medium rounded-full bg-indigo-100 text-indigo-800">
                          {item.horas_sobrecarga || 0}
                        </span>
                      </td>
                      {paymentData && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {paymentData.pagos &&
                            paymentData.pagos[item.profesor_id] &&
                            Number(
                              paymentData.pagos[item.profesor_id]
                            ).toLocaleString("es-CU", {
                              style: "currency",
                              currency: "CUP",
                            })}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminSobrecargaPage;
