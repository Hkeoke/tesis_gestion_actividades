const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Directorio donde se guardarán las imágenes de las noticias
const newsImageDir = path.join(__dirname, "..", "..", "uploads", "news");

// Asegurarse de que el directorio exista
if (!fs.existsSync(newsImageDir)) {
  fs.mkdirSync(newsImageDir, { recursive: true });
}

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, newsImageDir); // Directorio de destino
  },
  filename: function (req, file, cb) {
    // Generar un nombre de archivo único: timestamp + nombre original
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Filtro para aceptar solo imágenes
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Aceptar archivo
  } else {
    cb(new Error("¡Solo se permiten archivos de imagen!"), false); // Rechazar archivo
  }
};

// Crear la instancia de Multer con la configuración
const uploadNewsImage = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de 5MB por imagen
  },
}).single("imagen_noticia"); // Nombre del campo en el formulario ("imagen_noticia")

// Directorio donde se guardarán los documentos de profesores
const professorDocsDir = path.join(
  __dirname,
  "..",
  "..",
  "uploads",
  "professor-documents"
);

// Asegurarse de que el directorio exista
if (!fs.existsSync(professorDocsDir)) {
  fs.mkdirSync(professorDocsDir, { recursive: true });
}

// Configuración de almacenamiento para documentos de profesores
const professorDocsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, professorDocsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Filtro para documentos (PDF, DOC, DOCX, etc.)
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Solo se permiten archivos de documento (PDF, DOC, DOCX)"),
      false
    );
  }
};

// Crear instancia de Multer para documentos de profesores
const uploadProfessorDocs = multer({
  storage: professorDocsStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10MB por documento
  },
});

// Middleware para manejar errores de Multer específicamente
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Errores conocidos de Multer (ej. tamaño de archivo)
    return res.status(400).json({ message: `Error de Multer: ${err.message}` });
  } else if (err) {
    // Otros errores (ej. tipo de archivo no permitido por nuestro filtro)
    return res.status(400).json({ message: err.message });
  }
  // Si no hay error de Multer, continuar
  next();
};

module.exports = {
  uploadNewsImage,
  uploadProfessorDocs,
  handleMulterError,
};
