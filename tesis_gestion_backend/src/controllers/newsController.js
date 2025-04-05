const newsModel = require("../models/newsModel");
const Joi = require("joi");
// const fs = require("fs"); // Ya no es necesario para Base64
// const path = require("path"); // Ya no es necesario para Base64
// Opcional: Servicio de notificaciones
// const notificationService = require('../services/notificationService');

// Esquema de validación para crear/actualizar noticias
const newsSchema = Joi.object({
  titulo: Joi.string().min(3).max(255).required(),
  contenido: Joi.string().min(10).required(),
  // Añadimos validación opcional para la imagen Base64
  // allow(null, '') permite enviar null o vacío para indicar sin imagen o eliminarla
  imagen_base64: Joi.string().base64().allow(null, "").optional(),
  // Campos para controlar publicación (opcional, si se envían desde el form)
  ispublica: Joi.boolean().optional(),
  publicada: Joi.boolean().optional(),
});

// Esquema para query params de paginación (sin cambios)
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

// Función helper para eliminar archivo de imagen (YA NO ES NECESARIA CON BASE64)
/*
const deleteImageFile = (imageUrl) => {
  // ... código eliminado ...
};
*/

const newsController = {
  // --- Controladores Públicos ---

  /**
   * Lista todas las noticias publicadas (paginado).
   */
  listNews: async (req, res) => {
    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { page, limit } = value;
    const offset = (page - 1) * limit;

    try {
      const [newsItems, totalNews] = await Promise.all([
        newsModel.findAllPublished(limit, offset),
        newsModel.countPublished(),
      ]);
      const totalPages = Math.ceil(totalNews / limit);

      res.status(200).json({
        news: newsItems, // newsItems ya contendrá imagen_base64 desde el modelo
        currentPage: page,
        totalPages,
        totalNews,
      });
    } catch (error) {
      console.error("Error en listNews:", error); // Loguear el error
      res
        .status(500)
        .json({ message: "Error al obtener la lista de noticias." });
    }
  },

  /**
   * Obtiene los detalles de una noticia específica.
   */
  getNewsDetails: async (req, res) => {
    const { newsId } = req.params;
    const id = parseInt(newsId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de noticia inválido." });
    }

    try {
      const newsItem = await newsModel.findById(id);
      // Solo mostrar si está publicada (o si es un admin quien consulta, podríamos cambiar esto)
      if (newsItem && newsItem.publicada) {
        res.status(200).json(newsItem); // newsItem ya contendrá imagen_base64
      } else {
        // Podríamos buscarla igual y devolver 404 si no existe, o 403 si no está publicada y no es admin
        const exists = await newsModel.findById(id);
        if (!exists) {
          res.status(404).json({ message: "Noticia no encontrada." });
        } else {
          res.status(403).json({ message: "Esta noticia no está publicada." });
        }
      }
    } catch (error) {
      console.error(`Error en getNewsDetails (ID: ${id}):`, error); // Loguear el error
      res
        .status(500)
        .json({ message: "Error al obtener los detalles de la noticia." });
    }
  },

  // --- Controladores de Administración ---

  /**
   * Crea una nueva noticia (requiere ser admin).
   * Maneja la imagen como Base64 desde req.body.
   */
  createNews: async (req, res) => {
    // Validar todos los campos del body, incluyendo la imagen base64 opcional
    const { error: validationError, value: validatedData } =
      newsSchema.validate(req.body);
    if (validationError) {
      // No hay archivo que borrar si la validación falla
      return res
        .status(400)
        .json({ message: validationError.details[0].message });
    }

    const adminId = req.user.id; // Asume que authenticateToken añade req.user

    // Los datos validados ya contienen titulo, contenido y opcionalmente imagen_base64, ispublica, publicada
    const newsData = {
      ...validatedData,
      creado_por_admin_id: adminId,
      // Asegurarse de que imagen_base64 sea null si es una cadena vacía,
      // aunque Joi.string().base64().allow(null, '') debería manejarlo.
      imagen_base64: validatedData.imagen_base64 || null,
    };

    try {
      const newNewsItem = await newsModel.create(newsData);

      // Opcional: Notificar sobre nueva noticia
      // await notificationService.notifyNewNews(newNewsItem.id, newNewsItem.titulo);

      res.status(201).json(newNewsItem);
    } catch (error) {
      // Ya no hay archivo que borrar en caso de error de BD
      console.error("Error en createNews:", error); // Loguear el error
      res.status(500).json({ message: "Error al crear la noticia." });
    }
  },

  /**
   * Actualiza una noticia existente (requiere ser admin).
   * Maneja la actualización/eliminación de la imagen Base64.
   */
  updateNews: async (req, res) => {
    const { newsId } = req.params;
    const id = parseInt(newsId, 10);
    if (isNaN(id)) {
      // No hay archivo que borrar
      return res.status(400).json({ message: "ID de noticia inválido." });
    }

    // Validar campos del body (usando el mismo schema, pero los campos son opcionales)
    // Podríamos usar un schema específico para update si las reglas cambian mucho
    const { error: validationError, value: validatedData } =
      newsSchema.validate(req.body, { abortEarly: false }); // Validar todo
    if (validationError) {
      // No hay archivo que borrar
      return res
        .status(400)
        .json({
          message: validationError.details.map((d) => d.message).join(", "),
        });
    }

    // Construir el objeto de datos para actualizar en el modelo
    // Incluir solo los campos que realmente se enviaron en la solicitud
    const dataToUpdate = {};
    if (validatedData.titulo !== undefined)
      dataToUpdate.titulo = validatedData.titulo;
    if (validatedData.contenido !== undefined)
      dataToUpdate.contenido = validatedData.contenido;
    if (validatedData.ispublica !== undefined)
      dataToUpdate.ispublica = validatedData.ispublica;
    if (validatedData.publicada !== undefined)
      dataToUpdate.publicada = validatedData.publicada;

    // Manejo específico para la imagen Base64:
    // Si se envía 'imagen_base64' (incluso vacía o null), se intenta actualizar.
    // Si no se envía, no se toca la imagen existente.
    if (validatedData.imagen_base64 !== undefined) {
      // Si es una cadena vacía o null, la guardamos como null en BD (eliminar imagen)
      // Si es una cadena no vacía, la guardamos tal cual.
      dataToUpdate.imagen_base64 = validatedData.imagen_base64 || null;
    }
    // Alternativa: Podrías tener un campo explícito como req.body.eliminar_imagen === 'true'
    // if (req.body.eliminar_imagen === 'true') {
    //     dataToUpdate.imagen_base64 = null;
    // } else if (validatedData.imagen_base64 !== undefined) { // Solo actualizar si se envió una nueva
    //     dataToUpdate.imagen_base64 = validatedData.imagen_base64;
    // }

    // Verificar si hay algo que actualizar
    if (Object.keys(dataToUpdate).length === 0) {
      return res
        .status(400)
        .json({ message: "No se proporcionaron datos para actualizar." });
    }

    try {
      // Verificar primero si la noticia existe
      const currentNews = await newsModel.findById(id);
      if (!currentNews) {
        // No hay archivo que borrar
        return res
          .status(404)
          .json({ message: "Noticia no encontrada para actualizar." });
      }

      // Actualizar en la base de datos
      const updatedNews = await newsModel.update(id, dataToUpdate);

      if (!updatedNews) {
        // Esto no debería ocurrir si findById funcionó, pero por si acaso
        return res
          .status(404)
          .json({
            message:
              "Noticia no encontrada después del intento de actualización.",
          });
      }

      res
        .status(200)
        .json({
          message: "Noticia actualizada exitosamente.",
          news: updatedNews,
        });
    } catch (error) {
      // Ya no hay archivo que borrar
      console.error(`Error en updateNews (ID: ${id}):`, error); // Loguear el error
      res
        .status(500)
        .json({ message: "Error interno al actualizar la noticia." });
    }
  },

  /**
   * Elimina una noticia (requiere ser admin).
   */
  deleteNews: async (req, res) => {
    const { newsId } = req.params;
    const id = parseInt(newsId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de noticia inválido." });
    }

    try {
      // El modelo ahora solo devuelve { id, imagen_base64 } o null
      const deletedNewsInfo = await newsModel.delete(id);

      if (!deletedNewsInfo) {
        return res
          .status(404)
          .json({ message: `Noticia con ID ${id} no encontrada.` });
      }

      // Ya no necesitamos borrar el archivo físico
      // if (deletedNewsInfo.imagen_base64) {
      //   deleteImageFile(deletedNewsInfo.imagen_base64); // Lógica eliminada
      // }

      res.status(200).json({ message: "Noticia eliminada exitosamente." });
    } catch (error) {
      console.error(`Error en deleteNews (ID: ${id}):`, error); // Loguear el error
      res
        .status(500)
        .json({ message: "Error interno al eliminar la noticia." });
    }
  },

  // --- Añadir aquí más controladores de administración para noticias si es necesario ---
  // Por ejemplo, un controlador para listar TODAS las noticias (publicadas o no) para el admin
  listAllNewsAdmin: async (req, res) => {
    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { page, limit } = value;
    const offset = (page - 1) * limit;

    try {
      // Usar las nuevas funciones del modelo
      const [newsItems, totalNews] = await Promise.all([
        newsModel.findAll(limit, offset), // Obtener todas
        newsModel.countAll(), // Contar todas
      ]);
      const totalPages = Math.ceil(totalNews / limit);

      res.status(200).json({
        news: newsItems,
        currentPage: page,
        totalPages,
        totalNews,
      });
    } catch (error) {
      console.error("Error en listAllNewsAdmin:", error);
      res
        .status(500)
        .json({ message: "Error al obtener la lista completa de noticias." });
    }
  },
};

module.exports = newsController;
