import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserCircle, KeyRound } from "lucide-react";

function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { signin, isAuthenticated, authErrors, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const isAdmin = user?.nombre_rol?.toLowerCase() === "administrador";
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  const onSubmit = handleSubmit(async (data) => {
    await signin(data);
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 max-w-md w-full bg-white rounded-lg border border-gray-200 shadow-md space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Iniciar Sesión
        </h2>

        {authErrors && authErrors.length > 0 && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            {authErrors.map((error, i) => (
              <span key={i} className="block sm:inline">
                {error}
              </span>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="nombre_usuario" className={labelStyle}>
              Usuario
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
                placeholder="tu_usuario"
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
              Contraseña
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
                })}
                className={`${
                  errors.password ? inputErrorStyle : inputNormalStyle
                } ${inputWithLeftIconStyle} pr-10`}
                placeholder="********"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? "Cargando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
