import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  X,
  AlertCircle,
  Loader2,
  FileText,
  Type,
  CheckSquare,
} from "lucide-react"; // Iconos relevantes

function ConvocatoriaModal({
  isOpen,
  onClose,
  convocatoriaToEdit, // null si es para crear, objeto convocatoria si es para editar
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
      publico: true, // Por defecto, las convocatorias son públicas
    },
  });
  const isEditing = Boolean(convocatoriaToEdit);

  useEffect(() => {
    // Resetear formulario cuando cambia el estado de apertura o la convocatoria a editar
    reset(); // Limpia errores y valores

    if (isOpen && isEditing && convocatoriaToEdit) {
      // Llenar formulario si estamos editando
      setValue("titulo", convocatoriaToEdit.titulo || "");
      setValue("descripcion", convocatoriaToEdit.descripcion || "");
      setValue("publico", convocatoriaToEdit.publico ?? true); // Usar ?? para default
    } else if (isOpen && !isEditing) {
      // Valores por defecto para creación (ya establecidos en useForm, pero re-aseguramos)
      setValue("titulo", "");
      setValue("descripcion", "");
      setValue("publico", true);
    }
  }, [isOpen, isEditing, convocatoriaToEdit, setValue, reset]);

  const onSubmit = (data) => {
    // Prepara los datos para enviar a la API
    const convocatoriaData = {
      ...data,
      publico: Boolean(data.publico), // Asegurar que sea booleano
    };
    onSave(convocatoriaData); // Llama a la función onSave pasada como prop
  };

  // Estilos comunes (puedes moverlos a un archivo CSS/Tailwind config si se repiten mucho)
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const inputBaseStyle =
    "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm";
  const inputNormalStyle = `${inputBaseStyle} border-gray-300 focus:ring-indigo-500 focus:border-indigo-500`;
  const inputErrorStyle = `${inputBaseStyle} border-red-500 focus:ring-red-500 focus:border-red-500`;
  const errorMessageStyle = "mt-1 text-xs text-red-600";
  const checkboxStyle =
    "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-75 flex justify-center items-center p-4"
      onClick={onClose} // Cierra al hacer clic fuera (opcional)
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro cierre el modal
      >
        {/* Botón de Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar modal"
        >
          <X size={24} />
        </button>

        {/* Título del Modal */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FileText size={22} className="mr-2" />
          {isEditing ? "Editar Convocatoria" : "Crear Nueva Convocatoria"}
        </h2>

        {/* Mensaje de Error de API */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertCircle size={18} className="mr-2" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            {/* Título */}
            <div>
              <label htmlFor="titulo" className={labelStyle}>
                <Type size={14} className="inline mr-1" /> Título
              </label>
              <input
                type="text"
                id="titulo"
                {...register("titulo", {
                  required: "El título es obligatorio",
                })}
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
                {...register("descripcion")} // Puede ser opcional
                className={inputNormalStyle} // No marcamos error si es opcional
                disabled={isSubmitting}
              />
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
                <CheckSquare size={14} className="inline mr-1" />
                ¿Convocatoria Pública? (Visible para todos los usuarios)
              </label>
            </div>
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
                "Crear Convocatoria"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConvocatoriaModal;
