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
  CalendarDays,
  Eye,
  EyeOff,
  Search,
} from "lucide-react";
import EventModal from "../../components/Admin/EventModal";
import {
  listAllEventsAdminApi,
  createEventApi,
  updateEventApi,
  deleteEventApi,
} from "../../services/adminApi";

const formatDateTimeForDisplay = (isoString) => {
  if (!isoString) return "N/A";
  try {
    return new Date(isoString).toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

function AdminEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([{ id: "fecha_evento", desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAllEventsAdminApi();
      setEvents(Array.isArray(data) ? data : data.events || []);
    } catch (err) {
      console.error("Error loading events:", err);
      setError(err.message || "Error al cargar eventos.");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.nombre_rol?.toLowerCase() !== "administrador") {
      navigate("/");
      return;
    }
    loadEvents();
  }, [user, navigate, loadEvents]);

  const handleEdit = useCallback((event) => {
    setEditingEvent(event);
    setModalError(null);
    setIsSubmitting(false);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (eventId) => {
      if (
        !window.confirm("¿Estás seguro de que quieres eliminar este evento?")
      ) {
        return;
      }
      setIsLoading(true);
      try {
        await deleteEventApi(eventId);
        loadEvents();
      } catch (err) {
        console.error(`Error deleting event ${eventId}:`, err);
        setError(err.message || "Error al eliminar el evento.");
        setIsLoading(false);
      }
    },
    [loadEvents]
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "titulo",
        header: "Título",
        size: 250,
      },
      {
        accessorKey: "fecha_evento",
        header: "Fecha Evento",
        cell: (info) => formatDateTimeForDisplay(info.getValue()),
        size: 180,
      },
      {
        accessorKey: "ubicacion",
        header: "Ubicación",
        size: 200,
        cell: (info) => info.getValue() || "-",
      },
      {
        accessorKey: "publico",
        header: "Público",
        size: 80,
        cell: (info) =>
          info.getValue() ? (
            <span title="Sí" className="flex justify-center text-green-600">
              <Eye size={18} />
            </span>
          ) : (
            <span title="No" className="flex justify-center text-red-600">
              <EyeOff size={18} />
            </span>
          ),
        enableSorting: false,
      },
      {
        accessorKey: "fecha_creacion",
        header: "Creado",
        cell: (info) => formatDateTimeForDisplay(info.getValue()),
        size: 180,
      },
      {
        id: "acciones",
        header: "Acciones",
        size: 100,
        cell: ({ row }) => (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-100"
              title="Editar"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [handleEdit, handleDelete]
  );

  const table = useReactTable({
    data: events,
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

  const handleCreate = () => {
    setEditingEvent(null);
    setModalError(null);
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setModalError(null);
    setIsSubmitting(false);
  };

  const handleSaveEvent = async (eventData) => {
    setIsSubmitting(true);
    setModalError(null);
    try {
      if (editingEvent) {
        await updateEventApi(editingEvent.id, eventData);
      } else {
        await createEventApi(eventData);
      }
      handleCloseModal();
      loadEvents();
    } catch (err) {
      console.error("Error saving event:", err);
      setModalError(err.message || "Error al guardar el evento.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <CalendarDays size={30} className="mr-3" />
          Gestión de Eventos
        </h1>
        <div className="flex items-center space-x-3 flex-wrap">
          <div className="relative">
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar evento..."
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <Search
              size={16}
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          <button
            onClick={loadEvents}
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

      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
          <span className="ml-3 text-lg text-gray-600">
            Cargando eventos...
          </span>
        </div>
      )}

      {error && !isLoading && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {events.length > 0 || globalFilter ? (
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
                          const isActionsColumn = cell.column.id === "acciones";
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

              {table.getPageCount() > 0 && (
                <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                  <span className="text-sm text-gray-700">
                    Página{" "}
                    <strong>
                      {table.getState().pagination.pageIndex + 1} de{" "}
                      {table.getPageCount()}
                    </strong>{" "}
                    ({table.getFilteredRowModel().rows.length} de{" "}
                    {events.length} eventos)
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
            </>
          ) : (
            !isLoading &&
            !globalFilter && (
              <div className="text-center py-16 bg-white shadow rounded-lg">
                <CalendarDays size={60} className="mx-auto text-gray-400" />
                <p className="mt-4 text-lg text-gray-500">
                  No se encontraron eventos.
                </p>
              </div>
            )
          )}
          {!isLoading &&
            events.length > 0 &&
            table.getFilteredRowModel().rows.length === 0 &&
            globalFilter && (
              <div className="text-center py-10 bg-white shadow rounded-lg mt-4">
                <Search size={40} className="mx-auto text-gray-400" />
                <p className="mt-3 text-gray-500">
                  No se encontraron eventos con el término "{globalFilter}".
                </p>
              </div>
            )}
        </>
      )}

      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        eventToEdit={editingEvent}
        onSave={handleSaveEvent}
        apiError={modalError}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default AdminEventPage;
