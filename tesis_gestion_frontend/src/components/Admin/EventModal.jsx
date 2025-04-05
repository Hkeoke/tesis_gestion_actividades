import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, AlertCircle, Calendar, MapPin, Loader2 } from "lucide-react";

// Función helper para formatear fecha ISO a YYYY-MM-DDTHH:mm (para input datetime-local)
const formatISOToInput = (isoString) => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    // slice(0, 16) obtiene 'YYYY-MM-DDTHH:mm'
    return date.toISOString().slice(0, 16);
  } catch (e) {
    console.error("Error formatting date for input:", e);
    return "";
  }
};

// Función helper para formatear fecha de input a ISO String (YYYY-MM-DDTHH:mm:ssZ)
const formatInputToISO = (inputString) => {
  if (!inputString) return null;
  try {
    // El input da YYYY-MM-DDTHH:mm. Creamos un objeto Date y lo convertimos a ISO.
    const date = new Date(inputString);
    return date.toISOString();
  } catch (e) {
    console.error("Error formatting date to ISO:", e);
    return null;
  }
};

function EventModal({
  isOpen,
  onClose,
  eventToEdit, // null si es para crear, objeto evento si es para editar
  onSave, // Función para manejar el guardado (create/update)
  apiError, // Errores de la API al guardar
  isSubmitting, // Estado de carga al guardar
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      titulo: "",
      descripcion: "",
      fecha_evento: "", // Se formateará a YYYY-MM-DDTHH:mm
      ubicacion: "",
      publico: true,
    },
  });
  const isEditing = Boolean(eventToEdit);

  useEffect(() => {
    reset(); // Limpia errores y valores
    if (isOpen) {
      if (isEditing && eventToEdit) {
        // Llenar formulario si estamos editando
        setValue("titulo", eventToEdit.titulo || "");
        setValue("descripcion", eventToEdit.descripcion || "");
        // Formatear fecha ISO a formato de input
        setValue("fecha_evento", formatISOToInput(eventToEdit.fecha_evento));
        setValue("ubicacion", eventToEdit.ubicacion || "");
        setValue("publico", eventToEdit.publico ?? true); // Usar ?? para default
      } else {
        // Valores por defecto para creación (ya establecidos, pero re-aseguramos)
        setValue("titulo", "");
        setValue("descripcion", "");
        setValue("fecha_evento", "");
        setValue("ubicacion", "");
        setValue("publico", true);
      }
    }
  }, [isOpen, isEditing, eventToEdit, reset, setValue]);

  const onSubmit = (data) => {
    // Formatear la fecha de vuelta a ISO antes de enviar
    const dataToSend = {
      ...data,
      fecha_evento: formatInputToISO(data.fecha_evento),
    };
    onSave(dataToSend); // Llama a la función onSave del padre
  };

  // Estilos comunes (puedes externalizarlos si prefieres)
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const inputBaseStyle =
    "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100";
  const inputNormalStyle = `${inputBaseStyle}`;
  const inputErrorStyle = `${inputBaseStyle} border-red-500 focus:ring-red-500 focus:border-red-500`;
  const errorMessageStyle = "mt-1 text-xs text-red-600";
  const checkboxStyle =
    "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? "Editar Evento" : "Crear Nuevo Evento"}
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
                {typeof apiError === "string" ? apiError : "Error al guardar."}
              </span>
            </div>
          )}

          {/* Título */}
          <div>
            <label htmlFor="titulo" className={labelStyle}>
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="titulo"
              {...register("titulo", { required: "El título es obligatorio" })}
              className={errors.titulo ? inputErrorStyle : inputNormalStyle}
              disabled={isSubmitting}
            />
            {errors.titulo && (
              <p className={errorMessageStyle}>{errors.titulo.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className={labelStyle}>
              Descripción
            </label>
            <textarea
              id="descripcion"
              rows="4"
              {...register("descripcion")}
              className={inputNormalStyle} // No suele tener error de formato
              disabled={isSubmitting}
            />
            {/* No suele haber errores de validación aquí si es opcional */}
          </div>

          {/* Fecha y Hora */}
          <div>
            <label htmlFor="fecha_evento" className={labelStyle}>
              Fecha y Hora del Evento <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="datetime-local" // Input para fecha y hora
                id="fecha_evento"
                {...register("fecha_evento", {
                  required: "La fecha y hora son obligatorias",
                  validate: (value) =>
                    !!formatInputToISO(value) || "Formato de fecha inválido",
                })}
                className={`${
                  errors.fecha_evento ? inputErrorStyle : inputNormalStyle
                } pl-10`} // Padding izquierdo para icono
                disabled={isSubmitting}
              />
            </div>
            {errors.fecha_evento && (
              <p className={errorMessageStyle}>{errors.fecha_evento.message}</p>
            )}
          </div>

          {/* Ubicación */}
          <div>
            <label htmlFor="ubicacion" className={labelStyle}>
              Ubicación
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="ubicacion"
                {...register("ubicacion")}
                className={`${inputNormalStyle} pl-10`}
                disabled={isSubmitting}
              />
            </div>
            {/* No suele haber errores de validación aquí si es opcional */}
          </div>

          {/* Checkbox Público */}
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id="publico"
              {...register("publico")}
              className={checkboxStyle}
              disabled={isSubmitting}
            />
            <label
              htmlFor="publico"
              className="ml-2 block text-sm text-gray-900"
            >
              ¿Evento Público? (Visible para todos los usuarios)
            </label>
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Crear Evento"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventModal;
