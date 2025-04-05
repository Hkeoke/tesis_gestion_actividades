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
  Newspaper,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Search,
} from "lucide-react";
import NewsModal from "../../components/Admin/NewsModal";
import {
  listAllNewsAdminApi,
  createNewsApi,
  updateNewsApi,
  deleteNewsApi,
} from "../../services/adminApi";

function AdminNewsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newsItems, setNewsItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sorting, setSorting] = useState([
    { id: "fecha_creacion", desc: true },
  ]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAllNewsAdminApi();
      setNewsItems(Array.isArray(data) ? data : data.news || []);
    } catch (err) {
      console.error("Error loading news:", err);
      setError(err.message || "Error al cargar noticias.");
      setNewsItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.nombre_rol?.toLowerCase() !== "administrador") {
      console.warn("Acceso no autorizado a AdminNewsPage, redirigiendo...");
      navigate("/");
      return;
    }
    loadNews();
  }, [user, navigate, loadNews]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "imagen_base64",
        header: "Img",
        size: 120,
        enableSorting: false,
        cell: (info) => {
          const base64 = info.getValue();
          const imageUrl = base64 ? `data:image/png;base64,${base64}` : null;
          return imageUrl ? (
            <img
              src={imageUrl}
              alt="Noticia"
              className="h-12 w-16 object-cover rounded"
            />
          ) : (
            <div className="h-12 w-16 bg-gray-200 rounded flex items-center justify-center">
              <ImageIcon size={24} className="text-gray-400" />
            </div>
          );
        },
      },
      {
        accessorKey: "titulo",
        header: "Título",
        size: 400,
      },
      {
        accessorKey: "ispublica",
        header: "Pública",
        size: 100,
        cell: ({ row }) =>
          row.original.ispublica ? (
            <span title="Sí" className="flex justify-center text-green-600">
              <Eye size={18} />
            </span>
          ) : (
            <span title="No" className="flex justify-center text-red-600">
              <EyeOff size={18} />
            </span>
          ),
      },
      {
        accessorKey: "fecha_creacion",
        header: "Creada",
        size: 180,
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue()).toLocaleDateString()
            : "N/A",
      },
      {
        id: "actions",
        header: "Acciones",
        size: 100,
        cell: ({ row }) => (
          <div className="flex justify-center space-x-2">
            {" "}
            <button
              onClick={() => handleEdit(row.original)}
              className="text-indigo-600 hover:text-indigo-900 p-1"
              title="Editar Noticia"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="text-red-600 hover:text-red-900 p-1"
              title="Eliminar Noticia"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: newsItems,
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
    setEditingNews(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNews(null);
    setModalError(null);
    setIsSubmitting(false);
  };

  const handleSaveNews = async (newsData) => {
    setIsSubmitting(true);
    setModalError(null);
    try {
      if (editingNews) {
        await updateNewsApi(editingNews.id, newsData);
      } else {
        await createNewsApi(newsData);
      }
      handleCloseModal();
      loadNews();
    } catch (err) {
      console.error("Error saving news:", err);
      setModalError(err.message || "Error al guardar la noticia.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (newsId) => {
    if (
      !window.confirm("¿Estás seguro de que quieres eliminar esta noticia?")
    ) {
      return;
    }
    setIsLoading(true);
    try {
      await deleteNewsApi(newsId);
      loadNews();
    } catch (err) {
      console.error(`Error deleting news ${newsId}:`, err);
      setError(err.message || "Error al eliminar la noticia.");
      setIsLoading(false);
    }
  };

  console.log("Estado newsItems antes de renderizar:", newsItems);
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Newspaper size={30} className="mr-3" />
          Gestión de Noticias
        </h1>
        <div className="flex items-center space-x-3 flex-wrap">
          <div className="relative">
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar noticia..."
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <Search
              size={16}
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          <button
            onClick={loadNews}
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
            Cargando noticias...
          </span>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {newsItems.length > 0 || globalFilter ? (
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
                    ({table.getFilteredRowModel().rows.length} de{" "}
                    {newsItems.length} noticias)
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
                <Newspaper size={60} className="mx-auto text-gray-400" />
                <p className="mt-4 text-lg text-gray-500">
                  No se encontraron noticias.
                </p>
              </div>
            )
          )}
          {!isLoading &&
            newsItems.length > 0 &&
            table.getFilteredRowModel().rows.length === 0 &&
            globalFilter && (
              <div className="text-center py-10 bg-white shadow rounded-lg mt-4">
                <Search size={40} className="mx-auto text-gray-400" />
                <p className="mt-3 text-gray-500">
                  No se encontraron noticias con el término "{globalFilter}".
                </p>
              </div>
            )}
        </>
      )}

      <NewsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        newsToEdit={editingNews}
        onSave={handleSaveNews}
        apiError={modalError}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default AdminNewsPage;
