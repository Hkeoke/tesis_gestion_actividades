const app = require("./src/app");
const config = require("./src/config");
const db = require("./src/config/db"); // Importar db para probar conexión inicial

const startServer = async () => {
  try {
    // Probar conexión a la base de datos al iniciar
    await db.query("SELECT NOW()"); // Una consulta simple para verificar la conexión
    console.log("Conexión a la base de datos verificada.");

    app.listen(config.port, () => {
      console.log(`Servidor escuchando en http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1); // Salir si no se puede conectar a la BD
  }
};

startServer();
