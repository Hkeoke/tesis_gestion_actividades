const express = require("express");
const adminController = require("../controllers/adminController");
const { authenticateToken, isAdmin } = require("../middlewares/authMiddleware");
const reportRoutes = require("./reportRoutes"); // Importar rutas de reportes

const router = express.Router();

// Todas las rutas aquí requieren autenticación y rol de administrador
router.use(authenticateToken, isAdmin);

// GET /api/admin/pending-registrations - Obtener lista de usuarios pendientes
router.get("/pending-registrations", adminController.getPendingRegistrations);

// PUT /api/admin/users/:userId/approve - Aprobar un usuario
router.put("/users/:userId/approve", adminController.approveUser);

// --- Rutas de Gestión de Solicitudes de Categoría ---
// GET /api/admin/category-requests/pending - Obtener solicitudes de categoría pendientes
router.get(
  "/category-requests/pending",
  adminController.getPendingCategoryRequests
);
// GET /api/admin/category-requests/:requestId - Obtener detalles de una solicitud
router.get(
  "/category-requests/:requestId",
  adminController.getCategoryRequestDetails
);
// PUT /api/admin/category-requests/:requestId/review - Aprobar o rechazar una solicitud
router.put(
  "/category-requests/:requestId/review",
  adminController.reviewCategoryRequest
);

// --- Rutas de Visualización de Planes de Trabajo (Admin) ---
// GET /api/admin/planning/users/:userId/activities?startDate=...&endDate=...
router.get("/planning/users/:userId/activities", adminController.getUserPlan);
// GET /api/admin/planning/users/:userId/summary?startDate=...&endDate=...
router.get(
  "/planning/users/:userId/summary",
  adminController.getUserPlanSummary
);
// POST /api/admin/planning/users/:userId/activities - Crear actividad para un usuario
router.post(
  "/planning/users/:userId/activities",
  adminController.createActivityForUser
);
// PUT /api/admin/planning/users/:userId/activities/:activityId - Actualizar actividad de un usuario
router.put(
  "/planning/users/:userId/activities/:activityId",
  adminController.updateActivityForUser
);
// DELETE /api/admin/planning/users/:userId/activities/:activityId - Eliminar actividad de un usuario
router.delete(
  "/planning/users/:userId/activities/:activityId",
  adminController.deleteActivityForUser
);

// --- Montar Rutas de Reportes ---
router.use("/reports", reportRoutes); // Todas las rutas en reportRoutes estarán bajo /api/admin/reports

// --- Gestión de Roles ---
router.get("/roles", adminController.listRoles); // Listar todos los roles
router.post("/roles", adminController.createRole); // Crear un nuevo rol
router.put("/roles/:roleId", adminController.updateRole); // Actualizar un rol
router.delete("/roles/:roleId", adminController.deleteRole); // Eliminar un rol

// --- Gestión de Usuarios ---
router.get("/users", adminController.listUsers);
// Listar todos los usuarios (con detalles)
router.get("/users/:userId", adminController.getUserById); // Ver detalle de un usuario (con detalles)
router.put("/users/:userId", adminController.updateUser); // Actualizar usuario (incluyendo rol, categoría, aprobado)
router.patch("/users/:userId/approve", adminController.approveUser); // Aprobar un usuario pendiente
router.patch("/users/:userId/cotizar", adminController.cotizarUser); // Cotizar un usuario pendiente
router.patch(
  "/users/:userId/hacerMiembroSociedad",
  adminController.hacerMiembroSociedad
); // Hacer miembro de la sociedad un usuario pendiente
router.delete("/users/:userId", adminController.deleteUser); // Eliminar un usuario (general)
router.delete("/users/:userId/reject", adminController.rejectUser); // Rechazar (eliminar) un usuario pendiente

// --- Añadir aquí más rutas de administración ---
// POST /api/admin/cotizantes
// POST /api/admin/events
// POST /api/admin/news
// GET /api/admin/users (listar todos los usuarios)
// ... etc

module.exports = router;
