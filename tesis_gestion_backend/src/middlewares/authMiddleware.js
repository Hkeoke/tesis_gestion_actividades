const { verifyToken } = require("../utils/helpers");
const userModel = require("../models/userModel"); // Para obtener datos frescos del usuario si es necesario

const authenticateToken = async (req, res, next) => {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Formato: Bearer TOKEN

  if (token == null) {
    return res
      .status(401)
      .json({ message: "Acceso denegado. No se proporcionó token." });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return res.status(403).json({ message: "Token inválido o expirado." });
  }

  try {
    // Opcional: Podrías buscar el usuario en la BD aquí para asegurar que aún existe
    // y obtener datos actualizados (rol, etc.). Esto añade una consulta a la BD por petición.
    const user = await userModel.findById(payload.id);
    if (!user || !user.aprobado) {
      return res
        .status(403)
        .json({ message: "Usuario no encontrado o no aprobado." });
    }

    // Adjuntar datos del usuario (o al menos el payload) al objeto request
    // req.user = payload; // Opción más ligera
    req.user = user; // Opción con datos frescos de la BD
    next(); // Pasar al siguiente middleware o controlador
  } catch (error) {
    console.error("Error en middleware authenticateToken:", error);
    res.status(500).json({
      message: "Error interno del servidor durante la autenticación.",
    });
  }
};

// Middleware para verificar roles específicos
const authorizeRole = (requiredRoleId) => {
  return (req, res, next) => {
    if (!req.user || req.user.rol_id !== requiredRoleId) {
      // Podrías buscar el nombre del rol para un mensaje más claro
      return res
        .status(403)
        .json({ message: "Acceso denegado. Permisos insuficientes." });
    }
    next();
  };
};

// Middleware específico para Administradores (ejemplo)
// Asumiendo que el ID del rol Administrador es 1 (ajustar según tu BD)
const isAdmin = (req, res, next) => {
  const ADMIN_ROLE_ID = 3; // ¡Obtener esto de forma dinámica o desde config sería mejor!
  if (!req.user || req.user.rol_id !== ADMIN_ROLE_ID) {
    return res
      .status(403)
      .json({ message: "Acceso denegado. Requiere rol de Administrador." });
  }
  next();
};

module.exports = {
  authenticateToken,
  authorizeRole,
  isAdmin,
};
