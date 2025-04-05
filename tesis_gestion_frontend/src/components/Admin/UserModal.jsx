import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, AlertCircle } from "lucide-react";

// Ya no necesitamos rolesDisponibles aquí, vendrán como prop

function UserModal({
  isOpen,
  onClose,
  userToEdit,
  onSave,
  roles = [],
  apiError,
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();
  const isEditing = Boolean(userToEdit);

  useEffect(() => {
    // Limpia errores del formulario cuando el modal se abre o cierra, o cambia el usuario
    reset({}, { keepErrors: false });

    if (isEditing && userToEdit) {
      // Llena el formulario si estamos editando
      setValue("nombre", userToEdit.nombre || "");
      setValue("apellidos", userToEdit.apellidos || "");
      setValue("nombre_usuario", userToEdit.nombre_usuario || "");
      setValue("email", userToEdit.email || ""); // Añadido email
      setValue("rol_id", userToEdit.rol?.id || ""); // Usa el ID del rol anidado
      // setValue('categoria_id', userToEdit.categoria?.id || ''); // Descomenta si usas categorías
      setValue("aprobado", userToEdit.aprobado || false); // Campo para aprobar/desaprobar
      // No pre-rellenar contraseña
    } else {
      // Limpia el formulario si estamos creando o se cierra
      reset({
        nombre: "",
        apellidos: "",
        nombre_usuario: "",
        email: "", // Añadido email
        password: "", // Contraseña solo relevante para creación (si se implementa)
        rol_id: "",
        // categoria_id: '', // Descomenta si usas categorías
        aprobado: false, // Por defecto no aprobado al crear (si se implementa)
      });
    }
  }, [isOpen, isEditing, userToEdit, setValue, reset]); // reset añadido a dependencias

  const onSubmit = (data) => {
    // Prepara los datos para enviar a la API
    const userData = { ...data };

    // Elimina la contraseña si está vacía y estamos editando
    // O si la creación no está implementada
    if ((isEditing && !userData.password) || !isEditing) {
      delete userData.password;
    }

    // Llama a la función de guardado del padre
    onSave(userData);
    // No cerramos el modal aquí, lo hace el padre (AdminUserPage) si la API tiene éxito
  };

  if (!isOpen) return null;

  // Estilos comunes
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const inputBaseStyle =
    "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm disabled:bg-gray-100";
  const inputNormalStyle = `${inputBaseStyle} border-gray-300 focus:ring-indigo-500 focus:border-indigo-500`;
  const inputErrorStyle = `${inputBaseStyle} border-red-500 focus:ring-red-500 focus:border-red-500`;
  const checkboxStyle =
    "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";
  const errorMessageStyle = "mt-1 text-xs text-red-600";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
            {/* Nota: La creación puede no estar soportada por el backend admin actual */}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mostrar error de API si existe */}
        {apiError && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-6 mt-4"
            role="alert"
          >
            <p className="font-bold">Error al guardar</p>
            <p>
              {typeof apiError === "string"
                ? apiError
                : apiError.message || "Ocurrió un error inesperado."}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className={labelStyle}>
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              {...register("nombre")}
              className={inputNormalStyle}
            />
          </div>

          {/* Apellidos */}
          <div>
            <label htmlFor="apellidos" className={labelStyle}>
              Apellidos
            </label>
            <input
              type="text"
              id="apellidos"
              {...register("apellidos")}
              className={inputNormalStyle}
            />
          </div>

          {/* Nombre de Usuario */}
          <div>
            <label htmlFor="nombre_usuario" className={labelStyle}>
              Usuario*
            </label>
            <input
              type="text"
              id="nombre_usuario"
              {...register("nombre_usuario", {
                required: "El nombre de usuario es requerido",
              })}
              className={
                errors.nombre_usuario ? inputErrorStyle : inputNormalStyle
              }
              aria-invalid={errors.nombre_usuario ? "true" : "false"}
            />
            {errors.nombre_usuario && (
              <p className={errorMessageStyle}>
                {errors.nombre_usuario.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelStyle}>
              Email*
            </label>
            <input
              type="email"
              id="email"
              {...register("email", {
                required: "El email es requerido",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Dirección de email inválida",
                },
              })}
              className={errors.email ? inputErrorStyle : inputNormalStyle}
              aria-invalid={errors.email ? "true" : "false"}
            />
            {errors.email && (
              <p className={errorMessageStyle}>{errors.email.message}</p>
            )}
          </div>

          {/* Contraseña (Solo para creación, si se implementa) */}
          {/* La API updateUser no maneja contraseña, así que este campo es problemático para editar */}
          <div>
            <label htmlFor="password" className={labelStyle}>
              Contraseña {isEditing ? "(No se puede cambiar aquí)" : "*"}
            </label>
            <input
              type="password"
              id="password"
              {...register("password", {
                // Requerido solo si NO estamos editando
                required: !isEditing
                  ? "La contraseña es requerida para nuevos usuarios"
                  : false,
                // Permitir vacío si estamos editando
                minLength: !isEditing
                  ? {
                      value: 6,
                      message: "La contraseña debe tener al menos 6 caracteres",
                    }
                  : undefined,
              })}
              className={errors.password ? inputErrorStyle : inputNormalStyle}
              aria-invalid={errors.password ? "true" : "false"}
              disabled={isEditing} // Deshabilitado al editar
              placeholder={
                isEditing
                  ? "No modificable desde esta pantalla"
                  : "Mínimo 6 caracteres"
              }
            />
            {errors.password && (
              <p className={errorMessageStyle}>{errors.password.message}</p>
            )}
            {isEditing && (
              <p className="mt-1 text-xs text-gray-500">
                La actualización de contraseña requiere un proceso diferente.
              </p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label htmlFor="rol_id" className={labelStyle}>
              Rol*
            </label>
            <select
              id="rol_id"
              {...register("rol_id", { required: "El rol es requerido" })}
              className={errors.rol_id ? inputErrorStyle : inputNormalStyle}
              aria-invalid={errors.rol_id ? "true" : "false"}
            >
              <option value="">Selecciona un rol</option>
              {/* Mapea los roles pasados como prop */}
              {roles && roles.length > 0 ? (
                roles.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Cargando roles...
                </option>
              )}
            </select>
            {errors.rol_id && (
              <p className={errorMessageStyle}>{errors.rol_id.message}</p>
            )}
          </div>

          {/* Categoría (Descomentar si es necesario) */}
          {/* <div>
             <label htmlFor="categoria_id" className={labelStyle}>Categoría Docente</label>
             <select
               id="categoria_id"
               {...register('categoria_id')} // Puede ser opcional
               className={inputNormalStyle}
             >
               <option value="">Selecciona una categoría (Opcional)</option>
               {/* Aquí necesitarías cargar las categorías disponibles */}
          {/* <option value="1">Titular</option> */}
          {/* <option value="2">Asociado</option> */}
          {/* </select> */}
          {/* </div> */}

          {/* Aprobado (Checkbox) */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="aprobado"
              {...register("aprobado")}
              className={checkboxStyle}
            />
            <label
              htmlFor="aprobado"
              className="ml-2 block text-sm text-gray-900"
            >
              Usuario Aprobado
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {isEditing ? "Guardar Cambios" : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserModal;
