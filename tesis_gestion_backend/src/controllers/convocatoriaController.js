const convocatoriaModel = require("../models/convocatoriaModel");
const Joi = require("joi");

// Esquema de validación para crear/actualizar convocatorias
const convocatoriaSchema = Joi.object({
  titulo: Joi.string().min(3).max(255).required(),
  descripcion: Joi.string().allow(null, ""), // Permitir descripción vacía
  publico: Joi.boolean().optional(), // << Usamos la columna 'publico'
});

const convocatoriaController = {
  // --- Controladores Públicos ---

  /**
   * Lista todos los eventos marcados como PÚBLICOS (paginado).
   */
  listEvents: async (req, res) => {
    try {
      // Usar las funciones del modelo para convocatorias públicas
      const [convocatorias, totalConvocatorias] = await Promise.all([
        convocatoriaModel.findAll(), // << Usa findAllPublic
        convocatoriaModel.countAll(), // << Usa countPublic
      ]);

      res.status(200).json({
        convocatorias,
        totalConvocatorias,
      });
    } catch (error) {
      console.error("Error en listEvents:", error);
      res.status(500).json({
        message: "Error al obtener la lista de convocatorias públicas.",
      });
    }
  },

  /**
   * Obtiene los detalles de un evento específico si está marcado como público.
   */
  getConvocatoriaDetails: async (req, res) => {
    const { convocatoriaId } = req.params;
    const id = parseInt(convocatoriaId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de convocatoria inválido." });
    }

    try {
      const convocatoria = await convocatoriaModel.findById(id); // Obtiene la convocatoria

      // Verificar si existe y si es público antes de devolverlo
      if (convocatoria && convocatoria.publico) {
        // << Verifica la columna 'publico'
        res.status(200).json(convocatoria);
      } else if (convocatoria && !convocatoria.publico) {
        // Existe pero no es público
        res
          .status(404)
          .json({ message: "Convocatoria no encontrada o no es pública." });
      } else {
        // No existe
        res.status(404).json({ message: "Convocatoria no encontrada." });
      }
    } catch (error) {
      console.error(`Error en getConvocatoriaDetails (ID: ${id}):`, error);
      res
        .status(500)
        .json({ message: "Error al obtener los detalles de la convocatoria." });
    }
  },

  // --- Controladores de Administración ---

  /**
   * Crea un nuevo evento (requiere ser admin).
   */
  createConvocatoria: async (req, res) => {
    const { error, value } = convocatoriaSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      // Pasar el valor de 'publico' del cuerpo validado
      const newConvocatoria = await convocatoriaModel.create(
        value.titulo,
        value.descripcion,

        value.publico // Pasar el valor de 'publico' (será undefined si no se envió, el modelo usará su default)
      );
      // Opcional: Notificar sobre nuevo evento
      // await notificationService.notifyNewEvent(newEvent.id, newEvent.titulo);
      res.status(201).json(newConvocatoria);
    } catch (error) {
      console.error("Error en createConvocatoria:", error);
      res.status(500).json({ message: "Error al crear la convocatoria." });
    }
  },

  /**
   * Actualiza un evento existente (requiere ser admin).
   */
  updateConvocatoria: async (req, res) => {
    const { convocatoriaId } = req.params;
    const id = parseInt(convocatoriaId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de convocatoria inválido." });
    }

    // Validar el cuerpo de la solicitud (incluye 'publico' opcional)
    const { error, value } = convocatoriaSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // 'value' contiene solo los campos validados que se enviaron
    const dataToUpdate = value;

    try {
      // El modelo ahora maneja la actualización dinámica de campos
      const updatedConvocatoria = await convocatoriaModel.update(
        id,
        dataToUpdate
      );

      if (updatedConvocatoria) {
        res.status(200).json(updatedConvocatoria);
      } else {
        // El modelo devuelve null si el ID no se encontró
        res
          .status(404)
          .json({ message: "Convocatoria no encontrada para actualizar." });
      }
    } catch (error) {
      console.error(`Error en updateConvocatoria (ID: ${id}):`, error);
      res.status(500).json({ message: "Error al actualizar la convocatoria." });
    }
  },

  /**
   * Elimina un evento (requiere ser admin).
   */
  deleteConvocatoria: async (req, res) => {
    const { convocatoriaId } = req.params;
    const id = parseInt(convocatoriaId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de convocatoria inválido." });
    }

    try {
      const deleted = await convocatoriaModel.delete(id);
      if (deleted) {
        res.status(204).send(); // No content
      } else {
        res
          .status(404)
          .json({ message: "Convocatoria no encontrada para eliminar." });
      }
    } catch (error) {
      console.error(`Error en deleteConvocatoria (ID: ${id}):`, error);
      res.status(500).json({ message: "Error al eliminar la convocatoria." });
    }
  },

  // --- Opcional: Controlador Admin para listar TODOS los eventos ---
  /**
   * Lista TODOS los eventos (públicos o no) para el panel de admin (paginado).
   */
  listAllConvocatoriasAdmin: async (req, res) => {},
};

module.exports = convocatoriaController;
