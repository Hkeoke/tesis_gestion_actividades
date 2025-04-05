const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Hashea una contraseña.
 * @param {string} password Contraseña en texto plano.
 * @returns {Promise<string>} Hash de la contraseña.
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compara una contraseña en texto plano con un hash.
 * @param {string} password Contraseña en texto plano.
 * @param {string} hashedPassword Hash almacenado.
 * @returns {Promise<boolean>} True si coinciden, false si no.
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Genera un token JWT para un usuario.
 * @param {object} user Objeto con datos del usuario (id, rol_id, nombre_usuario).
 * @returns {string} Token JWT.
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    rol_id: user.rol_id,
    nombre_usuario: user.nombre_usuario,
    // Puedes añadir más datos si son necesarios y no sensibles
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verifica un token JWT.
 * @param {string} token Token JWT.
 * @returns {object | null} Payload decodificado o null si es inválido/expirado.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    console.error("Error verificando token:", error.message);
    return null;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
};
