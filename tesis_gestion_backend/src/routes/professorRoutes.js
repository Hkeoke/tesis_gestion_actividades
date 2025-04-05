const express = require("express");
const professorController = require("../controllers/professorController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const {
  uploadProfessorDocs,
  handleMulterError,
} = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Aplicar autenticación a todas las rutas de profesor
router.use(authenticateToken);
// Podríamos añadir un middleware authorizeRole(PROFESSOR_ROLE_ID) si queremos ser más estrictos

// POST /api/professor/category-requests - Crear una nueva solicitud de cambio de categoría
// Usamos upload.array('documentos') si esperamos múltiples archivos con ese nombre de campo
// Usamos upload.fields([{ name: 'documentos', maxCount: 10 }, { name: 'otroCampo' }]) para múltiples campos
router.post(
  "/category-requests",
  uploadProfessorDocs.array("documentos", 10), // Acepta hasta 10 archivos en el campo 'documentos'
  handleMulterError, // Manejar errores específicos de Multer
  professorController.createCategoryRequest
);

// GET /api/professor/category-requests - Obtener el historial de solicitudes del profesor
router.get("/category-requests", professorController.getMyCategoryRequests);

// GET /api/professor/category-requests/:id - Obtener detalles de una solicitud específica (si es necesario)
// router.get('/category-requests/:requestId', professorController.getMyCategoryRequestDetails);

// --- Añadir aquí más rutas específicas para profesores ---
// Rutas relacionadas con la planificación, etc.

module.exports = router;
