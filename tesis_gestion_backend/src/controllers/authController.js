const userModel = require("../models/userModel");
const { comparePassword, generateToken } = require("../utils/helpers");

const authController = {
  /**
   * Maneja el registro de un nuevo usuario.
   */
  register: async (req, res) => {
    // Aquí deberías añadir validación de los datos de entrada (req.body)
    const {
      nombre_usuario,
      email,
      password,
      nombre,
      apellidos,
      categoria_id,
      rol_id,
    } = req.body;

    // Validación básica (mejorar con librerías como express-validator)
    if (!nombre_usuario || !password) {
      return res.status(400).json({
        message: "Faltan campos requeridos (nombre_usuario, password).",
      });
    }
    // Validar que rol_id y categoria_id (si se provee) sean válidos consultando las tablas correspondientes (pendiente)

    try {
      // Verificar si el usuario o email ya existen (el modelo ya lo hace, pero podrías hacerlo aquí también)
      const existingUser = await userModel.findByUsername(nombre_usuario);
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "El nombre de usuario ya está en uso." });
      }

      const newUser = await userModel.create({
        nombre_usuario,
        email,
        password, // El modelo se encarga de hashear
        nombre,
        apellidos,
        rol_id: rol_id ? rol_id : 4,
        categoria_id, // Asegúrate de que estos IDs existan en tus tablas
      });

      // No enviar token aquí, el usuario debe ser aprobado primero
      res.status(201).json({
        message:
          "Usuario registrado exitosamente. Pendiente de aprobación por un administrador.",
        user: {
          // Devolver datos no sensibles del usuario creado
          id: newUser.id,
          nombre_usuario: newUser.nombre_usuario,
          email: newUser.email,
          rol_id: newUser.rol_id,
        },
      });
    } catch (error) {
      console.error("Error en el registro:", error);
      // Devolver el mensaje de error específico del modelo si existe
      if (
        error.message.includes("ya existe") ||
        error.message.includes("registrado")
      ) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({
        message: "Error interno del servidor al registrar el usuario.",
      });
    }
  },

  /**
   * Maneja el inicio de sesión de un usuario.
   */
  login: async (req, res) => {
    const { nombre_usuario, password } = req.body;

    if (!nombre_usuario || !password) {
      return res
        .status(400)
        .json({ message: "Nombre de usuario y contraseña son requeridos." });
    }

    try {
      const user = await userModel.findByUsername(nombre_usuario);

      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas." }); // Usuario no encontrado
      }

      const isMatch = await comparePassword(password, user.password_hash);

      if (!isMatch) {
        return res.status(401).json({ message: "Credenciales inválidas." }); // Contraseña incorrecta
      }

      // Generar token JWT
      const token = generateToken({
        id: user.id,
        rol_id: user.rol_id,
        nombre_usuario: user.nombre_usuario,
        // Puedes añadir el nombre del rol si lo necesitas en el frontend
        nombre_rol: user.nombre_rol,
      });

      // Enviar token y datos básicos del usuario (sin contraseña)
      res.status(200).json({
        message: "Inicio de sesión exitoso.",
        token,
        user: {
          id: user.id,
          nombre_usuario: user.nombre_usuario,
          email: user.email,
          nombre: user.nombre,
          apellidos: user.apellidos,
          rol_id: user.rol_id,
          aprobado: user.aprobado,
          miembro_sociedad: user.miembro_sociedad,
          nombre_rol: user.nombre_rol, // Nombre del rol desde la consulta
          categoria: user.nombre_categoria,
          cotizo: user.cotizo,
          subcategoria_admin: user.nombre_subcategoria_admin,
        },
      });
    } catch (error) {
      console.error("Error en el login:", error);
      res.status(500).json({
        message: "Error interno del servidor durante el inicio de sesión.",
      });
    }
  },
};

module.exports = authController;
