const userModel = require("../models/userModel");
const categoryRequestModel = require("../models/categoryRequestModel");
const planningModel = require("../models/planningModel");
const reportModel = require("../models/reportModel");
const notificationService = require("../services/notificationService");
const fs = require("fs");
const path = require("path");
const Joi = require("joi");
const roleModel = require("../models/roleModel"); // Podría ser útil si asignamos roles al aprobar
const db = require("../config/db");
const categoryModel = require("../models/categoryModel");
const newsModel = require("../models/newsModel");
const eventModel = require("../models/eventModel");
const convocatoriaModel = require("../models/convocatoriaModel");
const {
  activitySchema,
  updateActivitySchema,
} = require("./planningController"); // Importar esquema de actividad desde planningController

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

const adminController = {
  /**
   * Obtiene la lista de usuarios pendientes de aprobación.
   */
  getPendingRegistrations: async (req, res) => {
    try {
      const pendingUsers = await userModel.findPendingRegistrations();
      res.status(200).json(pendingUsers);
    } catch (error) {
      console.error("Error obteniendo registros pendientes:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  },

  /**
   * Aprueba un usuario pendiente.
   */
  approveUser: async (req, res) => {
    const { userId } = req.params;
    // Opcional: Podrías permitir asignar un rol específico al aprobar
    // const { rol_id } = req.body;

    try {
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }
      if (user.aprobado) {
        return res
          .status(400)
          .json({ message: "El usuario ya está aprobado." });
      }

      // Aquí podrías añadir lógica para asignar un rol por defecto si no se especifica
      // const defaultRoleId = await roleModel.findByName('Profesor'); // O el rol que aplique
      // const finalRoleId = rol_id || defaultRoleId?.id;

      // Actualiza el estado 'aprobado' a true
      // Si decides asignar rol aquí, también actualiza 'rol_id'
      const updatedUser = await userModel.approveUser(userId);

      if (!updatedUser) {
        // Esto no debería pasar si findById funcionó, pero por si acaso
        return res
          .status(404)
          .json({ message: "No se pudo actualizar el usuario." });
      }

      // TODO: Opcional - Enviar notificación al usuario aprobado

      res
        .status(200)
        .json({ message: "Usuario aprobado exitosamente.", user: updatedUser });
    } catch (error) {
      console.error("Error al aprobar usuario:", error);
      res.status(500).json({ message: "Error interno al aprobar el usuario." });
    }
  },
  hacerMiembroSociedad: async (req, res) => {
    const { userId } = req.params;

    try {
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }
      if (user.miembro_sociedad) {
        return res
          .status(400)
          .json({ message: "El usuario ya es miembro de la sociedad." });
      }
      const updatedUser = await userModel.hacerMiembroSociedad(userId);

      if (!updatedUser) {
        // Esto no debería pasar si findById funcionó, pero por si acaso
        return res
          .status(404)
          .json({ message: "No se pudo actualizar el usuario." });
      }

      // TODO: Opcional - Enviar notificación al usuario aprobado

      return res
        .status(200)
        .json({ message: "Usuario aprobado exitosamente.", user: updatedUser });
    } catch (error) {
      console.error("Error al aprobar usuario:", error);
      res.status(500).json({ message: "Error interno al aprobar el usuario." });
    }
  },
  cotizarUser: async (req, res) => {
    const { userId } = req.params;
    console.log("userId", userId);

    try {
      const user = await userModel.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      const updatedUser = await userModel.cotizarUser(userId);

      if (!updatedUser) {
        // Esto no debería pasar si findById funcionó, pero por si acaso
        return res
          .status(404)
          .json({ message: "No se pudo actualizar el usuario." });
      }

      return res
        .status(200)
        .json({ message: "Usuario cotizado exitosamente.", user: updatedUser });
    } catch (error) {
      console.error("Error al cotizar usuario:", error);
      res.status(500).json({ message: "Error interno al cotizar el usuario." });
    }
  },

  /**
   * Rechaza (elimina) un usuario pendiente.
   * Podrías moverlo a 'inactivo' en lugar de eliminar si prefieres guardar registro.
   */
  rejectUser: async (req, res) => {
    const { userId } = req.params;

    try {
      const user = await userModel.findById(userId);
      if (!user) {
        // Si ya fue eliminado o nunca existió
        return res.status(404).json({ message: "Usuario no encontrado." });
      }
      // Por seguridad, solo permitir rechazar/eliminar usuarios no aprobados
      if (user.aprobado) {
        return res.status(400).json({
          message: "No se puede rechazar un usuario que ya está aprobado.",
        });
      }

      const deleted = await userModel.delete(userId);
      if (!deleted) {
        // Si findById funcionó pero delete falló (raro)
        return res
          .status(500)
          .json({ message: "No se pudo eliminar el usuario." });
      }

      // TODO: Opcional - Enviar notificación al usuario rechazado (si guardaste su email antes)

      res
        .status(200)
        .json({ message: "Usuario rechazado (eliminado) exitosamente." });
    } catch (error) {
      console.error("Error al rechazar usuario:", error);
      res
        .status(500)
        .json({ message: "Error interno al rechazar el usuario." });
    }
  },

  /**
   * Obtiene la lista de solicitudes de cambio de categoría pendientes.
   */
  getPendingCategoryRequests: async (req, res) => {
    try {
      const pendingRequests = await categoryRequestModel.findPending();
      res.status(200).json(pendingRequests);
    } catch (error) {
      console.error(
        "Error obteniendo solicitudes de categoría pendientes:",
        error
      );
      res.status(500).json({ message: "Error interno del servidor." });
    }
  },

  /**
   * Obtiene los detalles completos de una solicitud de cambio de categoría específica.
   */
  getCategoryRequestDetails: async (req, res) => {
    const { requestId } = req.params;
    const id = parseInt(requestId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de solicitud inválido." });
    }

    try {
      const solicitud = await categoryRequestModel.findByIdWithDetails(id);
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada." });
      }
      // Opcional: Podríamos querer ocultar/modificar el path completo de los archivos antes de enviarlo
      // solicitud.documentos = solicitud.documentos.map(doc => ({...doc, path_archivo: path.basename(doc.path_archivo)})); // Ejemplo
      res.status(200).json(solicitud);
    } catch (error) {
      console.error(`Error obteniendo detalles de solicitud ${id}:`, error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  },

  /**
   * Revisa (aprueba o rechaza) una solicitud de cambio de categoría.
   */
  reviewCategoryRequest: async (req, res) => {
    const { requestId } = req.params;
    const { estado, observaciones } = req.body; // 'Aprobada' o 'Rechazada'
    const idSolicitud = parseInt(requestId, 10);

    if (isNaN(idSolicitud)) {
      return res.status(400).json({ message: "ID de solicitud inválido." });
    }
    if (!["Aprobada", "Rechazada"].includes(estado)) {
      return res.status(400).json({ message: "Estado inválido." });
    }
    if (estado === "Rechazada" && !observaciones) {
      return res.status(400).json({
        message: "Se requieren observaciones para rechazar una solicitud.",
      });
    }

    try {
      const updatedRequest = await categoryRequestModel.review(
        idSolicitud,
        estado,
        observaciones
      );

      if (updatedRequest) {
        if (estado === "Aprobada") {
          await userModel.updateCategory(
            updatedRequest.usuario_id,
            updatedRequest.categoria_solicitada_id
          );
        }

        await notificationService.notifyCategoryRequestReviewed(
          updatedRequest.usuario_id,
          idSolicitud,
          estado,
          observaciones
        );

        res.status(200).json({
          message: `Solicitud ${estado.toLowerCase()} exitosamente.`,
          solicitud: updatedRequest,
        });
      } else {
        res.status(409).json({
          message:
            "No se pudo actualizar la solicitud. Es posible que ya haya sido revisada o no exista.",
        });
      }
    } catch (error) {
      console.error(`Error revisando solicitud ${idSolicitud}:`, error);
      res.status(500).json({
        message: "Error interno del servidor al revisar la solicitud.",
      });
    }
  },

  // --- Gestión de Planes de Usuarios por Admin ---

  /**
   * Obtiene el plan de trabajo de un usuario específico en un rango de fechas.
   */
  getUserPlan: async (req, res) => {
    const { userId } = req.params;
    const idUsuario = parseInt(userId, 10);
    if (isNaN(idUsuario)) {
      return res.status(400).json({ message: "ID de usuario inválido." });
    }

    const { error, value } = dateRangeSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { startDate, endDate } = value;

    try {
      // Verificar si el usuario existe (opcional pero bueno)
      const userExists = await userModel.findById(idUsuario);
      if (!userExists) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      const plan = await planningModel.getPlanByUserId(
        idUsuario,
        startDate,
        endDate
      );
      res.status(200).json(plan);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error al obtener el plan del usuario." });
    }
  },

  /**
   * Obtiene el resumen de horas de un usuario específico en un rango de fechas.
   */
  getUserPlanSummary: async (req, res) => {
    const { userId } = req.params;
    const idUsuario = parseInt(userId, 10);
    if (isNaN(idUsuario)) {
      return res.status(400).json({ message: "ID de usuario inválido." });
    }

    const { error, value } = dateRangeSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { startDate, endDate } = value;

    try {
      // Verificar si el usuario existe (opcional)
      const userExists = await userModel.findById(idUsuario);
      if (!userExists) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      const summary = await planningModel.getHoursSummaryByUserId(
        idUsuario,
        startDate,
        endDate
      );
      res.status(200).json(summary);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error al obtener el resumen del plan del usuario." });
    }
  },

  /**
   * Crea una actividad para un usuario específico (solo administradores).
   */
  createActivityForUser: async (req, res) => {
    const { userId } = req.params;
    const idUsuario = parseInt(userId, 10);

    if (isNaN(idUsuario)) {
      return res.status(400).json({ message: "ID de usuario inválido." });
    }

    // Validar los datos de la actividad
    const { error, value } = activitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      // Verificar si el usuario existe
      const userExists = await userModel.findById(idUsuario);
      if (!userExists) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      // Crear la actividad usando el modelo de planificación
      const newActivity = await planningModel.addActivity(idUsuario, value);
      res.status(201).json({
        message: "Actividad creada exitosamente para el usuario.",
        activity: newActivity,
      });
    } catch (error) {
      console.error("Error al crear actividad para usuario:", error);
      // Mensajes específicos para errores conocidos
      if (
        error.message.includes("requiere especificar un grupo") ||
        error.message.includes("no encontrado")
      ) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({
        message: "Error interno al crear la actividad para el usuario.",
      });
    }
  },

  /**
   * Actualiza una actividad para un usuario específico (solo administradores).
   */
  updateActivityForUser: async (req, res) => {
    const { userId, activityId } = req.params;
    const idUsuario = parseInt(userId, 10);
    const idActividad = parseInt(activityId, 10);

    if (isNaN(idUsuario) || isNaN(idActividad)) {
      return res.status(400).json({
        message: "ID de usuario o ID de actividad inválido.",
      });
    }

    // Validar los datos de actualización
    const { error, value } = updateActivitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    try {
      // Verificar si el usuario existe
      const userExists = await userModel.findById(idUsuario);
      if (!userExists) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      // Actualizar la actividad usando el modelo de planificación
      const updatedActivity = await planningModel.updateActivity(
        idActividad,
        idUsuario,
        value
      );

      if (!updatedActivity) {
        return res.status(404).json({
          message: "Actividad no encontrada o no pertenece al usuario.",
        });
      }

      res.status(200).json({
        message: "Actividad actualizada exitosamente.",
        activity: updatedActivity,
      });
    } catch (error) {
      console.error("Error al actualizar actividad para usuario:", error);
      if (error.message.includes("requiere un grupo")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({
        message: "Error interno al actualizar la actividad.",
      });
    }
  },

  /**
   * Elimina una actividad de un usuario específico (solo administradores).
   */
  deleteActivityForUser: async (req, res) => {
    const { userId, activityId } = req.params;
    const idUsuario = parseInt(userId, 10);
    const idActividad = parseInt(activityId, 10);

    if (isNaN(idUsuario) || isNaN(idActividad)) {
      return res.status(400).json({
        message: "ID de usuario o ID de actividad inválido.",
      });
    }

    try {
      // Verificar si el usuario existe
      const userExists = await userModel.findById(idUsuario);
      if (!userExists) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      // Eliminar la actividad usando el modelo de planificación
      const deleted = await planningModel.deleteActivity(
        idActividad,
        idUsuario
      );

      if (!deleted) {
        return res.status(404).json({
          message: "Actividad no encontrada o no pertenece al usuario.",
        });
      }

      res.status(204).send(); // No content
    } catch (error) {
      console.error("Error al eliminar actividad para usuario:", error);
      res.status(500).json({
        message: "Error interno al eliminar la actividad.",
      });
    }
  },

  // --- Gestión de Roles ---

  /**
   * Lista todos los roles disponibles.
   */
  listRoles: async (req, res) => {
    try {
      const roles = await roleModel.findAll();
      res.status(200).json(roles);
    } catch (error) {
      console.error("Error al listar roles:", error);
      res.status(500).json({ message: "Error interno al obtener roles." });
    }
  },

  /**
   * Crea un nuevo rol.
   */
  createRole: async (req, res) => {
    // Aquí podrías añadir validación con Joi si lo deseas
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      return res
        .status(400)
        .json({ message: "El nombre del rol es requerido." });
    }
    try {
      const newRole = await roleModel.create({
        nombre,
        descripcion: descripcion || "",
      }); // Descripción opcional
      res
        .status(201)
        .json({ message: "Rol creado exitosamente.", role: newRole });
    } catch (error) {
      console.error("Error al crear rol:", error);
      // Si el error es por nombre duplicado (lanzado desde el modelo)
      if (error.message.includes("ya existe")) {
        return res.status(409).json({ message: error.message }); // 409 Conflict
      }
      res.status(500).json({ message: "Error interno al crear el rol." });
    }
  },

  /**
   * Actualiza un rol existente.
   */
  updateRole: async (req, res) => {
    const { roleId } = req.params;
    const id = parseInt(roleId, 10);
    const { nombre, descripcion } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de rol inválido." });
    }
    if (!nombre) {
      // Asumimos que el nombre es siempre requerido para actualizar
      return res
        .status(400)
        .json({ message: "El nombre del rol es requerido para actualizar." });
    }

    try {
      const updatedRole = await roleModel.update(id, {
        nombre,
        descripcion: descripcion || "",
      });
      if (!updatedRole) {
        return res
          .status(404)
          .json({ message: `Rol con ID ${id} no encontrado.` });
      }
      res
        .status(200)
        .json({ message: "Rol actualizado exitosamente.", role: updatedRole });
    } catch (error) {
      console.error(`Error al actualizar rol ${id}:`, error);
      if (error.message.includes("ya está en uso")) {
        return res.status(409).json({ message: error.message }); // 409 Conflict
      }
      res.status(500).json({ message: "Error interno al actualizar el rol." });
    }
  },

  /**
   * Elimina un rol.
   */
  deleteRole: async (req, res) => {
    const { roleId } = req.params;
    const id = parseInt(roleId, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de rol inválido." });
    }

    // Opcional: Impedir eliminar roles críticos (ej: Administrador)
    // const roleToDelete = await roleModel.findById(id);
    // if (roleToDelete && roleToDelete.nombre === 'Administrador') {
    //    return res.status(403).json({ message: "No se puede eliminar el rol 'Administrador'." });
    // }

    try {
      const deleted = await roleModel.deleteById(id);
      if (!deleted) {
        // Esto podría pasar si el rol no existía justo antes de intentar borrarlo
        return res
          .status(404)
          .json({ message: `Rol con ID ${id} no encontrado.` });
      }
      res.status(200).json({ message: "Rol eliminado exitosamente." });
    } catch (error) {
      console.error(`Error al eliminar rol ${id}:`, error);
      // Si el error es por rol en uso (lanzado desde el modelo)
      if (error.message.includes("asignado a uno o más usuarios")) {
        return res.status(409).json({ message: error.message }); // 409 Conflict
      }
      res.status(500).json({ message: "Error interno al eliminar el rol." });
    }
  },

  // --- Gestión de Usuarios (Modificaciones) ---

  /**
   * Lista todos los usuarios (aprobados y no aprobados).
   * TODO: Añadir paginación y filtros si es necesario.
   */
  listUsers: async (req, res) => {
    try {
      // Modificar userModel.findAll() si necesitas filtros/paginación
      const users = await userModel.findAllWithDetails(); // Asume que existe esta función o créala
      res.status(200).json(users);
    } catch (error) {
      console.error("Error al listar usuarios:", error);
      res.status(500).json({ message: "Error interno al obtener usuarios." });
    }
  },

  listMembersPaid: async (req, res) => {
    try {
      const members = await userModel.findAllMembersPaid();
      res.status(200).json(members);
    } catch (error) {
      console.error("Error al listar usuarios:", error);
      res.status(500).json({ message: "Error interno al obtener usuarios." });
    }
  },

  /**
   * Obtiene detalles de un usuario específico (incluyendo rol y categoría).
   */
  getUserById: async (req, res) => {
    const { userId } = req.params;
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de usuario inválido." });
    }
    try {
      // Asegúrate que findByIdWithDetails exista y traiga la info necesaria
      const user = await userModel.findByIdWithDetails(id);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }
      // Excluimos el hash de la contraseña por seguridad
      const { password_hash, ...userData } = user;
      res.status(200).json(userData);
    } catch (error) {
      console.error(`Error al obtener usuario ${id}:`, error);
      res.status(500).json({ message: "Error interno al obtener el usuario." });
    }
  },

  /**
   * Actualiza los datos de un usuario, incluyendo su rol y categoría.
   * Nota: No permite actualizar contraseña aquí por simplicidad (requeriría ruta/lógica separada).
   */
  updateUser: async (req, res) => {
    const { userId } = req.params;
    const id = parseInt(userId, 10);
    // Extraer solo los campos permitidos para actualizar
    const {
      nombre_usuario,
      email,
      nombre,
      apellidos,
      rol_id,
      categoria_id,
      aprobado,
    } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de usuario inválido." });
    }

    // Validaciones básicas (puedes usar Joi para algo más robusto)
    if (
      !nombre_usuario ||
      !email ||
      !nombre ||
      !apellidos ||
      rol_id === undefined ||
      categoria_id === undefined ||
      aprobado === undefined
    ) {
      return res.status(400).json({
        message:
          "Faltan campos requeridos para actualizar el usuario (nombre_usuario, email, nombre, apellidos, rol_id, categoria_id, aprobado).",
      });
    }

    try {
      // Verificar si el rol y categoría existen (opcional pero recomendado)
      if (rol_id && !(await roleModel.findById(rol_id))) {
        return res
          .status(400)
          .json({ message: `El rol con ID ${rol_id} no existe.` });
      }
      // const categoryExists = await categoryModel.findById(categoria_id); // Necesitarías categoryModel
      // if (categoria_id && !categoryExists) {
      //     return res.status(400).json({ message: `La categoría con ID ${categoria_id} no existe.` });
      // }

      const updateData = {
        nombre_usuario,
        email,
        nombre,
        apellidos,
        rol_id: parseInt(rol_id, 10), // Asegurar que sea número
        categoria_id: parseInt(categoria_id, 10), // Asegurar que sea número
        aprobado:
          typeof aprobado === "boolean"
            ? aprobado
            : aprobado === "true" || aprobado === "1", // Convertir a booleano si es string
      };

      const updatedUser = await userModel.update(id, updateData);

      if (!updatedUser) {
        return res
          .status(404)
          .json({ message: `Usuario con ID ${id} no encontrado.` });
      }

      // Devolver el usuario actualizado (sin contraseña)
      const { password_hash, ...userData } = updatedUser;
      res
        .status(200)
        .json({ message: "Usuario actualizado exitosamente.", user: userData });
    } catch (error) {
      console.error(`Error al actualizar usuario ${id}:`, error);
      // Manejar errores de constraints (ej. email/usuario duplicado)
      if (error.code === "23505") {
        // Unique violation
        if (error.constraint === "usuarios_email_key") {
          return res
            .status(409)
            .json({ message: `El email '${email}' ya está en uso.` });
        }
        if (error.constraint === "usuarios_nombre_usuario_key") {
          return res.status(409).json({
            message: `El nombre de usuario '${nombre_usuario}' ya está en uso.`,
          });
        }
      }
      res
        .status(500)
        .json({ message: "Error interno al actualizar el usuario." });
    }
  },

  /**
   * Elimina un usuario (general).
   * ¡Precaución! Considera si realmente quieres eliminar o solo desactivar.
   */
  deleteUser: async (req, res) => {
    const { userId } = req.params;
    const id = parseInt(userId, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID de usuario inválido." });
    }

    // Opcional: Impedir eliminar al propio usuario admin o al último admin
    // if (req.user.id === id) {
    //    return res.status(403).json({ message: "No puedes eliminar tu propia cuenta." });
    // }
    // const userToDelete = await userModel.findById(id);
    // const isAdminRole = await roleModel.findByName('Administrador');
    // if (userToDelete && userToDelete.rol_id === isAdminRole?.id) {
    //    const adminCount = await userModel.countAdmins();
    //    if (adminCount <= 1) {
    //       return res.status(403).json({ message: "No se puede eliminar al último administrador." });
    //    }
    // }

    try {
      const deleted = await userModel.delete(id); // Asume que userModel.delete existe
      if (!deleted) {
        return res
          .status(404)
          .json({ message: `Usuario con ID ${id} no encontrado.` });
      }
      res.status(200).json({ message: "Usuario eliminado exitosamente." });
    } catch (error) {
      console.error(`Error al eliminar usuario ${id}:`, error);
      // Podrías tener errores si hay claves foráneas que dependen del usuario
      res
        .status(500)
        .json({ message: "Error interno al eliminar el usuario." });
    }
  },
};

module.exports = adminController;
