import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel, // Para ordenar columnas
  flexRender,
} from "@tanstack/react-table";
import {
  PlusCircle,
  Search,
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
  Users,
  DollarSign,
  BadgeX,
  Loader2,
} from "lucide-react";
import UserModal from "../../components/Admin/UserModal"; // Importa el modal
import {
  listUsersApi,
  deleteUserApi,
  updateUserApi,
  listRolesApi,
  toggleUserCotizacionApi,
} from "../../services/adminApi";

function AdminUserPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalFilter, setGlobalFilter] = useState(""); // Estado para el filtro global
  const [sorting, setSorting] = useState([{ id: "apellidos", desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Usuario a editar
  const [actionLoading, setActionLoading] = useState({}); // Estado para carga de botones de acción (cotizar)

  // Función para cargar usuarios y roles
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setActionLoading({}); // Limpiar estados de carga al recargar
    try {
      const [usersData, rolesData] = await Promise.all([
        listUsersApi(),
        listRolesApi(),
      ]);
      setUsers(usersData || []);
      setRoles(rolesData || []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message || "Error al cargar datos. Intenta de nuevo.");
      setUsers([]);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verifica rol de admin
  useEffect(() => {
    if (user?.nombre_rol?.toLowerCase() !== "administrador") {
      console.warn("Acceso no autorizado a AdminUserPage, redirigiendo...");
      navigate("/");
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

  // --- MOVER AQUÍ: Handler para cambiar estado de cotización ---
  const handleToggleCotizacion = useCallback(
    async (userId) => {
      setActionLoading((prev) => ({
        ...prev,
        [userId]: "toggling_cotizacion",
      }));
      setError(null);
      try {
        await toggleUserCotizacionApi(userId);
        loadData(); // Recargar para ver el cambio
      } catch (err) {
        console.error(`Error toggling cotizacion for user ${userId}:`, err);
        setError(
          err.message || `Error al cambiar estado de cotización para ${userId}.`
        );
      } finally {
        setActionLoading((prev) => ({ ...prev, [userId]: false }));
      }
    },
    [loadData] // loadData es la única dependencia externa necesaria aquí
  );

  // --- Definición de Columnas para TanStack Table ---
  const columns = useMemo(
    () => [
      { accessorKey: "nombre", header: "Nombre", size: 150 },
      { accessorKey: "apellidos", header: "Apellidos", size: 200 },
      {
        accessorKey: "categoria.nombre",
        header: "Categoría",
        size: 120,
        cell: (info) => info.row.original.categoria?.nombre || "N/A",
        enableSorting: false,
      },
      { accessorKey: "nombre_usuario", header: "Usuario" },
      { accessorKey: "email", header: "Email", size: 250 },
      {
        accessorKey: "rol.nombre",
        header: "Rol",
        id: "rolNombre",
        size: 120,
      },
      {
        accessorKey: "aprobado",
        header: "Estado",
        cell: (info) => (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              info.getValue()
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {info.getValue() ? "Aprobado" : "Pendiente"}
          </span>
        ),
      },
      {
        id: "membership_status",
        header: "Miembro/Pago",
        size: 150,
        cell: ({ row }) => {
          const isMember = row.original.miembro_sociedad;
          console.log(row.original);
          const hasPaid = row.original.cotizo;
          const userId = row.original.id;
          const isLoadingAction =
            actionLoading[userId] === "toggling_cotizacion";

          if (!isMember) {
            return (
              <span className="text-xs text-gray-500 italic">No Miembro</span>
            );
          }

          return (
            <button
              onClick={() => handleToggleCotizacion(userId)}
              disabled={isLoadingAction}
              className={`inline-flex items-center justify-center w-full px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white ${
                isLoadingAction
                  ? "bg-gray-400 cursor-wait"
                  : hasPaid
                  ? "bg-teal-600 hover:bg-teal-700"
                  : "bg-orange-500 hover:bg-orange-600"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                hasPaid ? "focus:ring-teal-500" : "focus:ring-orange-500"
              } disabled:opacity-60`}
              title={hasPaid ? "Marcar como NO Pagado" : "Marcar como PAGADO"}
            >
              {isLoadingAction ? (
                <Loader2 size={14} className="animate-spin" />
              ) : hasPaid ? (
                <>
                  <DollarSign size={14} className="mr-1" /> Pagado
                </>
              ) : (
                <>
                  <BadgeX size={14} className="mr-1" /> Pendiente
                </>
              )}
            </button>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        size: 100,
        cell: ({ row }) => (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="text-indigo-600 hover:text-indigo-900 p-1"
              title="Editar Usuario"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="text-red-600 hover:text-red-900 p-1"
              title="Eliminar Usuario"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    [actionLoading, handleToggleCotizacion]
  );

  // --- Instancia de la Tabla ---
  const table = useReactTable({
    data: users,
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

  // --- Manejadores de Acciones ---
  const handleCreate = () => {
    setEditingUser(null); // Asegura que no hay datos de edición
    setIsModalOpen(true);
  };

  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setIsModalOpen(true);
    setError(null); // Limpiar error general al abrir modal
  };

  const handleDelete = async (userId) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar al usuario con ID ${userId}? Esta acción no se puede deshacer.`
      )
    ) {
      setIsLoading(true); // Muestra feedback de carga
      setError(null);
      try {
        await deleteUserApi(userId);
        loadData(); // Recarga la lista después de eliminar
      } catch (err) {
        console.error("Error deleting user:", err);
        setError(err.message || "Error al eliminar el usuario.");
        setIsLoading(false); // Quita el loading en caso de error
      }
    }
  };

  const handleSaveUser = async (userData) => {
    setError(null); // Limpiar error antes de intentar guardar
    const userId = editingUser?.id; // ID del usuario que se está editando

    if (!userId) {
      setError("No se pudo determinar el ID del usuario a actualizar.");
      return;
    }

    try {
      await updateUserApi(userId, userData);
      setIsModalOpen(false);
      setEditingUser(null);
      loadData(); // Recarga la lista
    } catch (err) {
      console.error(`Error saving user ${userId}:`, err);
      setError(err.message || `Error al guardar usuario ${userId}.`);
    }
  };

  if (isLoading && users.length === 0) {
    // Muestra carga solo la primera vez
    return <div className="text-center p-10">Cargando usuarios...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Users size={30} className="mr-3" />
          Gestión de Usuarios
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
            onClick={loadData}
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

      {error && !isLoading && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle size={20} className="mr-3" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
          <span className="ml-3 text-lg text-gray-600">
            Cargando usuarios...
          </span>
        </div>
      )}

      {!isLoading && !error && users.length > 0 && (
        <>
          {users.length > 0 || globalFilter ? (
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

              {table.getPageCount() > 0 && (
                <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                  <span className="text-sm text-gray-700">
                    Página{" "}
                    <strong>
                      {table.getState().pagination.pageIndex + 1} de{" "}
                      {table.getPageCount()}
                    </strong>{" "}
                    ({table.getFilteredRowModel().rows.length} de {users.length}{" "}
                    usuarios)
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
                <Users size={60} className="mx-auto text-gray-400" />
                <p className="mt-4 text-lg text-gray-500">
                  No se encontraron usuarios.
                </p>
              </div>
            )
          )}
          {!isLoading &&
            users.length > 0 &&
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

      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError(null);
          setEditingUser(null);
        }}
        userToEdit={editingUser}
        onSave={handleSaveUser}
        roles={roles}
        apiError={error}
      />
    </div>
  );
}

export default AdminUserPage;
