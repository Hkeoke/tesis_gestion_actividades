import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getPendingRegistrationsApi,
  approveUserApi,
  rejectUserApi,
  makeUserMemberApi,
} from "../../services/adminApi";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Loader2,
  UserX,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Award,
  UserPlus,
  Search,
} from "lucide-react";

function AdminApprovalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState("");

  const loadPendingUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPendingRegistrationsApi();
      setPendingUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      console.error("Error fetching pending users:", err);
      setError(err.message || "Error al obtener aprobaciones pendientes.");
      setPendingUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.nombre_rol?.toLowerCase() !== "administrador") {
      console.warn("Acceso no autorizado a AdminApprovalPage, redirigiendo...");
      navigate("/");
      return;
    }
    loadPendingUsers();
  }, [user, navigate, loadPendingUsers]);

  const handleApprove = useCallback(
    async (userId) => {
      setActionLoading((prev) => ({ ...prev, [userId]: "approving" }));
      setError(null);
      try {
        await approveUserApi(userId);
        loadPendingUsers();
      } catch (err) {
        console.error(`Error approving user ${userId}:`, err);
        setError(err.message || `Error al aprobar usuario ${userId}.`);
      } finally {
        setActionLoading((prev) => ({ ...prev, [userId]: false }));
      }
    },
    [loadPendingUsers]
  );

  const handleReject = useCallback(
    async (userId) => {
      if (
        !window.confirm(
          `¿Estás seguro de que quieres rechazar (eliminar) al usuario con ID ${userId}? Esta acción no se puede deshacer.`
        )
      ) {
        return;
      }
      setActionLoading((prev) => ({ ...prev, [userId]: "rejecting" }));
      setError(null);
      try {
        await rejectUserApi(userId);
        loadPendingUsers();
      } catch (err) {
        console.error(`Error rejecting user ${userId}:`, err);
        setError(err.message || `Error al rechazar usuario ${userId}.`);
      } finally {
        setActionLoading((prev) => ({ ...prev, [userId]: false }));
      }
    },
    [loadPendingUsers]
  );

  const handleMakeMember = useCallback(
    async (userId) => {
      setActionLoading((prev) => ({ ...prev, [userId]: "making_member" }));
      setError(null);
      try {
        await makeUserMemberApi(userId);
        loadPendingUsers();
      } catch (err) {
        console.error(`Error making user ${userId} a member:`, err);
        setError(err.message || `Error al hacer miembro al usuario ${userId}.`);
      } finally {
        setActionLoading((prev) => ({ ...prev, [userId]: false }));
      }
    },
    [loadPendingUsers]
  );

  const columns = useMemo(
    () => [
      { accessorKey: "nombre", header: "Nombre" },
      { accessorKey: "apellidos", header: "Apellidos" },
      { accessorKey: "nombre_categoria", header: "Categoria" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "fecha_creacion",
        header: "Fecha Solicitud",
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue()).toLocaleDateString()
            : "N/A",
      },
      {
        id: "actions",
        header: "Acciones",
        size: 240,
        enableSorting: false,
        cell: ({ row }) => {
          const userId = row.original.id;
          const isMember = row.original.miembro_sociedad;
          const isLoadingAction = actionLoading[userId];

          return (
            <div className="flex space-x-2 justify-center">
              <button
                onClick={() => handleApprove(userId)}
                disabled={!!isLoadingAction}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white ${
                  isLoadingAction === "approving"
                    ? "bg-gray-400 cursor-not-allowed"
                    : isLoadingAction
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50`}
                title="Aprobar Usuario"
              >
                {isLoadingAction === "approving" ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : (
                  <CheckCircle size={14} className="mr-1" />
                )}
              </button>
              <button
                onClick={() => handleMakeMember(userId)}
                disabled={!!isLoadingAction || isMember}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white ${
                  isLoadingAction === "making_member"
                    ? "bg-gray-400 cursor-not-allowed"
                    : isLoadingAction || isMember
                    ? "bg-blue-300 text-blue-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
                title={
                  isMember ? "Ya es miembro" : "Hacer Miembro de la Sociedad"
                }
              >
                {isLoadingAction === "making_member" ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : (
                  <Award size={14} className="mr-1" />
                )}
                {isMember}
              </button>
              <button
                onClick={() => handleReject(userId)}
                disabled={!!isLoadingAction}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white ${
                  isLoadingAction === "rejecting"
                    ? "bg-gray-400 cursor-not-allowed"
                    : isLoadingAction
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50`}
                title="Rechazar Usuario (Eliminar)"
              >
                {isLoadingAction === "rejecting" ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : (
                  <XCircle size={14} className="mr-1" />
                )}
              </button>
            </div>
          );
        },
      },
    ],
    [actionLoading, handleApprove, handleReject, handleMakeMember]
  );

  const table = useReactTable({
    data: pendingUsers,
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
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (user?.nombre_rol?.toLowerCase() !== "administrador" && !isLoading) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <UserPlus size={30} className="mr-3" />
          Aprobaciones Pendientes
        </h1>
        <div className="flex items-center space-x-3 flex-wrap">
          <div className="relative">
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar usuario..."
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <Search
              size={16}
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          <button
            onClick={loadPendingUsers}
            disabled={isLoading}
            className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50"
            title="Recargar lista"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && !isLoading && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle size={20} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && pendingUsers.length === 0 && (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
          <span className="ml-3 text-lg text-gray-600">
            Cargando usuarios pendientes...
          </span>
        </div>
      )}

      {!isLoading && pendingUsers.length === 0 && !error && !globalFilter && (
        <div className="text-center py-16 bg-white rounded-lg shadow p-6">
          <UserX size={60} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">
            No hay solicitudes de registro pendientes.
          </p>
        </div>
      )}

      {!isLoading && (pendingUsers.length > 0 || globalFilter) && (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          header.column.getCanSort() ? "cursor-pointer" : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{
                          width:
                            header.getSize() !== 150
                              ? header.getSize()
                              : undefined,
                        }}
                      >
                        <div className="flex items-center">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() &&
                            {
                              asc: <ChevronUp size={14} className="ml-1" />,
                              desc: <ChevronDown size={14} className="ml-1" />,
                            }[header.column.getIsSorted()]}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                        style={{
                          width:
                            cell.column.getSize() !== 150
                              ? cell.column.getSize()
                              : undefined,
                          textAlign:
                            cell.column.id === "actions" ? "center" : "left",
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {console.log(
            `AdminApprovalPage - Total Pending: ${
              pendingUsers.length
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
                {pendingUsers.length} usuarios pendientes)
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
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="p-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
                  title="Última página"
                >
                  <ChevronsRight size={18} />
                </button>
              </div>
            </div>
          )}
          {!isLoading &&
            pendingUsers.length > 0 &&
            table.getFilteredRowModel().rows.length === 0 &&
            globalFilter && (
              <div className="text-center py-10 bg-white shadow rounded-lg mt-4">
                <Search size={40} className="mx-auto text-gray-400" />
                <p className="mt-3 text-gray-500">
                  No se encontraron usuarios con el término "{globalFilter}".
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}

export default AdminApprovalPage;
