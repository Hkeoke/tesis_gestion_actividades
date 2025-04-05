const express = require("express");
const categoryController = require("../controllers/categoryController");
const { authenticateToken, isAdmin } = require("../middlewares/authMiddleware"); // Importar middlewares

const router = express.Router();

// --- Rutas Públicas o para Usuarios Autenticados ---
// GET /api/categories - Listar todas las categorías (público o requiere solo login básico)
// Si quieres que solo usuarios logueados la vean, añade authenticateToken aquí
router.get("/", categoryController.getAllCategories);

// GET /api/categories/:id - Obtener una categoría por ID (público o requiere solo login básico)
// Si quieres que solo usuarios logueados la vean, añade authenticateToken aquí
router.get("/:id", categoryController.getCategoryById);

// --- Rutas Protegidas (Solo Administradores) ---

// POST /api/categories - Crear una nueva categoría
router.post("/", authenticateToken, isAdmin, categoryController.createCategory);

// PUT /api/categories/:id - Actualizar una categoría existente
router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  categoryController.updateCategory
);

// DELETE /api/categories/:id - Eliminar una categoría
router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  categoryController.deleteCategory
);

module.exports = router;
