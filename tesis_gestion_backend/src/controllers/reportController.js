const reportModel = require("../models/reportModel");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const Joi = require("joi");

// Esquema de validación para los query params del reporte
const reportQuerySchema = Joi.object({
  startDate: Joi.date()
    .iso()
    .required()
    .messages({ "date.format": "startDate debe estar en formato YYYY-MM-DD" }),
  endDate: Joi.date().iso().required().min(Joi.ref("startDate")).messages({
    "date.format": "endDate debe estar en formato YYYY-MM-DD",
    "date.min": "endDate debe ser igual o posterior a startDate",
  }),
  roleId: Joi.number().integer().optional(),
  categoryId: Joi.number().integer().optional(),
});

// Esquema para validar parámetros en reportes de sobrecarga docente
const overloadReportSchema = Joi.object({
  startDate: Joi.date()
    .iso()
    .required()
    .messages({ "date.format": "startDate debe estar en formato YYYY-MM-DD" }),
  endDate: Joi.date().iso().required().min(Joi.ref("startDate")).messages({
    "date.format": "endDate debe estar en formato YYYY-MM-DD",
    "date.min": "endDate debe ser igual o posterior a startDate",
  }),
  roleId: Joi.number().integer().optional(),
  categoryId: Joi.number().integer().optional(),
  departmentId: Joi.number().integer().optional(),
  fondoSalario: Joi.number().positive().optional(),
});

const reportController = {
  /**
   * Obtiene los filtros disponibles para los reportes (roles y categorías).
   */
  getReportFilters: async (req, res) => {
    try {
      const [roles, categories] = await Promise.all([
        reportModel.getAllRoles(),
        reportModel.getAllCategories(),
      ]);
      res.status(200).json({ roles, categories });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error al obtener filtros para reportes." });
    }
  },

  /**
   * Genera el reporte de sobrecumplimiento en formato PDF.
   */
  generateOverCompliancePDF: async (req, res) => {
    const { error, value } = reportQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { startDate, endDate, roleId, categoryId } = value;

    try {
      const data = await reportModel.getOverComplianceData(
        startDate,
        endDate,
        roleId,
        categoryId
      );

      const doc = new PDFDocument({
        margin: 50,
        layout: "landscape",
        size: "A4",
      });

      // Establecer encabezados HTTP para la descarga del PDF
      const filename = `Reporte_Sobrecumplimiento_${startDate}_a_${endDate}.pdf`;
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Type", "application/pdf");

      // Pipe el PDF directamente a la respuesta
      doc.pipe(res);

      // --- Contenido del PDF ---
      doc
        .fontSize(16)
        .text("Reporte de Sobrecumplimiento de Horas", { align: "center" });
      doc
        .fontSize(12)
        .text(`Período: ${startDate} a ${endDate}`, { align: "center" });
      doc.moveDown();

      // Encabezados de la tabla
      const tableTop = doc.y;
      const colWidths = [120, 120, 80, 80, 80, 80, 80]; // Ajustar anchos
      const headers = [
        "Usuario",
        "Nombre Completo",
        "Rol",
        "Categoría",
        "Norma Período",
        "Horas Registradas",
        "Sobrecumplimiento",
      ];

      doc.font("Helvetica-Bold");
      headers.forEach((header, i) => {
        doc.text(
          header,
          doc.x +
            (i === 0 ? 0 : colWidths.slice(0, i).reduce((a, b) => a + b, 0)),
          tableTop,
          { width: colWidths[i], align: "center" }
        );
      });
      doc.moveDown();
      doc.font("Helvetica");

      // Filas de datos
      data.forEach((row) => {
        const y = doc.y;
        const rowData = [
          row.nombre_usuario,
          `${row.apellidos || ""}, ${row.nombre || ""}`,
          row.nombre_rol,
          row.nombre_categoria || "N/A",
          row.horas_norma_periodo.toFixed(2),
          row.horas_registradas_periodo.toFixed(2),
          row.horas_sobrecumplimiento.toFixed(2),
        ];
        rowData.forEach((cell, i) => {
          doc.text(
            cell,
            doc.x +
              (i === 0 ? 0 : colWidths.slice(0, i).reduce((a, b) => a + b, 0)),
            y,
            { width: colWidths[i], align: i < 2 ? "left" : "center" }
          );
        });
        doc.moveDown(0.5); // Espacio entre filas
        // Dibujar línea divisoria (opcional)
        doc
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .stroke();
        doc.moveDown(0.5);
      });

      // --- Fin del Contenido del PDF ---

      // Finalizar el PDF
      doc.end();
    } catch (error) {
      console.error("Error generando PDF:", error);
      // Asegurarse de no enviar cabeceras si ya se enviaron
      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: "Error interno al generar el reporte PDF." });
      }
    }
  },

  /**
   * Genera el reporte de sobrecumplimiento en formato Excel (XLSX).
   */
  generateOverComplianceExcel: async (req, res) => {
    const { error, value } = reportQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { startDate, endDate, roleId, categoryId } = value;

    try {
      const data = await reportModel.getOverComplianceData(
        startDate,
        endDate,
        roleId,
        categoryId
      );

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Sistema Gestion Academica";
      workbook.lastModifiedBy = "Sistema Gestion Academica";
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet("Sobrecumplimiento");

      // Título
      worksheet.mergeCells("A1:H1");
      worksheet.getCell("A1").value = "Reporte de Sobrecumplimiento de Horas";
      worksheet.getCell("A1").font = { size: 16, bold: true };
      worksheet.getCell("A1").alignment = { horizontal: "center" };
      worksheet.mergeCells("A2:H2");
      worksheet.getCell("A2").value = `Período: ${startDate} a ${endDate}`;
      worksheet.getCell("A2").alignment = { horizontal: "center" };

      // Encabezados de la tabla
      worksheet.columns = [
        { header: "Usuario", key: "nombre_usuario", width: 20 },
        { header: "Apellidos", key: "apellidos", width: 25 },
        { header: "Nombre", key: "nombre", width: 25 },
        { header: "Rol", key: "nombre_rol", width: 15 },
        { header: "Categoría", key: "nombre_categoria", width: 20 },
        {
          header: "Norma Período (Hrs)",
          key: "horas_norma_periodo",
          width: 18,
          style: { numFmt: "#,##0.00" },
        },
        {
          header: "Horas Registradas",
          key: "horas_registradas_periodo",
          width: 18,
          style: { numFmt: "#,##0.00" },
        },
        {
          header: "Sobrecumplimiento (Hrs)",
          key: "horas_sobrecumplimiento",
          width: 22,
          style: { numFmt: "#,##0.00" },
        },
      ];
      // Estilo para encabezados
      worksheet.getRow(4).font = { bold: true };
      worksheet.getRow(4).alignment = { horizontal: "center" };

      // Añadir filas de datos
      data.forEach((row) => {
        worksheet.addRow({
          ...row,
          nombre_categoria: row.nombre_categoria || "N/A", // Manejar nulos
        });
      });

      // Establecer encabezados HTTP para la descarga del Excel
      const filename = `Reporte_Sobrecumplimiento_${startDate}_a_${endDate}.xlsx`;
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      // Escribir el libro de trabajo en la respuesta
      await workbook.xlsx.write(res);
      res.end(); // Finalizar la respuesta
    } catch (error) {
      console.error("Error generando Excel:", error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: "Error interno al generar el reporte Excel." });
      }
    }
  },

  /**
   * Obtiene los datos de sobrecarga docente según la Resolución 32/2024.
   * Responde con un JSON detallado de horas por profesor.
   */
  getTeachingOverloadData: async (req, res) => {
    const { error, value } = overloadReportSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { startDate, endDate, roleId, categoryId, departmentId } = value;

    try {
      const data = await reportModel.getTeachingOverloadData(
        startDate,
        endDate,
        roleId,
        categoryId,
        departmentId
      );

      res.status(200).json(data);
    } catch (error) {
      console.error("Error obteniendo datos de sobrecarga docente:", error);
      res.status(500).json({
        message: "Error al obtener datos de sobrecarga docente.",
      });
    }
  },

  /**
   * Genera el reporte de sobrecarga docente en formato PDF
   * según la Resolución 32/2024.
   */
  generateTeachingOverloadPDF: async (req, res) => {
    const { error, value } = overloadReportSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { startDate, endDate, roleId, categoryId, departmentId } = value;

    try {
      const data = await reportModel.getTeachingOverloadData(
        startDate,
        endDate,
        roleId,
        categoryId,
        departmentId
      );

      const doc = new PDFDocument({
        margin: 50,
        layout: "landscape",
        size: "A4",
      });

      // Establecer encabezados HTTP para la descarga del PDF
      const filename = `Sobrecarga_Docente_${startDate}_a_${endDate}.pdf`;
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Type", "application/pdf");

      // Pipe el PDF directamente a la respuesta
      doc.pipe(res);

      // --- Contenido del PDF ---
      doc
        .fontSize(16)
        .text("Reporte de Sobrecarga Docente - Resolución 32/2024", {
          align: "center",
        });
      doc
        .fontSize(12)
        .text(`Período: ${startDate} a ${endDate}`, { align: "center" });
      doc.moveDown();

      // Información general
      doc
        .fontSize(14)
        .text("Resumen de Profesores con Sobrecarga", { align: "left" });
      doc.moveDown(0.5);

      // Encabezados de la tabla
      const tableTop = doc.y;
      const colWidths = [150, 120, 100, 100, 100, 100]; // Ajustar anchos según necesidad
      const headers = [
        "Profesor",
        "Categoría",
        "Total Horas",
        "Horas Pregrado",
        "Horas Preparación",
        "Sobrecarga",
      ];

      doc.font("Helvetica-Bold");
      headers.forEach((header, i) => {
        doc.text(
          header,
          doc.x +
            (i === 0 ? 0 : colWidths.slice(0, i).reduce((a, b) => a + b, 0)),
          tableTop,
          { width: colWidths[i], align: "center" }
        );
      });
      doc.moveDown();
      doc.font("Helvetica");

      // Filas de datos
      data.forEach((profesor) => {
        const y = doc.y;

        // Si la página está llena, crear una nueva página
        if (y > doc.page.height - 100) {
          doc.addPage();
          doc.y = 50;
          const y = doc.y;

          // Repetir encabezados en la nueva página
          doc.font("Helvetica-Bold");
          headers.forEach((header, i) => {
            doc.text(
              header,
              doc.x +
                (i === 0
                  ? 0
                  : colWidths.slice(0, i).reduce((a, b) => a + b, 0)),
              y,
              { width: colWidths[i], align: "center" }
            );
          });
          doc.moveDown();
          doc.font("Helvetica");
        }

        const rowData = [
          `${profesor.apellidos || ""}, ${profesor.nombre || ""}`,
          profesor.nombre_categoria || "N/A",
          profesor.total_horas.toFixed(2),
          profesor.horas_pregrado.toFixed(2),
          profesor.horas_preparacion.toFixed(2),
          profesor.horas_sobrecarga.toFixed(2),
        ];

        rowData.forEach((cell, i) => {
          doc.text(
            cell,
            doc.x +
              (i === 0 ? 0 : colWidths.slice(0, i).reduce((a, b) => a + b, 0)),
            doc.y,
            { width: colWidths[i], align: i === 0 ? "left" : "center" }
          );
        });

        doc.moveDown(0.5);
        // Dibujar línea divisoria
        doc
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .stroke();
        doc.moveDown(0.5);
      });

      // Para cada profesor con sobrecarga, añadir una página con sus detalles
      data
        .filter((p) => p.horas_sobrecarga > 0)
        .forEach((profesor, index) => {
          // Añadir nueva página para cada profesor
          doc.addPage();

          // Título con información del profesor
          doc
            .fontSize(14)
            .text(
              `Detalle de Actividades: ${profesor.apellidos || ""}, ${
                profesor.nombre || ""
              }`,
              {
                align: "center",
              }
            );
          doc
            .fontSize(12)
            .text(
              `Categoría: ${
                profesor.nombre_categoria || "N/A"
              } - Total Horas: ${profesor.total_horas.toFixed(
                2
              )} - Sobrecarga: ${profesor.horas_sobrecarga.toFixed(2)}`,
              {
                align: "center",
              }
            );
          doc.moveDown();

          // Tabla de actividades
          const actTableTop = doc.y;
          const actColWidths = [300, 90, 90, 90]; // Anchos de columna para actividades
          const actHeaders = [
            "Tipo de Actividad",
            "Horas Dedicadas",
            "Grupos",
            "Estudiantes",
          ];

          doc.font("Helvetica-Bold");
          actHeaders.forEach((header, i) => {
            doc.text(
              header,
              doc.x +
                (i === 0
                  ? 0
                  : actColWidths.slice(0, i).reduce((a, b) => a + b, 0)),
              actTableTop,
              { width: actColWidths[i], align: "center" }
            );
          });
          doc.moveDown();
          doc.font("Helvetica");

          // Filas de datos de actividades
          if (profesor.actividades && profesor.actividades.length > 0) {
            profesor.actividades.forEach((actividad) => {
              const ay = doc.y;

              // Nueva página si es necesario
              if (ay > doc.page.height - 100) {
                doc.addPage();
                doc.y = 50;
                const actTableTop = doc.y;

                doc
                  .fontSize(14)
                  .text(
                    `Detalle de Actividades: ${profesor.apellidos || ""}, ${
                      profesor.nombre || ""
                    } (continuación)`,
                    {
                      align: "center",
                    }
                  );
                doc.moveDown();

                doc.font("Helvetica-Bold");
                actHeaders.forEach((header, i) => {
                  doc.text(
                    header,
                    doc.x +
                      (i === 0
                        ? 0
                        : actColWidths.slice(0, i).reduce((a, b) => a + b, 0)),
                    doc.y,
                    { width: actColWidths[i], align: "center" }
                  );
                });
                doc.moveDown();
                doc.font("Helvetica");
              }

              const actData = [
                actividad.nombre_tipo_actividad,
                actividad.horas_dedicadas.toFixed(2),
                actividad.cantidad_grupos.toString(),
                actividad.cantidad_estudiantes.toString(),
              ];

              actData.forEach((cell, i) => {
                doc.text(
                  cell,
                  doc.x +
                    (i === 0
                      ? 0
                      : actColWidths.slice(0, i).reduce((a, b) => a + b, 0)),
                  doc.y,
                  { width: actColWidths[i], align: i === 0 ? "left" : "center" }
                );
              });

              doc.moveDown(0.5);
            });

            // Total de horas
            doc.moveDown();
            doc.font("Helvetica-Bold");
            doc.text(`TOTAL HORAS: ${profesor.total_horas.toFixed(2)}`, {
              align: "right",
            });
          } else {
            doc.text("No hay actividades registradas para este profesor", {
              align: "center",
            });
          }
        });

      // --- Fin del Contenido del PDF ---

      // Finalizar el PDF
      doc.end();
    } catch (error) {
      console.error("Error generando PDF de sobrecarga docente:", error);
      // Asegurarse de no enviar cabeceras si ya se enviaron
      if (!res.headersSent) {
        res.status(500).json({
          message:
            "Error interno al generar el reporte PDF de sobrecarga docente.",
        });
      }
    }
  },

  /**
   * Genera el reporte de sobrecarga docente en formato Excel
   * según la Resolución 32/2024.
   */
  generateTeachingOverloadExcel: async (req, res) => {
    const { error, value } = overloadReportSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { startDate, endDate, roleId, categoryId, departmentId } = value;

    try {
      const data = await reportModel.getTeachingOverloadData(
        startDate,
        endDate,
        roleId,
        categoryId,
        departmentId
      );

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Sistema Gestión Académica";
      workbook.lastModifiedBy = "Sistema Gestión Académica";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Hoja 1: Resumen de profesores con sobrecarga
      const wsResumen = workbook.addWorksheet("Resumen Sobrecarga");

      // Título
      wsResumen.mergeCells("A1:H1");
      wsResumen.getCell("A1").value =
        "Reporte de Sobrecarga Docente - Resolución 32/2024";
      wsResumen.getCell("A1").font = { size: 16, bold: true };
      wsResumen.getCell("A1").alignment = { horizontal: "center" };
      wsResumen.mergeCells("A2:H2");
      wsResumen.getCell("A2").value = `Período: ${startDate} a ${endDate}`;
      wsResumen.getCell("A2").alignment = { horizontal: "center" };

      // Encabezados de la tabla de resumen
      wsResumen.columns = [
        { header: "Apellidos", key: "apellidos", width: 25 },
        { header: "Nombre", key: "nombre", width: 25 },
        { header: "Categoría", key: "nombre_categoria", width: 20 },
        {
          header: "Norma Semanal",
          key: "horas_norma_semanal",
          width: 15,
          style: { numFmt: "#,##0.00" },
        },
        {
          header: "Total Horas",
          key: "total_horas",
          width: 15,
          style: { numFmt: "#,##0.00" },
        },
        {
          header: "Horas Pregrado",
          key: "horas_pregrado",
          width: 15,
          style: { numFmt: "#,##0.00" },
        },
        {
          header: "Horas Preparación",
          key: "horas_preparacion",
          width: 18,
          style: { numFmt: "#,##0.00" },
        },
        {
          header: "Sobrecarga",
          key: "horas_sobrecarga",
          width: 15,
          style: { numFmt: "#,##0.00" },
        },
      ];

      // Estilo para encabezados
      wsResumen.getRow(4).font = { bold: true };
      wsResumen.getRow(4).alignment = { horizontal: "center" };

      // Añadir filas de datos para el resumen
      data.forEach((profesor) => {
        wsResumen.addRow({
          apellidos: profesor.apellidos || "",
          nombre: profesor.nombre || "",
          nombre_categoria: profesor.nombre_categoria || "N/A",
          horas_norma_semanal: profesor.horas_norma_semanal,
          total_horas: profesor.total_horas,
          horas_pregrado: profesor.horas_pregrado,
          horas_preparacion: profesor.horas_preparacion,
          horas_sobrecarga: profesor.horas_sobrecarga,
        });
      });

      // Crear una hoja para cada profesor con detalle de actividades
      data.forEach((profesor) => {
        if (profesor.actividades && profesor.actividades.length > 0) {
          // Limitar nombre de la hoja a 31 caracteres (límite Excel)
          const nombreHoja = `${profesor.apellidos || ""}`.slice(0, 31);
          const wsProfesor = workbook.addWorksheet(nombreHoja);

          // Título de la hoja de profesor
          wsProfesor.mergeCells("A1:F1");
          wsProfesor.getCell("A1").value = `Detalle Actividades: ${
            profesor.apellidos || ""
          }, ${profesor.nombre || ""}`;
          wsProfesor.getCell("A1").font = { size: 14, bold: true };
          wsProfesor.getCell("A1").alignment = { horizontal: "center" };

          wsProfesor.mergeCells("A2:F2");
          wsProfesor.getCell("A2").value = `Categoría: ${
            profesor.nombre_categoria
          } - Total Horas: ${profesor.total_horas.toFixed(
            2
          )} - Sobrecarga: ${profesor.horas_sobrecarga.toFixed(2)}`;
          wsProfesor.getCell("A2").font = { size: 12 };
          wsProfesor.getCell("A2").alignment = { horizontal: "center" };

          // Encabezados de tabla de actividades
          wsProfesor.columns = [
            {
              header: "Tipo de Actividad",
              key: "nombre_tipo_actividad",
              width: 40,
            },
            {
              header: "Horas Dedicadas",
              key: "horas_dedicadas",
              width: 15,
              style: { numFmt: "#,##0.00" },
            },
            { header: "Cantidad Grupos", key: "cantidad_grupos", width: 18 },
            {
              header: "Cantidad Actividades",
              key: "cantidad_actividades",
              width: 22,
            },
            {
              header: "Cantidad Estudiantes",
              key: "cantidad_estudiantes",
              width: 22,
            },
          ];

          // Estilo para encabezados
          wsProfesor.getRow(4).font = { bold: true };
          wsProfesor.getRow(4).alignment = { horizontal: "center" };

          // Añadir actividades
          profesor.actividades.forEach((actividad) => {
            wsProfesor.addRow({
              nombre_tipo_actividad: actividad.nombre_tipo_actividad,
              horas_dedicadas: actividad.horas_dedicadas,
              cantidad_grupos: actividad.cantidad_grupos,
              cantidad_actividades: actividad.cantidad_actividades,
              cantidad_estudiantes: actividad.cantidad_estudiantes,
            });
          });

          // Añadir fila de totales
          const lastRow = wsProfesor.rowCount + 2;
          wsProfesor.getCell(`A${lastRow}`).value = "TOTAL HORAS";
          wsProfesor.getCell(`A${lastRow}`).font = { bold: true };
          wsProfesor.getCell(`B${lastRow}`).value = profesor.total_horas;
          wsProfesor.getCell(`B${lastRow}`).font = { bold: true };
          wsProfesor.getCell(`B${lastRow}`).numFmt = "#,##0.00";
        }
      });

      // Establecer encabezados HTTP para la descarga del Excel
      const filename = `Sobrecarga_Docente_${startDate}_a_${endDate}.xlsx`;
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      // Escribir el libro de trabajo en la respuesta
      await workbook.xlsx.write(res);
      res.end(); // Finalizar la respuesta
    } catch (error) {
      console.error("Error generando Excel de sobrecarga docente:", error);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Error al generar reporte Excel de sobrecarga docente.",
        });
      }
    }
  },

  /**
   * Calcula los coeficientes de sobrecarga para pago según fondo disponible
   * (Resolución 32/2024)
   */
  calculateOverloadPayment: async (req, res) => {
    const { error, value } = overloadReportSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { startDate, endDate, fondoSalario } = value;

    if (!fondoSalario) {
      return res.status(400).json({
        message:
          "El fondo de salario no ejecutado es requerido para este cálculo.",
      });
    }

    try {
      const data = await reportModel.calculateOverloadCoefficients(
        startDate,
        endDate,
        parseFloat(fondoSalario)
      );

      res.status(200).json(data);
    } catch (error) {
      console.error("Error calculando pago por sobrecarga:", error);
      res.status(500).json({
        message: "Error al calcular el pago por sobrecarga docente.",
      });
    }
  },

  /**
   * Genera el reporte de pago por sobrecarga docente en formato PDF
   * según la Resolución 32/2024.
   */
  generateOverloadPaymentPDF: async (req, res) => {
    const { error, value } = overloadReportSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { startDate, endDate, fondoSalario } = value;

    if (!fondoSalario) {
      return res.status(400).json({
        message:
          "El fondo de salario no ejecutado es requerido para este cálculo.",
      });
    }

    try {
      const data = await reportModel.calculateOverloadCoefficients(
        startDate,
        endDate,
        parseFloat(fondoSalario)
      );

      const doc = new PDFDocument({
        margin: 50,
        layout: "portrait",
        size: "A4",
      });

      // Establecer encabezados HTTP para la descarga del PDF
      const filename = `Pago_Sobrecarga_Docente_${startDate}_a_${endDate}.pdf`;
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Type", "application/pdf");

      // Pipe el PDF directamente a la respuesta
      doc.pipe(res);

      // --- Contenido del PDF ---
      doc
        .fontSize(16)
        .text("Cálculo de Pago por Sobrecarga Docente - Resolución 32/2024", {
          align: "center",
        });
      doc
        .fontSize(12)
        .text(`Período: ${startDate} a ${endDate}`, { align: "center" });
      doc.moveDown();

      // Información del fondo salarial
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Resumen del Fondo Salarial", { align: "left" });
      doc.moveDown(0.5);

      const infoTable = [
        [
          "Fondo de Salario No Ejecutado:",
          `${data.resumen.fondo_salario_no_ejecutado.toFixed(2)}`,
        ],
        [
          "Fondo de Salario Necesario:",
          `${data.resumen.fondo_salario_necesario.toFixed(2)}`,
        ],
        [
          "Porcentaje del Fondo Aplicable:",
          `${(data.resumen.porcentaje_fondo * 100).toFixed(2)}%`,
        ],
        [
          "Total Horas de Sobrecarga:",
          `${data.resumen.total_horas_sobrecarga.toFixed(2)}`,
        ],
        ["Total Profesores a Pagar:", `${data.resumen.total_profesores}`],
        ["Total a Pagar:", `${data.resumen.total_a_pagar.toFixed(2)}`],
      ];

      // Ancho de la primera columna (etiquetas)
      const labelWidth = 250;
      // Ancho de la segunda columna (valores)
      const valueWidth = 150;

      infoTable.forEach((row) => {
        doc
          .font("Helvetica-Bold")
          .text(row[0], { continued: true, width: labelWidth });
        doc.font("Helvetica").text(row[1], { width: valueWidth });
      });

      doc.moveDown();

      // Tabla de coeficientes por categoría
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Coeficientes por Categoría Docente", { align: "left" });
      doc.moveDown(0.5);

      // Encabezados de la tabla de coeficientes
      const coeffTableTop = doc.y;
      const coeffColWidths = [150, 120, 120, 120];
      const coeffHeaders = [
        "Categoría",
        "Tarifa Horaria",
        "Horas Sobrecarga",
        "Coeficiente",
      ];

      doc.font("Helvetica-Bold").fontSize(12);
      coeffHeaders.forEach((header, i) => {
        doc.text(
          header,
          doc.x +
            (i === 0
              ? 0
              : coeffColWidths.slice(0, i).reduce((a, b) => a + b, 0)),
          coeffTableTop,
          { width: coeffColWidths[i], align: "center" }
        );
      });
      doc.moveDown();
      doc.font("Helvetica");

      // Filas de datos de coeficientes
      data.coeficientes_por_categoria.forEach((cat) => {
        const coeffRowData = [
          cat.categoria,
          cat.tarifa_horaria.toFixed(2),
          cat.horas_sobrecarga.toFixed(2),
          cat.coeficiente.toFixed(2),
        ];

        coeffRowData.forEach((cell, i) => {
          doc.text(
            cell,
            doc.x +
              (i === 0
                ? 0
                : coeffColWidths.slice(0, i).reduce((a, b) => a + b, 0)),
            doc.y,
            { width: coeffColWidths[i], align: i === 0 ? "left" : "center" }
          );
        });

        doc.moveDown(0.5);
      });

      doc.moveDown();

      // Tabla de profesores a pagar
      doc.addPage();
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Detalle de Pago por Profesor", { align: "left" });
      doc.moveDown(0.5);

      // Encabezados de la tabla de pagos
      const payTableTop = doc.y;
      const payColWidths = [200, 100, 100, 90, 90];
      const payHeaders = [
        "Nombre Completo",
        "Categoría",
        "Horas Sobrecarga",
        "Coeficiente",
        "Monto a Pagar",
      ];

      doc.font("Helvetica-Bold").fontSize(11);
      payHeaders.forEach((header, i) => {
        doc.text(
          header,
          doc.x +
            (i === 0 ? 0 : payColWidths.slice(0, i).reduce((a, b) => a + b, 0)),
          payTableTop,
          { width: payColWidths[i], align: "center" }
        );
      });
      doc.moveDown();
      doc.font("Helvetica");

      // Filas de datos de pagos
      data.profesores_a_pagar.forEach((profesor) => {
        const payRowData = [
          profesor.nombre_completo,
          profesor.categoria,
          profesor.horas_sobrecarga.toFixed(2),
          profesor.coeficiente.toFixed(2),
          profesor.monto_pagar.toFixed(2),
        ];

        // Si la página está llena, crear una nueva página
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          doc.y = 50;

          // Repetir encabezados en la nueva página
          doc
            .font("Helvetica-Bold")
            .fontSize(14)
            .text("Detalle de Pago por Profesor (continuación)", {
              align: "left",
            });
          doc.moveDown(0.5);

          const payTableTop = doc.y;
          doc.font("Helvetica-Bold").fontSize(11);
          payHeaders.forEach((header, i) => {
            doc.text(
              header,
              doc.x +
                (i === 0
                  ? 0
                  : payColWidths.slice(0, i).reduce((a, b) => a + b, 0)),
              payTableTop,
              { width: payColWidths[i], align: "center" }
            );
          });
          doc.moveDown();
          doc.font("Helvetica");
        }

        payRowData.forEach((cell, i) => {
          doc.text(
            cell,
            doc.x +
              (i === 0
                ? 0
                : payColWidths.slice(0, i).reduce((a, b) => a + b, 0)),
            doc.y,
            { width: payColWidths[i], align: i === 0 ? "left" : "center" }
          );
        });

        doc.moveDown(0.5);
        // Dibujar línea divisoria
        doc
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .stroke();
        doc.moveDown(0.5);
      });

      // Añadir el total a pagar al final
      doc.moveDown();
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(`TOTAL A PAGAR: ${data.resumen.total_a_pagar.toFixed(2)}`, {
          align: "right",
        });

      // --- Fin del Contenido del PDF ---

      // Finalizar el PDF
      doc.end();
    } catch (error) {
      console.error("Error generando PDF de pago por sobrecarga:", error);
      // Asegurarse de no enviar cabeceras si ya se enviaron
      if (!res.headersSent) {
        res
          .status(500)
          .json({
            message:
              "Error interno al generar el reporte PDF de pago por sobrecarga.",
          });
      }
    }
  },

  /**
   * Genera el reporte de pago por sobrecarga docente en formato Excel
   * según la Resolución 32/2024.
   */
  generateOverloadPaymentExcel: async (req, res) => {
    const { error, value } = overloadReportSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { startDate, endDate, fondoSalario } = value;

    if (!fondoSalario) {
      return res.status(400).json({
        message:
          "El fondo de salario no ejecutado es requerido para este cálculo.",
      });
    }

    try {
      const data = await reportModel.calculateOverloadCoefficients(
        startDate,
        endDate,
        parseFloat(fondoSalario)
      );

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Sistema Gestión Académica";
      workbook.lastModifiedBy = "Sistema Gestión Académica";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Hoja 1: Resumen y coeficientes
      const wsResumen = workbook.addWorksheet("Resumen Pago Sobrecarga");

      // Título
      wsResumen.mergeCells("A1:F1");
      wsResumen.getCell("A1").value =
        "Cálculo de Pago por Sobrecarga Docente - Resolución 32/2024";
      wsResumen.getCell("A1").font = { size: 16, bold: true };
      wsResumen.getCell("A1").alignment = { horizontal: "center" };
      wsResumen.mergeCells("A2:F2");
      wsResumen.getCell("A2").value = `Período: ${startDate} a ${endDate}`;
      wsResumen.getCell("A2").alignment = { horizontal: "center" };

      // Información del fondo salarial
      wsResumen.getCell("A4").value = "Fondo de Salario No Ejecutado:";
      wsResumen.getCell("A4").font = { bold: true };
      wsResumen.getCell("B4").value = data.resumen.fondo_salario_no_ejecutado;
      wsResumen.getCell("B4").numFmt = "#,##0.00";

      wsResumen.getCell("A5").value = "Fondo de Salario Necesario:";
      wsResumen.getCell("A5").font = { bold: true };
      wsResumen.getCell("B5").value = data.resumen.fondo_salario_necesario;
      wsResumen.getCell("B5").numFmt = "#,##0.00";

      wsResumen.getCell("A6").value = "Porcentaje del Fondo Aplicable:";
      wsResumen.getCell("A6").font = { bold: true };
      wsResumen.getCell("B6").value = data.resumen.porcentaje_fondo;
      wsResumen.getCell("B6").numFmt = "0.00%";

      wsResumen.getCell("A7").value = "Total Horas de Sobrecarga:";
      wsResumen.getCell("A7").font = { bold: true };
      wsResumen.getCell("B7").value = data.resumen.total_horas_sobrecarga;
      wsResumen.getCell("B7").numFmt = "#,##0.00";

      wsResumen.getCell("A8").value = "Total Profesores a Pagar:";
      wsResumen.getCell("A8").font = { bold: true };
      wsResumen.getCell("B8").value = data.resumen.total_profesores;

      wsResumen.getCell("A9").value = "Total a Pagar:";
      wsResumen.getCell("A9").font = { bold: true };
      wsResumen.getCell("B9").value = data.resumen.total_a_pagar;
      wsResumen.getCell("B9").numFmt = "#,##0.00";

      // Ajustar ancho de columnas para la información
      wsResumen.getColumn("A").width = 30;
      wsResumen.getColumn("B").width = 15;

      // Tabla de coeficientes por categoría
      wsResumen.getCell("A11").value = "Coeficientes por Categoría Docente";
      wsResumen.getCell("A11").font = { size: 14, bold: true };

      wsResumen.getCell("A12").value = "Categoría";
      wsResumen.getCell("A12").font = { bold: true };
      wsResumen.getCell("B12").value = "Tarifa Horaria";
      wsResumen.getCell("B12").font = { bold: true };
      wsResumen.getCell("C12").value = "Horas Sobrecarga";
      wsResumen.getCell("C12").font = { bold: true };
      wsResumen.getCell("D12").value = "Coeficiente";
      wsResumen.getCell("D12").font = { bold: true };

      let row = 13;
      data.coeficientes_por_categoria.forEach((cat) => {
        wsResumen.getCell(`A${row}`).value = cat.categoria;
        wsResumen.getCell(`B${row}`).value = cat.tarifa_horaria;
        wsResumen.getCell(`B${row}`).numFmt = "#,##0.00";
        wsResumen.getCell(`C${row}`).value = cat.horas_sobrecarga;
        wsResumen.getCell(`C${row}`).numFmt = "#,##0.00";
        wsResumen.getCell(`D${row}`).value = cat.coeficiente;
        wsResumen.getCell(`D${row}`).numFmt = "#,##0.00";
        row++;
      });

      // Ajustar anchos
      wsResumen.getColumn("C").width = 20;
      wsResumen.getColumn("D").width = 15;

      // Hoja 2: Detalles de pago por profesor
      const wsDetalles = workbook.addWorksheet("Detalles Pago por Profesor");

      // Encabezados
      wsDetalles.columns = [
        { header: "Nombre Completo", key: "nombre_completo", width: 40 },
        { header: "Categoría", key: "categoria", width: 20 },
        {
          header: "Horas Sobrecarga",
          key: "horas_sobrecarga",
          width: 18,
          style: { numFmt: "#,##0.00" },
        },
        {
          header: "Coeficiente",
          key: "coeficiente",
          width: 15,
          style: { numFmt: "#,##0.00" },
        },
        {
          header: "Monto a Pagar",
          key: "monto_pagar",
          width: 18,
          style: { numFmt: "#,##0.00" },
        },
      ];

      // Estilo para encabezados
      wsDetalles.getRow(1).font = { bold: true };
      wsDetalles.getRow(1).alignment = { horizontal: "center" };

      // Añadir datos de profesores
      data.profesores_a_pagar.forEach((profesor) => {
        wsDetalles.addRow({
          nombre_completo: profesor.nombre_completo,
          categoria: profesor.categoria,
          horas_sobrecarga: profesor.horas_sobrecarga,
          coeficiente: profesor.coeficiente,
          monto_pagar: profesor.monto_pagar,
        });
      });

      // Establecer encabezados HTTP para la descarga del Excel
      const filename = `Pago_Sobrecarga_Docente_${startDate}_a_${endDate}.xlsx`;
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      // Escribir el libro de trabajo en la respuesta
      await workbook.xlsx.write(res);
      res.end(); // Finalizar la respuesta
    } catch (error) {
      console.error("Error generando Excel de pago por sobrecarga:", error);
      if (!res.headersSent) {
        res.status(500).json({
          message:
            "Error al generar reporte Excel de pago por sobrecarga docente.",
        });
      }
    }
  },
};

module.exports = reportController;
