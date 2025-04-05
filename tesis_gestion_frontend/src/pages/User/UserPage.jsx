import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  listVisibleNewsApi,
  listVisibleEventsApi,
  listVisibleConvocatoriasApi,
  listPaidMembersApi,
} from "../../services/generalApi"; // Importar las nuevas funciones API
import {
  Newspaper,
  Calendar,
  Megaphone,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  ImageIcon, // <-- Icono para placeholder de imagen
  Lock, // <-- Icono para contenido solo miembros (opcional)
  DollarSign, // <-- Icono para cotización pagada
  BadgeX, // <-- Icono para cotización pendiente
  UserCircle, // Icono para avatar placeholder
  Users, // <-- Importar icono para la nueva sección
  ChevronDown, // <-- Icono para colapsables
  ChevronUp, // <-- Icono para colapsables
} from "lucide-react"; // Importar iconos

// --- Skeleton Loader (Ajustado ligeramente para el nuevo look) ---
const CardSkeleton = ({ tall } = { tall: false }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse border border-gray-200">
    <div className={`w-full ${tall ? "h-48" : "h-32"} bg-gray-300`}></div>
    <div className="p-4">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
      <div className="h-3 bg-gray-300 rounded w-5/6 mb-3"></div>
      <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

// --- Componente de Tarjeta de Contenido (Ajustado para estilo periódico) ---
const ContentCard = ({ item, type }) => {
  const isNews = type === "news";
  const imageUrl =
    isNews && item.imagen_base64
      ? `data:image/png;base64,${item.imagen_base64}`
      : null;
  const isPublic = item.publico ?? item.ispublica ?? true;

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      return new Date(isoString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "-";
    try {
      return new Date(isoString).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (e) {
      return "Fecha/Hora inválida";
    }
  };

  const dateToDisplay = isNews
    ? formatDate(item.fecha_creacion)
    : type === "event"
    ? formatDateTime(item.fecha_evento)
    : formatDate(item.fecha_creacion);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 flex flex-col h-full transition-shadow duration-200 hover:shadow-md">
      {isNews && (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden border-b border-gray-200">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.titulo}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon size={48} className="text-gray-300" />
          )}
        </div>
      )}
      <div className="p-4 flex-grow flex flex-col">
        <h3
          className={`font-semibold text-gray-900 mb-2 ${
            isNews ? "text-lg" : "text-base"
          }`}
        >
          {item.titulo}
        </h3>
        {item.descripcion && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-3 flex-grow">
            {item.descripcion}
          </p>
        )}
        {/* Mostrar Contenido de la Noticia si existe */}
        {isNews && item.contenido && (
          <div
            className="text-sm text-gray-700 mt-3 mb-3 prose prose-sm max-w-none"
            // Usar dangerouslySetInnerHTML si el contenido es HTML, de lo contrario mostrar como texto
            // ¡CUIDADO! Si el contenido no es confiable, dangerouslySetInnerHTML puede ser un riesgo de XSS.
            // Si es texto plano, simplemente usa: <p>{item.contenido}</p>
            dangerouslySetInnerHTML={{ __html: item.contenido }}
          />
        )}
        {item.ubicacion && type === "event" && (
          <p className="text-xs text-gray-500 mb-3 font-medium">
            📍 {item.ubicacion}
          </p>
        )}
        {/* Footer */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span>{dateToDisplay}</span>
          {!isPublic && (
            <span
              className="flex items-center text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-semibold"
              title="Contenido exclusivo para miembros"
            >
              <Lock size={11} className="mr-1" /> Miembros
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal UserPage (Estilo Periódico) ---
function UserPage() {
  const { user } = useAuth();
  const isMember = user?.miembro_sociedad;
  const hasPaid = user?.cotizo;

  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [convocatorias, setConvocatorias] = useState([]);
  const [membersStatus, setMembersStatus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [error, setError] = useState(null);
  const [membersError, setMembersError] = useState(null);

  // Estados para las secciones colapsables de la barra lateral
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isCallsOpen, setIsCallsOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setIsLoadingMembers(true);
      setError(null);
      setMembersError(null);
      setMembersStatus([]);

      try {
        const [newsData, eventsData, convocatoriasData] = await Promise.all([
          listVisibleNewsApi(),
          listVisibleEventsApi(),
          listVisibleConvocatoriasApi(),
        ]);
        setNews(
          Array.isArray(newsData?.news)
            ? newsData.news
            : Array.isArray(newsData)
            ? newsData
            : []
        );
        setEvents(
          Array.isArray(eventsData?.events)
            ? eventsData.events
            : Array.isArray(eventsData)
            ? eventsData
            : []
        );
        setConvocatorias(
          Array.isArray(convocatoriasData?.convocatorias)
            ? convocatoriasData.convocatorias
            : Array.isArray(convocatoriasData)
            ? convocatoriasData
            : []
        );
      } catch (err) {
        console.error("Error loading general dashboard data:", err);
        setError(err.message || "Error al cargar el contenido general.");
        setNews([]);
        setEvents([]);
        setConvocatorias([]);
      } finally {
        setIsLoading(false);
      }

      if (isMember) {
        try {
          const membersData = await listPaidMembersApi();
          setMembersStatus(
            Array.isArray(membersData?.members)
              ? membersData.members
              : Array.isArray(membersData)
              ? membersData
              : []
          );
        } catch (err) {
          console.error("Error loading members status:", err);
          setMembersError(err.message || "Error al cargar estado de miembros.");
          setMembersStatus([]);
        } finally {
          setIsLoadingMembers(false);
        }
      } else {
        setIsLoadingMembers(false);
      }
    };

    if (user) {
      loadData();
    } else {
      setIsLoading(false);
      setIsLoadingMembers(false);
    }
  }, [user, isMember]);

  // --- Renderizado Principal Estilo Periódico ---
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* --- Banner de Bienvenida (Estilo más sobrio) --- */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-10 p-6 flex flex-col sm:flex-row items-center gap-6">
          <UserCircle size={52} className="text-indigo-600 flex-shrink-0" />
          <div className="flex-grow text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              ¡Bienvenido, {user?.nombre_usuario || "Usuario"}!
            </h1>
            <p className="text-gray-600 mb-3">
              Tu resumen de noticias, eventos y convocatorias.
            </p>
            {/* Indicadores de Estado Miembro/Pago */}
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-3 gap-y-2 text-xs font-medium">
              {isMember ? (
                <span className="flex items-center bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Miembro Sociedad
                </span>
              ) : (
                <span className="flex items-center bg-red-100 text-red-800 px-2.5 py-1 rounded-full">
                  {/* <XCircle className="h-3.5 w-3.5 mr-1" /> */}
                  {/* No Miembro */}
                </span>
              )}
              {isMember &&
                (hasPaid ? (
                  <span className="flex items-center bg-teal-100 text-teal-800 px-2.5 py-1 rounded-full">
                    <DollarSign className="h-3.5 w-3.5 mr-1" />
                    Cotización al Día
                  </span>
                ) : (
                  <span className="flex items-center bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full">
                    <BadgeX className="h-3.5 w-3.5 mr-1" />
                    Cotización Pendiente
                  </span>
                ))}
            </div>
          </div>
        </div>
        {/* --- Mensaje de Error Global --- */}
        {error && !isLoading && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-md shadow-md flex items-start">
            <AlertCircle
              size={20}
              className="mr-3 mt-0.5 flex-shrink-0 text-red-600"
            />
            <div>
              <p className="font-semibold">Ocurrió un error general</p>
              <p className="text-sm">{error}. Intenta recargar.</p>
            </div>
          </div>
        )}
        {/* --- Layout Principal (Columnas Estilo Periódico) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Principal (Noticias) */}
          <div className="lg:col-span-2 space-y-8">
            <section aria-labelledby="news-section-title">
              <h2
                id="news-section-title"
                className="text-3xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-indigo-500 flex items-center"
              >
                <Newspaper className="mr-3 h-7 w-7 text-indigo-600" />
                Últimas Noticias
              </h2>
              {isLoading ? (
                <div className="space-y-6">
                  {[...Array(2)].map((_, i) => (
                    <CardSkeleton key={`news-skel-${i}`} tall />
                  ))}
                </div>
              ) : news.length > 0 ? (
                <div className="space-y-6">
                  {news.map((item) => (
                    <ContentCard
                      key={`news-${item.id}`}
                      item={item}
                      type="news"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg border border-dashed border-gray-300">
                  <Newspaper size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No hay noticias disponibles.</p>
                </div>
              )}
            </section>
          </div>
          {/* Columna Lateral (Eventos, Convocatorias, Estado Miembros - COLAPSABLES) */}
          <div className="lg:col-span-1 space-y-6">
            {" "}
            {/* Reducido el space-y para acomodar mejor */}
            {/* Eventos (Colapsable) */}
            <section aria-labelledby="events-section-title">
              <button
                onClick={() => setIsEventsOpen(!isEventsOpen)}
                className="w-full flex justify-between items-center text-left text-xl font-semibold text-gray-700 mb-3 pb-1.5 border-b border-purple-400 focus:outline-none"
              >
                <span className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-purple-600" />
                  Próximos Eventos
                </span>
                {isEventsOpen ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
              {isEventsOpen && (
                <div className="pl-1 pr-1">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <CardSkeleton key={`event-skel-${i}`} />
                      ))}
                    </div>
                  ) : events.length > 0 ? (
                    <div className="space-y-4">
                      {events.map((item) => (
                        <ContentCard
                          key={`event-${item.id}`}
                          item={item}
                          type="event"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-white rounded-lg border border-dashed border-gray-300 text-sm">
                      <Calendar
                        size={32}
                        className="mx-auto text-gray-400 mb-2"
                      />
                      <p className="text-gray-500">Sin eventos programados.</p>
                    </div>
                  )}
                </div>
              )}
            </section>
            {/* Convocatorias (Colapsable) */}
            <section aria-labelledby="calls-section-title">
              <button
                onClick={() => setIsCallsOpen(!isCallsOpen)}
                className="w-full flex justify-between items-center text-left text-xl font-semibold text-gray-700 mb-3 pb-1.5 border-b border-teal-400 focus:outline-none"
              >
                <span className="flex items-center">
                  <Megaphone className="mr-2 h-5 w-5 text-teal-600" />
                  Convocatorias
                </span>
                {isCallsOpen ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
              {isCallsOpen && (
                <div className="pl-1 pr-1">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(1)].map((_, i) => (
                        <CardSkeleton key={`call-skel-${i}`} />
                      ))}
                    </div>
                  ) : convocatorias.length > 0 ? (
                    <div className="space-y-4">
                      {convocatorias.map((item) => (
                        <ContentCard
                          key={`call-${item.id}`}
                          item={item}
                          type="call"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-white rounded-lg border border-dashed border-gray-300 text-sm">
                      <Megaphone
                        size={32}
                        className="mx-auto text-gray-400 mb-2"
                      />
                      <p className="text-gray-500">
                        Sin convocatorias activas.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
            {/* Estado de Cotización Miembros (Solo para miembros, Colapsable, Lista única) */}
            {isMember && (
              <section aria-labelledby="members-status-title">
                <button
                  onClick={() => setIsMembersOpen(!isMembersOpen)}
                  className="w-full flex justify-between items-center text-left text-xl font-semibold text-gray-700 mb-3 pb-1.5 border-b border-green-400 focus:outline-none"
                >
                  <span className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-green-600" />
                    Estado de Miembros
                  </span>
                  {isMembersOpen ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>

                {isMembersOpen && (
                  <div className="pl-1 pr-1">
                    {membersError && !isLoadingMembers && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm flex items-start">
                        <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                        <div>
                          <span className="font-semibold">Error:</span>{" "}
                          {membersError}
                        </div>
                      </div>
                    )}

                    {isLoadingMembers && (
                      <div className="flex items-center justify-center py-6 text-gray-500 text-sm">
                        <Loader2 size={18} className="animate-spin mr-2" />
                        Cargando miembros...
                      </div>
                    )}

                    {/* LISTA ÚNICA DENTRO DE UNA TARJETA CONTENEDORA */}
                    {!isLoadingMembers &&
                      !membersError &&
                      membersStatus.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                          <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                            {" "}
                            {/* Limitar altura y añadir scroll si es necesario */}
                            {membersStatus.map((member) => (
                              <li
                                key={member.id}
                                className="py-2.5 flex items-center justify-between space-x-2"
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <UserCircle
                                    size={24}
                                    className="text-gray-400 flex-shrink-0"
                                  />
                                  <span
                                    className="text-sm font-medium text-gray-700 truncate"
                                    title={`${member.nombre} ${member.apellidos}`}
                                  >
                                    {member.nombre} {member.apellidos}
                                  </span>
                                </div>
                                {member.cotizo ? (
                                  <span
                                    className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800"
                                    title="Al día"
                                  >
                                    <CheckCircle size={14} className="mr-1" />{" "}
                                  </span>
                                ) : (
                                  <span
                                    className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800"
                                    title="Pendiente"
                                  >
                                    <BadgeX size={14} className="mr-1" />{" "}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {!isLoadingMembers &&
                      !membersError &&
                      membersStatus.length === 0 && (
                        <div className="text-center py-8 px-4 bg-white rounded-lg border border-dashed border-gray-300 text-sm">
                          <Users
                            size={32}
                            className="mx-auto text-gray-400 mb-2"
                          />
                          <p className="text-gray-500">
                            No hay información de miembros.
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </section>
            )}
          </div>{" "}
          {/* Fin Columna Lateral */}
        </div>{" "}
        {/* Fin Grid Principal */}
      </div>{" "}
      {/* Fin Container */}
    </div> /* Fin Wrapper */
  );
}

export default UserPage;
