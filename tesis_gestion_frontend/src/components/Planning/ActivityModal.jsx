import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  X,
  AlertCircle,
  Calendar,
  Loader2,
  BookOpen,
  Users,
  Clock,
  FileEdit,
} from "lucide-react";

// Formatear fecha para el input date (YYYY-MM-DD)
const formatDateForInput = (isoString) => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toISOString().split("T")[0]; // Devuelve solo YYYY-MM-DD
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "";
  }
};

function ActivityModal({
  isOpen,
  onClose,
  activityToEdit,
  activityTypes = [],
  onSave,
  apiError,
  isSubmitting,
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      tipo_actividad_id: "",
      fecha: formatDateForInput(new Date()),
      horas_dedicadas: "",
      grupo_clase: "",
      cantidad_estudiantes: "",
      descripcion_adicional: "",
    },
  });

  // Vigilar el tipo de actividad seleccionada para saber si requiere grupo o estudiantes
  const selectedActivityTypeId = watch("tipo_actividad_id");
  const selectedActivityType = activityTypes.find(
    (type) => type.id === parseInt(selectedActivityTypeId, 10)
  );

  const isEditing = Boolean(activityToEdit);

  useEffect(() => {
    if (isOpen) {
      reset(); // Limpia el formulario y errores

      if (isEditing && activityToEdit) {
        // Llenar el formulario con los datos de la actividad a editar
        setValue(
          "tipo_actividad_id",
          activityToEdit.tipo_actividad_id?.toString() || ""
        );
        setValue("fecha", formatDateForInput(activityToEdit.fecha));
        setValue(
          "horas_dedicadas",
          activityToEdit.horas_dedicadas?.toString() || ""
        );
        setValue("grupo_clase", activityToEdit.grupo_clase || "");
        setValue(
          "cantidad_estudiantes",
          activityToEdit.cantidad_estudiantes?.toString() || ""
        );
        setValue(
          "descripcion_adicional",
          activityToEdit.descripcion_adicional || ""
        );
      } else {
        // Valores por defecto para nueva actividad
        setValue("tipo_actividad_id", "");
        setValue("fecha", formatDateForInput(new Date()));
        setValue("horas_dedicadas", "");
        setValue("grupo_clase", "");
        setValue("cantidad_estudiantes", "");
        setValue("descripcion_adicional", "");
      }
    }
  }, [isOpen, isEditing, activityToEdit, setValue, reset]);

  const onSubmit = (data) => {
    // Convertir valores numéricos
    const formattedData = {
      ...data,
      tipo_actividad_id: parseInt(data.tipo_actividad_id, 10),
      horas_dedicadas: parseFloat(data.horas_dedicadas),
      cantidad_estudiantes: data.cantidad_estudiantes
        ? parseInt(data.cantidad_estudiantes, 10)
        : null,
      // La fecha ya está en formato YYYY-MM-DD
    };

    onSave(formattedData);
  };

  if (!isOpen) return null;

  // Estilos comunes
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const inputBaseStyle =
    "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100";
  const inputNormalStyle = `${inputBaseStyle}`;
  const inputErrorStyle = `${inputBaseStyle} border-red-500 focus:ring-red-500 focus:border-red-500`;
  const errorMessageStyle = "mt-1 text-xs text-red-600";

  // Determinar si el tipo de actividad requiere grupo o estudiantes
  const requiresGroup = selectedActivityType?.requiere_grupo || false;
  const requiresStudents = selectedActivityType?.requiere_estudiantes || false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FileEdit className="mr-2" size={22} />
            {isEditing ? "Editar Actividad" : "Registrar Nueva Actividad"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Mensaje de Error API */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
              <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              <span>
                {typeof apiError === "string"
                  ? apiError
                  : "Error al guardar la actividad."}
              </span>
            </div>
          )}

          {/* Tipo de Actividad */}
          <div>
            <label htmlFor="tipo_actividad_id" className={labelStyle}>
              <BookOpen size={16} className="inline mr-2" />
              Tipo de Actividad <span className="text-red-500">*</span>
            </label>
            <select
              id="tipo_actividad_id"
              {...register("tipo_actividad_id", {
                required: "Debes seleccionar un tipo de actividad",
              })}
              className={
                errors.tipo_actividad_id ? inputErrorStyle : inputNormalStyle
              }
              disabled={isSubmitting || (isEditing && true)} // No permitir cambiar el tipo al editar
            >
              <option value="">Selecciona un tipo de actividad</option>
              {activityTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nombre}
                </option>
              ))}
            </select>
            {errors.tipo_actividad_id && (
              <p className={errorMessageStyle}>
                {errors.tipo_actividad_id.message}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="fecha" className={labelStyle}>
              <Calendar size={16} className="inline mr-2" />
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="fecha"
              {...register("fecha", {
                required: "La fecha es obligatoria",
              })}
              className={errors.fecha ? inputErrorStyle : inputNormalStyle}
              disabled={isSubmitting}
            />
            {errors.fecha && (
              <p className={errorMessageStyle}>{errors.fecha.message}</p>
            )}
          </div>

          {/* Horas Dedicadas */}
          <div>
            <label htmlFor="horas_dedicadas" className={labelStyle}>
              <Clock size={16} className="inline mr-2" />
              Horas Dedicadas <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="horas_dedicadas"
              step="0.1"
              min="0.1"
              {...register("horas_dedicadas", {
                required: "Debes especificar las horas dedicadas",
                min: {
                  value: 0.1,
                  message: "Las horas deben ser mayores a 0",
                },
                validate: {
                  isNumber: (value) =>
                    !isNaN(value) || "Debe ser un número válido",
                },
              })}
              className={
                errors.horas_dedicadas ? inputErrorStyle : inputNormalStyle
              }
              disabled={isSubmitting}
            />
            {errors.horas_dedicadas && (
              <p className={errorMessageStyle}>
                {errors.horas_dedicadas.message}
              </p>
            )}
          </div>

          {/* Grupo (condicional según el tipo de actividad) */}
          <div>
            <label htmlFor="grupo_clase" className={labelStyle}>
              Grupo de Clase
              {requiresGroup && <span className="text-red-500"> *</span>}
            </label>
            <input
              type="text"
              id="grupo_clase"
              {...register("grupo_clase", {
                required: requiresGroup
                  ? "Debes especificar el grupo para este tipo de actividad"
                  : false,
              })}
              className={
                errors.grupo_clase ? inputErrorStyle : inputNormalStyle
              }
              disabled={isSubmitting}
              placeholder={
                requiresGroup
                  ? "Ej: 2023-2-Grupo1, Tercer Año, etc."
                  : "No requerido para este tipo de actividad"
              }
            />
            {errors.grupo_clase && (
              <p className={errorMessageStyle}>{errors.grupo_clase.message}</p>
            )}
          </div>

          {/* Cantidad de Estudiantes (condicional según el tipo de actividad) */}
          <div>
            <label htmlFor="cantidad_estudiantes" className={labelStyle}>
              <Users size={16} className="inline mr-2" />
              Cantidad de Estudiantes
              {requiresStudents && <span className="text-red-500"> *</span>}
            </label>
            <input
              type="number"
              id="cantidad_estudiantes"
              min="1"
              {...register("cantidad_estudiantes", {
                required: requiresStudents
                  ? "Debes especificar la cantidad de estudiantes para este tipo de actividad"
                  : false,
                min: {
                  value: 1,
                  message: "Debe haber al menos 1 estudiante",
                },
                validate: {
                  isInteger: (value) =>
                    !requiresStudents ||
                    !value ||
                    Number.isInteger(parseFloat(value)) ||
                    "Debe ser un número entero",
                },
              })}
              className={
                errors.cantidad_estudiantes ? inputErrorStyle : inputNormalStyle
              }
              disabled={isSubmitting}
              placeholder={
                requiresStudents
                  ? "Número de estudiantes"
                  : "No requerido para este tipo de actividad"
              }
            />
            {errors.cantidad_estudiantes && (
              <p className={errorMessageStyle}>
                {errors.cantidad_estudiantes.message}
              </p>
            )}
          </div>

          {/* Descripción Adicional */}
          <div>
            <label htmlFor="descripcion_adicional" className={labelStyle}>
              Descripción Adicional (Opcional)
            </label>
            <textarea
              id="descripcion_adicional"
              rows="3"
              {...register("descripcion_adicional")}
              className={inputNormalStyle}
              disabled={isSubmitting}
              placeholder="Detalles adicionales sobre la actividad..."
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Registrar Actividad"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ActivityModal;
