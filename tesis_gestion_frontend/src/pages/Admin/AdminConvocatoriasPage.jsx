import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  PlusCircle,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  Megaphone, // Icono para convocatorias
  Eye, // Icono para público
  EyeOff, // Icono para no público
  Search,
} from "lucide-react";
import ConvocatoriaModal from "../../components/Admin/ConvocatoriaModal"; // Importa el modal de convocatorias
// Importar funciones API de convocatorias
import {
  listAllConvocatoriasAdminApi,
  createConvocatoriaApi,
  updateConvocatoriaApi,
  deleteConvocatoriaApi,
} from "../../services/adminApi";

// Helper para truncar texto largo (opcional)
const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

function AdminConvocatoriasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convocatorias, setConvocatorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([
    { id: "fecha_creacion", desc: true },
  ]); // Ordenar por fecha de creación por defecto
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConvocatoria, setEditingConvocatoria] = useState(null); // Convocatoria a editar
  const [modalError, setModalError] = useState(null); // Error específico del modal
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado de carga del modal

  // Cargar TODAS las convocatorias
  const loadConvocatorias = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAllConvocatoriasAdminApi(); // Sin params de paginación
      setConvocatorias(Array.isArray(data) ? data : data.convocatorias || []);
    } catch (err) {
      console.error("Error loading convocatorias:", err);
      setError(err.message || "Error al cargar convocatorias.");
      setConvocatorias([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial y verificación de rol
  useEffect(() => {
    if (user?.nombre_rol?.toLowerCase() !== "administrador") {
      console.warn(
        "Acceso no autorizado a AdminConvocatoriasPage, redirigiendo..."
      );
      navigate("/");
      return;
    }
    loadConvocatorias();
  }, [user, navigate, loadConvocatorias]);

  // --- Definición de Columnas ---
  const columns = useMemo(
    () => [
      {
        accessorKey: "titulo",
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Título
            {column.getIsSorted() === "asc" && (
              <ChevronUp size={14} className="ml-1" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDown size={14} className="ml-1" />
            )}
          </div>
        ),
        size: 250,
      },
      {
        accessorKey: "descripcion",
        header: "Descripción",
        cell: (info) => truncateText(info.getValue(), 80), // Truncar descripción
        enableSorting: false, // Generalmente no se ordena por descripción larga
        size: 400,
      },
      {
        accessorKey: "publico",
        header: "Público",
        cell: ({ row }) =>
          row.original.publico ? (
            <span title="Sí" className="flex justify-center text-green-600">
              <Eye size={18} />
            </span>
          ) : (
            <span title="No" className="flex justify-center text-red-600">
              <EyeOff size={18} />
            </span>
          ),
        size: 80,
        enableSorting: true,
      },
      {
        accessorKey: "fecha_creacion", // Asumiendo que el backend la devuelve
        header: ({ column }) => (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Creado
            {column.getIsSorted() === "asc" && (
              <ChevronUp size={14} className="ml-1" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDown size={14} className="ml-1" />
            )}
          </div>
        ),
        cell: (info) => new Date(info.getValue()).toLocaleDateString(), // Formatear fecha
        size: 120,
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Editar Convocatoria"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1 text-red-600 hover:text-red-800"
              title="Eliminar Convocatoria"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
        size: 100,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // No necesita dependencias si handleDelete/handleEdit no cambian
  );

  // --- Instancia de la Tabla (Paginación Cliente) ---
  const table = useReactTable({
    data: convocatorias,
    columns,
    state: {
      sorting,
      pagination,
      globalFilter,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // --- Manejadores de Acciones (Crear, Editar, Eliminar, Guardar, Cerrar Modal) ---
  const handleCreate = () => {
    setEditingConvocatoria(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (convocatoria) => {
    setEditingConvocatoria(convocatoria);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (convocatoriaId) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar la convocatoria con ID ${convocatoriaId}?`
      )
    ) {
      // Podrías mostrar un loader específico para la fila si quieres
      try {
        await deleteConvocatoriaApi(convocatoriaId);
        loadConvocatorias(); // Recargar la lista
      } catch (err) {
        console.error("Error deleting convocatoria:", err);
        setError(err.message || "Error al eliminar la convocatoria.");
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingConvocatoria(null);
    setModalError(null); // Limpiar error al cerrar
    setIsSubmitting(false); // Asegurar que el estado de carga se reinicie
  };

  const handleSaveConvocatoria = async (convocatoriaData) => {
    setModalError(null);
    setIsSubmitting(true);
    try {
      if (editingConvocatoria) {
        // Actualizar
        await updateConvocatoriaApi(editingConvocatoria.id, convocatoriaData);
      } else {
        // Crear
        await createConvocatoriaApi(convocatoriaData);
      }
      handleCloseModal();
      loadConvocatorias(); // Recargar la lista
    } catch (err) {
      console.error("Error saving convocatoria:", err);
      setModalError(err.message || "Error al guardar la convocatoria.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Renderizado ---
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Encabezado */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Megaphone size={30} className="mr-3" />
          Gestión de Convocatorias
        </h1>
        <div className="flex items-center space-x-3 flex-wrap">
          <div className="relative">
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar convocatoria..."
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <Search
              size={16}
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          <button
            onClick={loadConvocatorias}
            disabled={isLoading}
            className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            title="Recargar lista"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <PlusCircle size={18} className="mr-1" />
          </button>
        </div>
      </div>

      {/* Indicador de Carga */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Cargando convocatorias...</span>
        </div>
      )}

      {/* Mensaje de Error General */}
      {error && !isLoading && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center justify-center">
          <AlertCircle size={20} className="mr-2" />
          <span>Error: {error}</span>
        </div>
      )}

      {/* Tabla o Mensaje Vacío */}
      {!isLoading && !error && (
        <>
          {convocatorias.length > 0 || globalFilter ? (
            <>
              <div className="overflow-x-auto bg-white shadow rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            style={{ width: header.getSize() }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getCanSort() &&
                                ({
                                  asc: <ChevronUp size={14} className="ml-1" />,
                                  desc: (
                                    <ChevronDown size={14} className="ml-1" />
                                  ),
                                }[header.column.getIsSorted()] ??
                                  null)}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => {
                          const isActionsColumn = cell.column.id === "actions";
                          const cellClasses = `py-4 whitespace-normal text-sm text-gray-800 align-top ${
                            isActionsColumn ? "px-0" : "px-6"
                          }`;
                          return (
                            <td
                              key={cell.id}
                              className={cellClasses.trim()}
                              style={{ width: cell.column.getSize() }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* --- Bloque de Paginación (Cliente) --- */}
              {console.log(
                `AdminConvocatoriasPage - Total Convocatorias: ${
                  convocatorias.length
                }, Page Count: ${table.getPageCount()}`
              )}
              {table.getPageCount() > 0 && (
                <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                  <span className="text-sm text-gray-700">
                    Página{" "}
                    <strong>
                      {table.getState().pagination.pageIndex + 1} de{" "}
                      {table.getPageCount()}
                    </strong>{" "}
                    ({table.getFilteredRowModel().rows.length} de{" "}
                    {convocatorias.length} convocatorias)
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                      className="p-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
                      title="Primera página"
                    >
                      <ChevronsLeft size={18} />
                    </button>
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="p-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
                      title="Página anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="p-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
                      title="Página siguiente"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button
                      onClick={() =>
                        table.setPageIndex(table.getPageCount() - 1)
                      }
                      disabled={!table.getCanNextPage()}
                      className="p-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
                      title="Última página"
                    >
                      <ChevronsRight size={18} />
                    </button>
                  </div>
                </div>
              )}
              {/* --- Fin Bloque de Paginación --- */}
            </>
          ) : (
            /* Renderizar Mensaje Vacío SI NO HAY convocatorias */
            !isLoading &&
            !globalFilter && (
              <div className="text-center py-16 bg-white shadow rounded-lg">
                <Megaphone size={60} className="mx-auto text-gray-400" />
                <p className="mt-4 text-lg text-gray-500">
                  No se encontraron convocatorias.
                </p>
              </div>
            )
          )}
          {/* Mensaje si el filtro no devuelve resultados */}
          {!isLoading &&
            convocatorias.length > 0 &&
            table.getFilteredRowModel().rows.length === 0 &&
            globalFilter && (
              <div className="text-center py-10 bg-white shadow rounded-lg mt-4">
                <Search size={40} className="mx-auto text-gray-400" />
                <p className="mt-3 text-gray-500">
                  No se encontraron convocatorias con el término "{globalFilter}
                  ".
                </p>
              </div>
            )}
        </>
      )}

      {/* Renderiza el Modal */}
      <ConvocatoriaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        convocatoriaToEdit={editingConvocatoria}
        onSave={handleSaveConvocatoria}
        apiError={modalError}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default AdminConvocatoriasPage;
