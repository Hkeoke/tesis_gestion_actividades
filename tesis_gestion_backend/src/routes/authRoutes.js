const express = require("express");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/authMiddleware"); // Asegúrate de importar esto
// Aquí podrías añadir validación de entrada con express-validator si lo instalas

const router = express.Router();

// POST /api/auth/register - Registro de nuevo usuario (pendiente de aprobación)
router.post("/register", authController.register);

// POST /api/auth/login - Inicio de sesión
router.post("/login", authController.login);

// GET /api/auth/me - Devuelve información del usuario autenticado
router.get("/me", authenticateToken, (req, res) => {
  // authenticateToken ya ha añadido req.user si el token es válido
  // Excluimos el password_hash por seguridad
  const { password_hash, ...userData } = req.user;
  res.status(200).json(userData);
});

module.exports = router;
