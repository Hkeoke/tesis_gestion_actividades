const db = require("../config/db");

const categoryRequestModel = {
  /**
   * Crea una nueva solicitud de cambio de categoría y guarda sus documentos y enlaces.
   * @param {number} usuarioId
   * @param {number} categoriaSolicitadaId
   * @param {Array<object>} documentos - Array de objetos { nombre_archivo, path_archivo, tipo_mime, tamano_bytes }
   * @param {Array<object>} publicaciones - Array de objetos { url, descripcion }
   * @returns {Promise<object>} La solicitud creada.
   */
  create: async (
    usuarioId,
    categoriaSolicitadaId,
    documentos = [],
    publicaciones = []
  ) => {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insertar la solicitud principal
      const solicitudQuery = `
        INSERT INTO solicitudes_cambio_categoria (usuario_id, categoria_solicitada_id, estado)
        VALUES ($1, $2, 'Pendiente')
        RETURNING id, usuario_id, categoria_solicitada_id, fecha_solicitud, estado;
      `;
      const solicitudResult = await client.query(solicitudQuery, [
        usuarioId,
        categoriaSolicitadaId,
      ]);
      const nuevaSolicitud = solicitudResult.rows[0];
      const solicitudId = nuevaSolicitud.id;

      // 2. Insertar los documentos asociados (si existen)
      if (documentos && documentos.length > 0) {
        const docValues = documentos
          .map(
            (doc) =>
              `(${solicitudId}, '${db.pool.escapeLiteral(
                doc.nombre_archivo
              )}', '${db.pool.escapeLiteral(
                doc.path_archivo
              )}', '${db.pool.escapeLiteral(doc.tipo_mime)}', ${
                doc.tamano_bytes
              })`
          )
          .join(",");
        const docQuery = `
          INSERT INTO documentos_solicitud (solicitud_id, nombre_archivo, path_archivo, tipo_mime, tamano_bytes)
          VALUES ${docValues};
        `;
        await client.query(docQuery);
      }

      // 3. Insertar los enlaces a publicaciones (si existen)
      if (publicaciones && publicaciones.length > 0) {
        const pubValues = publicaciones
          .map(
            (pub) =>
              `(${solicitudId}, '${db.pool.escapeLiteral(pub.url)}', ${
                pub.descripcion
                  ? `'${db.pool.escapeLiteral(pub.descripcion)}'`
                  : "NULL"
              })`
          )
          .join(",");
        const pubQuery = `
          INSERT INTO publicaciones_solicitud (solicitud_id, url, descripcion)
          VALUES ${pubValues};
        `;
        await client.query(pubQuery);
      }

      await client.query("COMMIT");
      // Devolver la solicitud con sus detalles (podríamos hacer otra consulta para incluir docs/pubs si es necesario)
      return nuevaSolicitud;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creando solicitud de cambio de categoría:", error);
      // Aquí podríamos necesitar borrar archivos físicos si la transacción falla después de subirlos
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Busca solicitudes por ID de usuario.
   * @param {number} usuarioId
   * @returns {Promise<Array<object>>} Lista de solicitudes del usuario.
   */
  findByUserId: async (usuarioId) => {
    // Podríamos hacer JOINs para traer documentos y publicaciones aquí si se necesita en la lista
    const query = `
      SELECT s.*, c.nombre as nombre_categoria_solicitada
      FROM solicitudes_cambio_categoria s
      JOIN categorias c ON s.categoria_solicitada_id = c.id
      WHERE s.usuario_id = $1
      ORDER BY s.fecha_solicitud DESC;
    `;
    try {
      const { rows } = await db.query(query, [usuarioId]);
      return rows;
    } catch (error) {
      console.error(
        `Error buscando solicitudes para usuario ${usuarioId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Busca una solicitud por su ID, incluyendo documentos y publicaciones.
   * @param {number} solicitudId
   * @returns {Promise<object|null>} La solicitud con detalles o null si no existe.
   */
  findByIdWithDetails: async (solicitudId) => {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const solicitudQuery = `
        SELECT s.*, c.nombre as nombre_categoria_solicitada, u.nombre_usuario, u.nombre, u.apellidos
        FROM solicitudes_cambio_categoria s
        JOIN categorias c ON s.categoria_solicitada_id = c.id
        JOIN usuarios u ON s.usuario_id = u.id
        WHERE s.id = $1;
      `;
      const solicitudResult = await client.query(solicitudQuery, [solicitudId]);
      const solicitud = solicitudResult.rows[0];

      if (!solicitud) {
        await client.query("ROLLBACK"); // No es necesario realmente, pero por consistencia
        return null;
      }

      const documentosQuery = `SELECT * FROM documentos_solicitud WHERE solicitud_id = $1 ORDER BY fecha_carga ASC;`;
      const documentosResult = await client.query(documentosQuery, [
        solicitudId,
      ]);
      solicitud.documentos = documentosResult.rows;

      const publicacionesQuery = `SELECT * FROM publicaciones_solicitud WHERE solicitud_id = $1 ORDER BY fecha_agregado ASC;`;
      const publicacionesResult = await client.query(publicacionesQuery, [
        solicitudId,
      ]);
      solicitud.publicaciones = publicacionesResult.rows;

      await client.query("COMMIT"); // No es necesario realmente, pero por consistencia
      return solicitud;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(
        `Error buscando solicitud con detalles ${solicitudId}:`,
        error
      );
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Busca solicitudes pendientes de revisión.
   * @returns {Promise<Array<object>>} Lista de solicitudes pendientes.
   */
  findPending: async () => {
    const query = `
      SELECT s.id, s.fecha_solicitud, u.nombre_usuario, u.nombre, u.apellidos, c.nombre as nombre_categoria_solicitada
      FROM solicitudes_cambio_categoria s
      JOIN usuarios u ON s.usuario_id = u.id
      JOIN categorias c ON s.categoria_solicitada_id = c.id
      WHERE s.estado = 'Pendiente'
      ORDER BY s.fecha_solicitud ASC;
    `;
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Error buscando solicitudes pendientes:", error);
      throw error;
    }
  },

  /**
   * Actualiza el estado de una solicitud (Aprobada/Rechazada) por un administrador.
   * Si se aprueba, actualiza la categoría del usuario.
   * @param {number} solicitudId
   * @param {string} nuevoEstado - 'Aprobada' o 'Rechazada'
   * @param {string} observacionesAdmin
   * @param {number} adminId
   * @param {number} usuarioId - ID del usuario de la solicitud
   * @param {number} nuevaCategoriaId - ID de la categoría solicitada (si se aprueba)
   * @returns {Promise<boolean>} True si se actualizó correctamente.
   */
  reviewRequest: async (
    solicitudId,
    nuevoEstado,
    observacionesAdmin,
    adminId,
    usuarioId,
    nuevaCategoriaId
  ) => {
    if (nuevoEstado !== "Aprobada" && nuevoEstado !== "Rechazada") {
      throw new Error("Estado inválido para la revisión.");
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Actualizar la solicitud
      const updateSolicitudQuery = `
        UPDATE solicitudes_cambio_categoria
        SET estado = $1, observaciones_admin = $2, fecha_revision = NOW(), revisado_por_admin_id = $3
        WHERE id = $4 AND estado = 'Pendiente' -- Asegurar que solo se revisen pendientes
        RETURNING id;
      `;
      const updateResult = await client.query(updateSolicitudQuery, [
        nuevoEstado,
        observacionesAdmin,
        adminId,
        solicitudId,
      ]);

      if (updateResult.rowCount === 0) {
        // La solicitud no existía, no estaba pendiente o hubo un problema
        await client.query("ROLLBACK");
        return false; // Indicar que no se actualizó
      }

      // 2. Si se aprueba, actualizar la categoría del usuario
      if (nuevoEstado === "Aprobada") {
        const updateUserCategoryQuery = `
          UPDATE usuarios
          SET categoria_id = $1, fecha_actualizacion = NOW()
          WHERE id = $2;
        `;
        await client.query(updateUserCategoryQuery, [
          nuevaCategoriaId,
          usuarioId,
        ]);
        // Aquí podríamos añadir lógica para actualizar subcategoría si fuera necesario
      }

      await client.query("COMMIT");
      return true; // Indicar éxito
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`Error revisando solicitud ${solicitudId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = categoryRequestModel;
