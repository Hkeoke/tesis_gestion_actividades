import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { X, AlertCircle, ImagePlus, Trash2, Loader2 } from "lucide-react";

function NewsModal({
  isOpen,
  onClose,
  newsToEdit,
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
      titulo: "",
      contenido: "",
      ispublica: true,
    },
  });
  const isEditing = Boolean(newsToEdit);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  useEffect(() => {
    reset();
    setImagePreview(null);
    setImageBase64(null);

    if (isOpen && isEditing && newsToEdit) {
      setValue("titulo", newsToEdit.titulo || "");
      setValue("contenido", newsToEdit.contenido || "");
      setValue("ispublica", newsToEdit.ispublica ?? true);
      if (newsToEdit.imagen_url) {
        setImagePreview(newsToEdit.imagen_url);
      }
    } else if (isOpen && !isEditing) {
      setValue("titulo", "");
      setValue("contenido", "");
      setValue("ispublica", true);
    }
  }, [isOpen, isEditing, newsToEdit, setValue, reset]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        console.error("Tipo de archivo no válido");
        event.target.value = null;
        setImagePreview(null);
        setImageBase64(null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setImageBase64(reader.result);
      };
      reader.onerror = (error) => {
        console.error("Error leyendo el archivo:", error);
        setImagePreview(null);
        setImageBase64(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    const fileInput = document.getElementById("imagen");
    if (fileInput) {
      fileInput.value = null;
    }
  };

  const onSubmit = (data) => {
    let finalBase64 = null;
    if (imageBase64 && imageBase64.includes(",")) {
      finalBase64 = imageBase64.split(",")[1];
    }

    const newsData = {
      ...data,
      ...(finalBase64 && { imagen_base64: finalBase64 }),
      ...(!finalBase64 &&
        isEditing &&
        (newsToEdit?.imagen_url || newsToEdit?.imagen_base64) && {
          imagen_base64: null,
        }),
    };

    console.log("Enviando datos:", newsData);
    onSave(newsData);
  };

  if (!isOpen) return null;

  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const inputBaseStyle =
    "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm disabled:bg-gray-100";
  const inputNormalStyle = `${inputBaseStyle} border-gray-300 focus:ring-indigo-500 focus:border-indigo-500`;
  const inputErrorStyle = `${inputBaseStyle} border-red-500 focus:ring-red-500 focus:border-red-500`;
  const checkboxStyle =
    "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";
  const errorMessageStyle = "mt-1 text-xs text-red-600";

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {isEditing ? "Editar Noticia" : "Crear Nueva Noticia"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar modal"
          >
            <X size={24} />
          </button>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            <span>
              {typeof apiError === "string" ? apiError : "Error al guardar."}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="titulo" className={labelStyle}>
              Título*
            </label>
            <input
              type="text"
              id="titulo"
              {...register("titulo", { required: "El título es requerido" })}
              className={errors.titulo ? inputErrorStyle : inputNormalStyle}
              aria-invalid={errors.titulo ? "true" : "false"}
              disabled={isSubmitting}
            />
            {errors.titulo && (
              <p className={errorMessageStyle}>{errors.titulo.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="contenido" className={labelStyle}>
              Contenido*
            </label>
            <textarea
              id="contenido"
              rows="6"
              {...register("contenido", {
                required: "El contenido es requerido",
                minLength: { value: 10, message: "Mínimo 10 caracteres" },
              })}
              className={errors.contenido ? inputErrorStyle : inputNormalStyle}
              aria-invalid={errors.contenido ? "true" : "false"}
              disabled={isSubmitting}
            />
            {errors.contenido && (
              <p className={errorMessageStyle}>{errors.contenido.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen (Opcional)
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <div className="flex-shrink-0 h-20 w-20 rounded border border-gray-300 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Previsualización"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus size={32} className="text-gray-400" />
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <label
                  htmlFor="imagen"
                  className={`cursor-pointer px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {imagePreview ? "Cambiar Imagen" : "Seleccionar Imagen"}
                  <input
                    id="imagen"
                    name="imagen"
                    type="file"
                    className="sr-only"
                    onChange={handleImageChange}
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    disabled={isSubmitting}
                  />
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isSubmitting}
                    className="flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Eliminar Imagen
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 pt-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ispublica"
                {...register("ispublica")}
                className={checkboxStyle}
                disabled={isSubmitting}
              />
              <label
                htmlFor="ispublica"
                className="ml-2 block text-sm text-gray-900"
              >
                ¿Es Pública? (Visible en listados generales)
              </label>
            </div>
          </div>

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
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Crear Noticia"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewsModal;
