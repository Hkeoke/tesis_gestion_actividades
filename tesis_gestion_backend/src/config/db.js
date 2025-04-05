const { Pool } = require("pg");
const config = require("./index");

// Pool gestiona múltiples conexiones de clientes
const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
});

pool.on("connect", () => {
  console.log("Conectado a la base de datos PostgreSQL");
});

pool.on("error", (err, client) => {
  console.error("Error inesperado en cliente inactivo del pool", err);
  process.exit(-1); // Salir si hay un error grave de conexión
});

// Exportamos una función para ejecutar consultas
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // Exportamos el pool por si se necesita directamente
};
