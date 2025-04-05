const express = require("express");
const cors = require("cors");
const path = require("path"); // Necesario para servir archivos estáticos
const config = require("./config");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const professorRoutes = require("./routes/professorRoutes"); // Importar rutas de profesor
const planningRoutes = require("./routes/planningRoutes"); // Importar rutas de planificación
const notificationRoutes = require("./routes/notificationRoutes"); // Importar rutas de notificación
const eventRoutes = require("./routes/eventRoutes"); // Importar rutas de eventos
const newsRoutes = require("./routes/newsRoutes"); // Importar rutas de noticias
const categoryRoutes = require("./routes/categoryRoutes"); // Importar rutas de categorías
const convocatoriaRoutes = require("./routes/convocatoriaRoutes");
const reportRoutes = require("./routes/reportRoutes"); // Importar rutas de convocatorias

const app = express();

// Middlewares globales
app.use(cors()); // Habilitar CORS para todas las rutas (ajustar en producción si es necesario)
app.use(express.json()); // Para parsear bodies JSON
app.use(express.urlencoded({ extended: true })); // Para parsear bodies URL-encoded

// Servir archivos estáticos (los documentos subidos) - ¡IMPORTANTE!
// Esto permite acceder a los archivos subidos desde el frontend (si es necesario)
// La ruta '/uploads' en la URL mapeará al directorio 'uploads' en el servidor
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes); // Rutas protegidas para administradores
app.use("/api/professor", professorRoutes); // Usar rutas de profesor
app.use("/api/planning", planningRoutes); // Usar rutas de planificación
app.use("/api/notifications", notificationRoutes); // Usar rutas de notificación
app.use("/api/events", eventRoutes); // Usar rutas de eventos
app.use("/api/convocatorias", convocatoriaRoutes); // Usar rutas de convocatorias
app.use("/api/news", newsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reports", reportRoutes);

// Ruta de bienvenida o health check
app.get("/", (req, res) => {
  res.send("API de Gestión Académica funcionando!");
});

// Middleware de manejo de errores (básico)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Manejo específico para errores de Joi
  if (err && err.isJoi) {
    return res.status(400).json({
      message: "Error de validación.",
      details: err.details.map((d) => d.message).join(", "), // O solo el primer mensaje: err.details[0].message
    });
  }
  res.status(500).send("¡Algo salió mal!");
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

module.exports = app; // Exportar app para usar en server.js
