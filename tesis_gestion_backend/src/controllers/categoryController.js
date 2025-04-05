const Joi = require("joi");
const categoryModel = require("../models/categoryModel");

// Esquema de validación para crear/actualizar categoría
const categorySchema = Joi.object({
  nombre: Joi.string().min(3).max(100).required().messages({
    "string.base": `"nombre" debe ser un texto`,
    "string.empty": `"nombre" no puede estar vacío`,
    "string.min": `"nombre" debe tener al menos {#limit} caracteres`,
    "string.max": `"nombre" no puede tener más de {#limit} caracteres`,
    "any.required": `"nombre" es un campo requerido`,
  }),
  horas_norma_semanal: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      "number.base": `"horas_norma_semanal" debe ser un número`,
      "number.positive": `"horas_norma_semanal" debe ser un número positivo`,
      "number.precision": `"horas_norma_semanal" no puede tener más de {#limit} decimales`,
      "any.required": `"horas_norma_semanal" es un campo requerido`,
    }),
});

// Esquema para actualización (campos opcionales)
const categoryUpdateSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).messages({
    "string.base": `"nombre" debe ser un texto`,
    "string.min": `"nombre" debe tener al menos {#limit} caracteres`,
    "string.max": `"nombre" no puede tener más de {#limit} caracteres`,
  }),
  horas_norma_semanal: Joi.number().positive().precision(2).messages({
    "number.base": `"horas_norma_semanal" debe ser un número`,
    "number.positive": `"horas_norma_semanal" debe ser un número positivo`,
    "number.precision": `"horas_norma_semanal" no puede tener más de {#limit} decimales`,
  }),
})
  .min(1)
  .messages({
    // Asegura que al menos un campo se envíe para actualizar
    "object.min":
      "Debe proporcionar al menos un campo (nombre u horas_norma_semanal) para actualizar.",
  });

const categoryController = {
  /**
   * Obtiene todas las categorías.
   */
  getAllCategories: async (req, res) => {
    try {
      const categories = await categoryModel.findAll();
      res.status(200).json(categories);
    } catch (error) {
      console.error("Error en getAllCategories:", error);
      res
        .status(500)
        .json({ message: "Error interno al obtener las categorías." });
    }
  },

  /**
   * Obtiene una categoría por su ID.
   */
  getCategoryById: async (req, res) => {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "ID de categoría inválido." });
    }

    try {
      const category = await categoryModel.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Categoría no encontrada." });
      }
      res.status(200).json(category);
    } catch (error) {
      console.error(`Error en getCategoryById (ID: ${categoryId}):`, error);
      res
        .status(500)
        .json({ message: "Error interno al obtener la categoría." });
    }
  },

  /**
   * Crea una nueva categoría.
   */
  createCategory: async (req, res) => {
    // Validar entrada con Joi
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      // Usar el primer mensaje de error para la respuesta
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      const newCategory = await categoryModel.create(value);
      res
        .status(201)
        .json({
          message: "Categoría creada exitosamente.",
          category: newCategory,
        });
    } catch (error) {
      console.error("Error en createCategory:", error);
      if (error.code === "DUPLICATE_ENTRY") {
        return res.status(409).json({ message: error.message }); // 409 Conflict
      }
      res.status(500).json({ message: "Error interno al crear la categoría." });
    }
  },

  /**
   * Actualiza una categoría existente.
   */
  updateCategory: async (req, res) => {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "ID de categoría inválido." });
    }

    // Validar entrada con Joi (esquema de actualización)
    const { error, value } = categoryUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      const updatedCategory = await categoryModel.update(categoryId, value);
      if (!updatedCategory) {
        return res
          .status(404)
          .json({ message: "Categoría no encontrada para actualizar." });
      }
      res
        .status(200)
        .json({
          message: "Categoría actualizada exitosamente.",
          category: updatedCategory,
        });
    } catch (error) {
      console.error(`Error en updateCategory (ID: ${categoryId}):`, error);
      if (error.code === "DUPLICATE_ENTRY") {
        return res.status(409).json({ message: error.message }); // 409 Conflict
      }
      res
        .status(500)
        .json({ message: "Error interno al actualizar la categoría." });
    }
  },

  /**
   * Elimina una categoría.
   */
  deleteCategory: async (req, res) => {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "ID de categoría inválido." });
    }

    try {
      const deleted = await categoryModel.delete(categoryId);
      if (!deleted) {
        return res
          .status(404)
          .json({ message: "Categoría no encontrada para eliminar." });
      }
      res.status(200).json({ message: "Categoría eliminada exitosamente." });
    } catch (error) {
      console.error(`Error en deleteCategory (ID: ${categoryId}):`, error);
      if (error.code === "FK_VIOLATION") {
        return res.status(409).json({ message: error.message }); // 409 Conflict
      }
      res
        .status(500)
        .json({ message: "Error interno al eliminar la categoría." });
    }
  },
};

module.exports = categoryController;
