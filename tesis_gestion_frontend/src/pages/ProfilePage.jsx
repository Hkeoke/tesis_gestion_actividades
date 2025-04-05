import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  UserCheck,
  Shield,
  LogOut,
  Edit,
  BookOpen,
  Hash,
  Bookmark,
  GraduationCap,
} from "lucide-react";

function ProfilePage() {
  const { user, logout } = useAuth();
  console.log(user);

  // Si aún está cargando o no hay usuario (aunque la ruta debería estar protegida)
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="h-32 w-32 bg-white rounded-full flex items-center justify-center mb-4 md:mb-0 md:mr-6 flex-shrink-0 shadow-lg">
              <User size={64} className="text-indigo-600" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-white">
                {user.nombre || ""} {user.apellidos || ""}
              </h1>
              <p className="text-indigo-200 text-lg mt-1">
                @{user.nombre_usuario}
              </p>
              <div className="mt-2 inline-block bg-indigo-700 text-white px-3 py-1 rounded-full text-sm">
                <Shield size={14} className="inline mr-1" />{" "}
                {user.nombre_rol || `Rol ID: ${user.rol_id}`}
              </div>
              {user.categoria && (
                <div className="mt-2 ml-2 inline-block bg-indigo-700 text-white px-3 py-1 rounded-full text-sm">
                  <GraduationCap size={14} className="inline mr-1" />{" "}
                  {user.categoria}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
                <UserCheck className="mr-2 text-indigo-600" size={20} />
                Información Personal
              </h2>

              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Mail className="mr-3 text-indigo-500" size={18} />
                  <span className="font-medium mr-2">Email:</span>
                  <span>{user.email}</span>
                </div>

                <div className="flex items-center text-gray-700">
                  <User className="mr-3 text-indigo-500" size={18} />
                  <span className="font-medium mr-2">Nombre Completo:</span>
                  <span>
                    {user.nombre && user.apellidos
                      ? `${user.nombre} ${user.apellidos}`
                      : "No especificado"}
                  </span>
                </div>

                <div className="flex items-center text-gray-700">
                  <Hash className="mr-3 text-indigo-500" size={18} />
                  <span className="font-medium mr-2">Usuario:</span>
                  <span>{user.nombre_usuario}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
                <BookOpen className="mr-2 text-indigo-600" size={20} />
                Información Académica
              </h2>

              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Shield className="mr-3 text-indigo-500" size={18} />
                  <span className="font-medium mr-2">Rol:</span>
                  <span>{user.nombre_rol || `ID ${user.rol_id}`}</span>
                </div>

                <div className="flex items-center text-gray-700">
                  <GraduationCap className="mr-3 text-indigo-500" size={18} />
                  <span className="font-medium mr-2">Categoría Docente:</span>
                  <span>
                    {user.categoria
                      ? user.categoria
                      : user.categoria_id
                      ? `${user.categoria}`
                      : "No asignada"}
                  </span>
                </div>

                {user.subcategoria_admin_id && (
                  <div className="flex items-center text-gray-700">
                    <Bookmark className="mr-3 text-indigo-500" size={18} />
                    <span className="font-medium mr-2">
                      Subcategoría Admin:
                    </span>
                    <span>
                      {user.subcategoria_admin_nombre ||
                        `ID ${user.subcategoria_admin_id}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 flex items-center justify-center">
              <Edit size={18} className="mr-2" />
              Editar Perfil
            </button>

            <button
              onClick={logout}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200 flex items-center justify-center"
            >
              <LogOut size={18} className="mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
