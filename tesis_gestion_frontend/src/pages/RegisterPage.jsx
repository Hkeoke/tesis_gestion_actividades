import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { listCategoriasApi } from "../services/generalApi";
import {
  Eye,
  EyeOff,
  User,
  Users,
  UserCircle,
  KeyRound,
  Tag,
  Loader2,
} from "lucide-react";

function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();
  const { signup, isAuthenticated, authErrors } = useAuth();
  const navigate = useNavigate();
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [errorCategorias, setErrorCategorias] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/profile");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchCategorias = async () => {
      setLoadingCategorias(true);
      setErrorCategorias(null);
      try {
        const data = await listCategoriasApi();
        console.log(data);
        setCategorias(data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setErrorCategorias("No se pudieron cargar las categorías.");
        setCategorias([]);
      } finally {
        setLoadingCategorias(false);
      }
    };
    fetchCategorias();
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    const userData = {
      ...data,
      email: `${data.nombre_usuario}@uci.cu`,
      categoria_id: data.categoria_id ? parseInt(data.categoria_id, 10) : null,
      subcategoria_admin_id: data.subcategoria_admin_id
        ? parseInt(data.subcategoria_admin_id, 10)
        : null,
    };

    try {
      const response = await signup(userData);
      setRegistrationMessage(response.message);
    } catch (error) {
      setRegistrationMessage("");
    }
  });

  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const inputBaseStyle =
    "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm";
  const inputNormalStyle = `${inputBaseStyle} border-gray-300 focus:ring-indigo-500 focus:border-indigo-500`;
  const inputErrorStyle = `${inputBaseStyle} border-red-500 focus:ring-red-500 focus:border-red-500`;
  const errorMessageStyle = "mt-1 text-xs text-red-600";
  const iconStyle =
    "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400";
  const inputWithLeftIconStyle = "pl-10";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="p-8 max-w-xl w-full bg-white rounded-xl border border-gray-200 shadow-xl space-y-6">
        <h2 className="text-3xl font-extrabold text-center text-gray-900">
          Registro de Nuevo Usuario
        </h2>
        {registrationMessage && (
          <div
            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md"
            role="alert"
          >
            <p className="font-medium">¡Éxito!</p>
            <p>{registrationMessage}</p>
          </div>
        )}
        {authErrors && authErrors.length > 0 && !registrationMessage && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"
            role="alert"
          >
            <p className="font-medium">Error de Registro</p>
            {authErrors.map((error, i) => (
              <p key={i}>{error}</p>
            ))}
          </div>
        )}
        {!registrationMessage && (
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="nombre" className={labelStyle}>
                Nombre
              </label>
              <div className="relative mt-1">
                <div className={iconStyle}>
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  id="nombre"
                  {...register("nombre")}
                  className={`${inputNormalStyle} ${inputWithLeftIconStyle}`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="apellidos" className={labelStyle}>
                Apellidos
              </label>
              <div className="relative mt-1">
                <div className={iconStyle}>
                  <Users className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  id="apellidos"
                  {...register("apellidos")}
                  className={`${inputNormalStyle} ${inputWithLeftIconStyle}`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="nombre_usuario" className={labelStyle}>
                Usuario*
              </label>
              <div className="relative mt-1">
                <div className={iconStyle}>
                  <UserCircle className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  id="nombre_usuario"
                  {...register("nombre_usuario", {
                    required: "El nombre de usuario es requerido",
                  })}
                  className={`${
                    errors.nombre_usuario ? inputErrorStyle : inputNormalStyle
                  } ${inputWithLeftIconStyle}`}
                  aria-invalid={errors.nombre_usuario ? "true" : "false"}
                />
              </div>
              {errors.nombre_usuario && (
                <p className={errorMessageStyle}>
                  {errors.nombre_usuario.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className={labelStyle}>
                Contraseña*
              </label>
              <div className="relative mt-1">
                <div className={iconStyle}>
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  {...register("password", {
                    required: "La contraseña es requerida",
                    minLength: {
                      value: 6,
                      message: "La contraseña debe tener al menos 6 caracteres",
                    },
                  })}
                  className={`${
                    errors.password ? inputErrorStyle : inputNormalStyle
                  } ${inputWithLeftIconStyle} pr-10`}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className={errorMessageStyle}>{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="categoria_id" className={labelStyle}>
                Categoría Docente (Opcional)
              </label>
              <div className="relative mt-1">
                <div className={iconStyle}>
                  {loadingCategorias ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Tag className="h-5 w-5" />
                  )}
                </div>
                <select
                  id="categoria_id"
                  {...register("categoria_id")}
                  className={`${inputNormalStyle} ${inputWithLeftIconStyle} appearance-none`}
                  disabled={loadingCategorias || errorCategorias}
                >
                  <option value="">
                    {loadingCategorias
                      ? "Cargando categorías..."
                      : errorCategorias
                      ? "Error al cargar"
                      : "Selecciona una categoría"}
                  </option>
                  {!loadingCategorias &&
                    !errorCategorias &&
                    categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              {errorCategorias && !loadingCategorias && (
                <p className={errorMessageStyle}>{errorCategorias}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              Registrarse
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
