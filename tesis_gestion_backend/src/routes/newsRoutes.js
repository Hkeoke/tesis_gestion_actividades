const express = require("express");
const newsController = require("../controllers/newsController");
const { authenticateToken, isAdmin } = require("../middlewares/authMiddleware");
const {
  uploadNewsImage,
  handleMulterError,
} = require("../middlewares/uploadMiddleware"); // Importar middleware de subida

const router = express.Router();
router.use(authenticateToken);

// --- Rutas Públicas ---
// GET /api/news?page=1&limit=10 - Listar noticias publicadas paginadas
router.get("/", newsController.listNews);

// GET /api/news/:newsId - Obtener detalles de una noticia
router.get("/:newsId", newsController.getNewsDetails);

// --- Rutas de Administración (requieren token y rol de admin) ---

// POST /api/news - Crear una nueva noticia (con posible subida de imagen)
// 1. Autenticar y verificar admin
// 2. Usar Multer para procesar el campo 'imagen_noticia'
// 3. Manejar errores de Multer
// 4. Ejecutar el controlador createNews
router.post(
  "/",
  authenticateToken,
  isAdmin,
  (req, res, next) => {
    // Middleware intermedio para manejar Multer y su error
    uploadNewsImage(req, res, (err) => {
      handleMulterError(err, req, res, next); // Pasa al manejador de errores de Multer
    });
  },
  newsController.createNews // Controlador final
);

// PUT /api/news/:newsId - Actualizar una noticia (con posible subida/eliminación de imagen)
// Similar al POST, usamos Multer antes del controlador
router.put(
  "/:newsId",
  authenticateToken,
  isAdmin,
  (req, res, next) => {
    uploadNewsImage(req, res, (err) => {
      handleMulterError(err, req, res, next);
    });
  },
  newsController.updateNews
);

// DELETE /api/news/:newsId - Eliminar una noticia
router.delete(
  "/:newsId",
  authenticateToken,
  isAdmin,
  newsController.deleteNews
);

module.exports = router;
