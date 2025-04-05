const categoryRequestModel = require("../models/categoryRequestModel");
const fs = require("fs"); // Para manejar archivos si falla la creación en BD
const path = require("path");

const professorController = {
  /**
   * Crea una nueva solicitud de cambio de categoría.
   */
  createCategoryRequest: async (req, res) => {
    const usuarioId = req.user.id; // Obtenido del token autenticado
    const { categoria_solicitada_id, publicaciones } = req.body; // publicaciones debería ser un array de { url, descripcion } en JSON string o como campos separados
    const documentos = req.files; // Array de archivos subidos por Multer

    // Validación básica
    if (!categoria_solicitada_id) {
      return res
        .status(400)
        .json({ message: "El ID de la categoría solicitada es requerido." });
    }
    // Validar que categoria_solicitada_id existe en la tabla categorias (pendiente)

    let parsedPublicaciones = [];
    if (publicaciones) {
      try {
        // Si viene como JSON string
        if (typeof publicaciones === "string") {
          parsedPublicaciones = JSON.parse(publicaciones);
        } else if (Array.isArray(publicaciones)) {
          // Si ya viene como array (depende de cómo lo envíe el frontend)
          parsedPublicaciones = publicaciones;
        }
        // Validar que parsedPublicaciones es un array de objetos con 'url'
        if (
          !Array.isArray(parsedPublicaciones) ||
          !parsedPublicaciones.every((p) => typeof p === "object" && p.url)
        ) {
          throw new Error("Formato de publicaciones inválido.");
        }
      } catch (error) {
        // Si falla el parseo o validación, limpiar archivos subidos si existen
        if (documentos && documentos.length > 0) {
          documentos.forEach((file) =>
            fs.unlink(file.path, (err) => {
              if (err) console.error("Error borrando archivo tras fallo:", err);
            })
          );
        }
        return res
          .status(400)
          .json({
            message:
              'Formato de publicaciones inválido. Debe ser un array de objetos [{url: "...", descripcion: "..."}].',
            error: error.message,
          });
      }
    }

    const documentosData = documentos
      ? documentos.map((file) => ({
          nombre_archivo: file.originalname,
          path_archivo: file.path, // Ruta donde Multer guardó el archivo
          tipo_mime: file.mimetype,
          tamano_bytes: file.size,
        }))
      : [];

    try {
      const nuevaSolicitud = await categoryRequestModel.create(
        usuarioId,
        categoria_solicitada_id,
        documentosData,
        parsedPublicaciones
      );
      res
        .status(201)
        .json({
          message: "Solicitud creada exitosamente.",
          solicitud: nuevaSolicitud,
        });
    } catch (error) {
      console.error("Error en controller createCategoryRequest:", error);
      // Si ocurre un error al guardar en la BD, intentar borrar los archivos físicos que se subieron
      if (documentosData.length > 0) {
        documentosData.forEach((doc) => {
          fs.unlink(doc.path_archivo, (err) => {
            if (err)
              console.error(
                `Error al intentar borrar archivo ${doc.path_archivo} tras fallo en BD:`,
                err
              );
          });
        });
      }
      res
        .status(500)
        .json({ message: "Error interno del servidor al crear la solicitud." });
    }
  },

  /**
   * Obtiene el historial de solicitudes de cambio de categoría del usuario autenticado.
   */
  getMyCategoryRequests: async (req, res) => {
    const usuarioId = req.user.id;
    try {
      const solicitudes = await categoryRequestModel.findByUserId(usuarioId);
      res.status(200).json(solicitudes);
    } catch (error) {
      console.error("Error obteniendo historial de solicitudes:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  },

  // --- Añadir aquí más controladores para profesores ---
};

module.exports = professorController;
