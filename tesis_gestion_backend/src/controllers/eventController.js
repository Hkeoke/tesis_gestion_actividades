const eventModel = require("../models/eventModel");
const Joi = require("joi");

// Esquema de validación para crear/actualizar eventos
const eventSchema = Joi.object({
  titulo: Joi.string().min(3).max(255).required(),
  descripcion: Joi.string().allow(null, ""), // Permitir descripción vacía
  fecha_evento: Joi.date().iso().required().messages({
    // Formato ISO 8601 YYYY-MM-DDTHH:mm:ssZ
    "date.format":
      "La fecha del evento debe estar en formato ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)",
  }),
  ubicacion: Joi.string().max(255).allow(null, ""), // Permitir ubicación vacía
  publico: Joi.boolean().optional(), // << Usamos la columna 'publico'
});

// Esquema para query params de paginación
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10), // Límite de 50 por página
});

const eventController = {
  // --- Controladores Públicos ---

  /**
   * Lista todos los eventos marcados como PÚBLICOS (paginado).
   */
  listEvents: async (req, res) => {
    try {
      // Usar las funciones del modelo para eventos públicos
      const [events, totalEvents] = await Promise.all([
        eventModel.findAll(), // << Usa findAllPublic
        eventModel.countAll(), // << Usa countPublic
      ]);
      console.log("events", events);
      console.log("totalEvents", totalEvents);
      return res.status(200).json({
        events,

        totalEvents,
      });
    } catch (error) {
      console.error("Error en listEvents:", error);
      res
        .status(500)
        .json({ message: "Error al obtener la lista de eventos públicos." });
    }
  },

  /**
   * Obtiene los detalles de un evento específico si está marcado como público.
   */
  getEventDetails: async (req, res) => {
    const { eventId } = req.params;
    const id = parseInt(eventId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de evento inválido." });
    }

    try {
      const event = await eventModel.findById(id); // Obtiene el evento

      // Verificar si existe y si es público antes de devolverlo
      if (event && event.publico) {
        // << Verifica la columna 'publico'
        res.status(200).json(event);
      } else if (event && !event.publico) {
        // Existe pero no es público
        res
          .status(404)
          .json({ message: "Evento no encontrado o no es público." });
      } else {
        // No existe
        res.status(404).json({ message: "Evento no encontrado." });
      }
    } catch (error) {
      console.error(`Error en getEventDetails (ID: ${id}):`, error);
      res
        .status(500)
        .json({ message: "Error al obtener los detalles del evento." });
    }
  },

  // --- Controladores de Administración ---

  /**
   * Crea un nuevo evento (requiere ser admin).
   */
  createEvent: async (req, res) => {
    const { error, value } = eventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const adminId = req.user.id; // ID del admin autenticado

    try {
      // Pasar el valor de 'publico' del cuerpo validado
      const newEvent = await eventModel.create(
        value.titulo,
        value.descripcion,
        value.fecha_evento,
        value.ubicacion, // Asegúrate de que el modelo lo acepte en este orden
        adminId,
        value.publico // Pasar el valor de 'publico' (será undefined si no se envió, el modelo usará su default)
      );
      // Opcional: Notificar sobre nuevo evento
      // await notificationService.notifyNewEvent(newEvent.id, newEvent.titulo);
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error en createEvent:", error);
      res.status(500).json({ message: "Error al crear el evento." });
    }
  },

  /**
   * Actualiza un evento existente (requiere ser admin).
   */
  updateEvent: async (req, res) => {
    const { eventId } = req.params;
    const id = parseInt(eventId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de evento inválido." });
    }

    // Validar el cuerpo de la solicitud (incluye 'publico' opcional)
    const { error, value } = eventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // 'value' contiene solo los campos validados que se enviaron
    const dataToUpdate = value;

    try {
      // El modelo ahora maneja la actualización dinámica de campos
      const updatedEvent = await eventModel.update(id, dataToUpdate);

      if (updatedEvent) {
        res.status(200).json(updatedEvent);
      } else {
        // El modelo devuelve null si el ID no se encontró
        res
          .status(404)
          .json({ message: "Evento no encontrado para actualizar." });
      }
    } catch (error) {
      console.error(`Error en updateEvent (ID: ${id}):`, error);
      res.status(500).json({ message: "Error al actualizar el evento." });
    }
  },

  /**
   * Elimina un evento (requiere ser admin).
   */
  deleteEvent: async (req, res) => {
    const { eventId } = req.params;
    const id = parseInt(eventId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de evento inválido." });
    }

    try {
      const deleted = await eventModel.delete(id);
      if (deleted) {
        res.status(204).send(); // No content
      } else {
        res
          .status(404)
          .json({ message: "Evento no encontrado para eliminar." });
      }
    } catch (error) {
      console.error(`Error en deleteEvent (ID: ${id}):`, error);
      res.status(500).json({ message: "Error al eliminar el evento." });
    }
  },

  // --- Opcional: Controlador Admin para listar TODOS los eventos ---
  /**
   * Lista TODOS los eventos (públicos o no) para el panel de admin (paginado).
   */
  listAllEventsAdmin: async (req, res) => {
    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { page, limit } = value;
    const offset = (page - 1) * limit;

    try {
      // Usar las funciones del modelo para TODOS los eventos
      const [events, totalEvents] = await Promise.all([
        eventModel.findAll(limit, offset), // Usa findAll
        eventModel.countAll(), // Usa countAll
      ]);
      const totalPages = Math.ceil(totalEvents / limit);

      res.status(200).json({
        events,
        currentPage: page,
        totalPages,
        totalEvents,
      });
    } catch (error) {
      console.error("Error en listAllEventsAdmin:", error);
      res
        .status(500)
        .json({ message: "Error al obtener la lista completa de eventos." });
    }
  },
};

module.exports = eventController;
