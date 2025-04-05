import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage"; // Asegúrate de importar HomePage
import AdminPage from "./pages/Admin/AdminPage"; // Importa AdminPage
import UserPage from "./pages/User/UserPage"; // Importa UserPage
import MainLayout from "./components/layout/MainLayout"; // Importa MainLayout
import AdminUserPage from "./pages/Admin/AdminUserPage"; // Importa la nueva página
import AdminApprovalPage from "./pages/Admin/AdminApprovalPage"; // <-- Importa la nueva página
import AdminNewsPage from "./pages/Admin/AdminNewsPage"; // <-- Importa la página de noticias
import AdminEventPage from "./pages/Admin/AdminEventPage"; // <-- Importar página de eventos
import AdminConvocatoriasPage from "./pages/Admin/AdminConvocatoriasPage"; // <-- Importar nueva página
import AdminPlanningPage from "./pages/Admin/AdminPlanningPage"; // <-- Importar página de planificación para admin
import AdminSobrecargaPage from "./pages/Admin/AdminSobrecargaPage"; // <-- Importar página de sobrecarga docente
import PlanningPage from "./pages/User/PlanningPage"; // <-- Importar página de planificación para usuario

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>; // O un spinner/layout de carga
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Nuevo componente para envolver rutas con el layout
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <MainLayout>
        {/* Outlet renderizará la ruta hija (AdminPage, UserPage, ProfilePage) */}
        <Outlet />
      </MainLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas Protegidas con Layout */}
          <Route element={<ProtectedLayout />}>
            {" "}
            {/* Elemento padre para layout */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/users" element={<AdminUserPage />} />
            <Route path="/approvals" element={<AdminApprovalPage />} />
            <Route path="/adminnews" element={<AdminNewsPage />} />
            <Route path="/adminevents" element={<AdminEventPage />} />
            <Route
              path="/adminconvocatorias"
              element={<AdminConvocatoriasPage />}
            />
            <Route path="/adminplanning" element={<AdminPlanningPage />} />
            <Route path="/adminsobrecarga" element={<AdminSobrecargaPage />} />
            <Route path="/user" element={<UserPage />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* Añade aquí más rutas que usen el MainLayout */}
            {/* Ejemplo: <Route path="/admin/users" element={<ManageUsersPage />} /> */}
          </Route>

          {/* Ruta para manejar 404 */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
