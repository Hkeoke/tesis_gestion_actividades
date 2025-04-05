const planningModel = require("../models/planningModel");
const Joi = require("joi"); // Usaremos Joi para validación (instalar con: npm install joi)

// Esquemas de validación con Joi
const activitySchema = Joi.object({
  tipo_actividad_id: Joi.number().integer().required(),
  fecha: Joi.date().iso().required().messages({
    // Formato YYYY-MM-DD
    "date.format": "La fecha debe estar en formato YYYY-MM-DD",
  }),
  horas_dedicadas: Joi.number().positive().required().messages({
    "number.base": "Las horas dedicadas deben ser un número",
    "number.positive": "Las horas dedicadas deben ser un valor positivo",
  }),
  grupo_clase: Joi.string().allow(null, ""), // Permitir null o string vacío
  cantidad_estudiantes: Joi.number().integer().min(1).allow(null), // Para actividades que requieren estudiantes
  descripcion_adicional: Joi.string().allow("").max(500), // Permitir string vacío
});

const updateActivitySchema = Joi.object({
  // No requerimos todos los campos para actualizar
  fecha: Joi.date()
    .iso()
    .messages({ "date.format": "La fecha debe estar en formato YYYY-MM-DD" }),
  horas_dedicadas: Joi.number().positive().messages({
    "number.positive": "Las horas dedicadas deben ser un valor positivo",
  }),
  grupo_clase: Joi.string().allow(null, ""),
  cantidad_estudiantes: Joi.number().integer().min(1).allow(null), // Para actividades que requieren estudiantes
  descripcion_adicional: Joi.string().allow("").max(500),
}).min(1); // Asegurar que al menos un campo se envíe para actualizar

const dateRangeSchema = Joi.object({
  startDate: Joi.date()
    .iso()
    .required()
    .messages({ "date.format": "startDate debe estar en formato YYYY-MM-DD" }),
  endDate: Joi.date().iso().required().min(Joi.ref("startDate")).messages({
    "date.format": "endDate debe estar en formato YYYY-MM-DD",
    "date.min": "endDate debe ser igual o posterior a startDate",
  }),
});

const planningController = {
  /**
   * Lista todos los tipos de actividad.
   */
  listActivityTypes: async (req, res) => {
    try {
      const types = await planningModel.getActivityTypes();
      res.status(200).json(types);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tipos de actividad." });
    }
  },

  /**
   * Crea una nueva actividad en el plan del usuario autenticado.
   */
  createActivity: async (req, res) => {
    const usuarioId = req.user.id;
    const { error, value } = activitySchema.validate(req.body);

    if (error) {
      // Extraer el primer mensaje de error para simplificar
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      const newActivity = await planningModel.addActivity(usuarioId, value);
      res.status(201).json(newActivity);
    } catch (error) {
      console.error("Error en controller createActivity:", error);
      // Devolver mensaje específico si es un error conocido del modelo
      if (
        error.message.includes("requiere especificar un grupo") ||
        error.message.includes("no encontrado")
      ) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno al crear la actividad." });
    }
  },

  /**
   * Obtiene el plan de trabajo del usuario autenticado para un rango de fechas.
   */
  getPlan: async (req, res) => {
    const usuarioId = req.user.id;
    // Validar query params para las fechas
    const { error, value } = dateRangeSchema.validate(req.query);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { startDate, endDate } = value;

    try {
      const plan = await planningModel.getUserPlan(
        usuarioId,
        startDate,
        endDate
      );
      res.status(200).json(plan);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener el plan de trabajo." });
    }
  },

  /**
   * Actualiza una actividad existente del usuario autenticado.
   */
  editActivity: async (req, res) => {
    const usuarioId = req.user.id;
    const { activityId } = req.params;
    const id = parseInt(activityId, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de actividad inválido." });
    }

    const { error, value } = updateActivitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      const updatedActivity = await planningModel.updateActivity(
        id,
        usuarioId,
        value
      );
      if (!updatedActivity) {
        return res.status(404).json({
          message: "Actividad no encontrada o no pertenece al usuario.",
        });
      }
      res.status(200).json(updatedActivity);
    } catch (error) {
      console.error(`Error en controller editActivity ${id}:`, error);
      if (error.message.includes("requiere un grupo")) {
        return res.status(400).json({ message: error.message });
      }
      res
        .status(500)
        .json({ message: "Error interno al actualizar la actividad." });
    }
  },

  /**
   * Elimina una actividad del plan del usuario autenticado.
   */
  removeActivity: async (req, res) => {
    const usuarioId = req.user.id;
    const { activityId } = req.params;
    const id = parseInt(activityId, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de actividad inválido." });
    }

    try {
      const deleted = await planningModel.deleteActivity(id, usuarioId);
      if (!deleted) {
        return res.status(404).json({
          message: "Actividad no encontrada o no pertenece al usuario.",
        });
      }
      res.status(204).send(); // No content
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error interno al eliminar la actividad." });
    }
  },

  /**
   * Obtiene un resumen de horas por tipo de actividad para el usuario autenticado.
   */
  getPlanSummary: async (req, res) => {
    const usuarioId = req.user.id;
    const { error, value } = dateRangeSchema.validate(req.query);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { startDate, endDate } = value;

    try {
      const summary = await planningModel.getHoursSummaryByUser(
        usuarioId,
        startDate,
        endDate
      );
      res.status(200).json(summary);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error al generar el resumen del plan." });
    }
  },
};

module.exports = {
  ...planningController,
  activitySchema, // Exportar el esquema para uso en otros archivos
  updateActivitySchema, // Exportar el esquema de actualización
};
