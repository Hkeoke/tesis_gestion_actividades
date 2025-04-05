-- Script para crear/actualizar las tablas de actividades docentes
-- Ejecutar este script en la base de datos gestion_academica

-- Tabla de Categorías Docentes/Administrativas (si no existe)
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL, -- 'Auxiliar', 'Titular', 'Asistente', 'Recién Graduado'
    horas_norma_semanal DECIMAL(5, 2) DEFAULT 40.00 -- Norma de horas semanales
);

-- Insertar categorías si no existen
INSERT INTO categorias (nombre, horas_norma_semanal)
VALUES 
    ('Titular', 44.00),
    ('Auxiliar', 40.00),
    ('Asistente', 40.00),
    ('Recién Graduado', 36.00),
    ('Instructor', 36.00)
ON CONFLICT (nombre) DO UPDATE
SET horas_norma_semanal = EXCLUDED.horas_norma_semanal;

-- Tabla de Tipos de Actividad Docente
CREATE TABLE IF NOT EXISTS tipos_actividad (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) UNIQUE NOT NULL,
    descripcion TEXT,
    horas_estandar VARCHAR(150), -- Horas base asignadas (puede variar)
    horas_auxiliar_titular VARCHAR(250), -- Horas para profesores auxiliares y titulares
    horas_asistente_instructor VARCHAR(250), -- Horas para asistentes, instructores y recién graduados
    requiere_grupo BOOLEAN DEFAULT FALSE, -- Si necesita especificar un grupo (para clases)
    requiere_estudiantes BOOLEAN DEFAULT FALSE, -- Si necesita especificar la cantidad de estudiantes
    notas TEXT -- Notas adicionales
);


-- Tabla de Registro de Actividades del Plan de Trabajo
CREATE TABLE IF NOT EXISTS actividades_plan (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_actividad_id INTEGER NOT NULL REFERENCES tipos_actividad(id),
    grupo_clase VARCHAR(150), -- Opcional, solo si requiere_grupo es TRUE
    fecha DATE NOT NULL,
    horas_dedicadas DECIMAL(5, 2),
    cantidad_estudiantes INTEGER, -- Número de estudiantes (para tutorías, tribunales, etc.)
    cantidad_grupos INTEGER, -- Cantidad de grupos (para docencia directa)
    horas_docencia_directa DECIMAL(5, 2), -- Horas de docencia directa (base para cálculos)
    descripcion_adicional TEXT, -- Detalles extra sobre la actividad realizada
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_horas_positivas CHECK (horas_dedicadas > 0)
);

--- Insertar tipos de actividad
INSERT INTO tipos_actividad (
  nombre, 
  descripcion, 
  horas_estandar,
  horas_auxiliar_titular, 
  horas_asistente_instructor, 
  requiere_grupo, 
  requiere_estudiantes,
  notas
) VALUES
-- Docencia directa
('Docencia Directa de Pregrado y Posgrado', 
 'Horas de docencia directa de acuerdo al tipo de actividad del plan de estudios por cantidad de grupos asignados', 
 NULL, 
 NULL, 
 NULL, 
 TRUE, 
 FALSE,
 'Las horas se calculan según la cantidad de grupos y horas asignadas'),

-- Preparación de asignaturas
('Preparación de Asignaturas Presenciales', 
 'Preparación de asignaturas de pregrado y posgrado en modalidad presencial', 
 NULL, 
 '2 horas por cada hora de docencia directa presencial', 
 '4 horas por cada hora de docencia directa presencial', 
 FALSE, 
 FALSE,
 'Incluye preparación de exámenes'),

('Preparación de Asignaturas Virtuales', 
 'Preparación de asignaturas en entornos virtuales de enseñanza aprendizaje', 
 NULL, 
 '6 horas por cada actividad en entornos virtuales', 
 '12 horas por cada actividad en entornos virtuales', 
 FALSE, 
 FALSE,
 'Incluye preparación de actividades en entornos virtuales'),

-- Calificación de exámenes
('Calificación de Exámenes', 
 'Calificación de exámenes escritos', 
 '1 hora por estudiante', 
 NULL, 
 NULL, 
 FALSE, 
 TRUE,
 'Solo aplicable en los meses donde se realizan actividades evaluativas escritas'),

-- Trabajo metodológico
('Trabajo Metodológico', 
 'Trabajo metodológico individual y colectivo de pregrado y posgrado', 
 'Hasta 12 horas mensuales por el número de asignaturas impartidas', 
 NULL, 
 NULL, 
 FALSE, 
 FALSE,
 NULL),

-- Tutorías
('Tutoría de Práctica Preprofesional', 
 'Tutoría de práctica preprofesional, trabajos de curso y proyectos de curso', 
 NULL, 
 '4 horas mensuales por estudiante tutorado', 
 '8 horas mensuales por estudiante tutorado', 
 FALSE, 
 TRUE,
 NULL),

('Tutoría de Trabajos de Diploma', 
 'Tutoría para trabajos de diploma', 
 NULL, 
 '8 horas mensuales por estudiante tutorado', 
 '16 horas mensuales por estudiante tutorado', 
 FALSE, 
 TRUE,
 NULL),

-- Oponencias y tribunales
('Oponencia de Trabajos de Diploma', 
 'Ser oponente de trabajos de diploma', 
 NULL, 
 '4 horas por tesis', 
 '8 horas por tesis', 
 FALSE, 
 TRUE,
 'Solo aplicable en el mes que se realiza la actividad'),

('Tribunal de Trabajos de Diploma', 
 'Participar como miembro de tribunales para trabajos de diploma', 
 NULL, 
 '1 hora por tesis', 
 '1 hora por tesis', 
 FALSE, 
 TRUE,
 'Solo aplicable en el mes que se realiza la actividad'),

-- Otras formas de culminación
('Tutoría de Otras Formas de Culminación', 
 'Tutoría para otras formas de culminación de estudios', 
 NULL, 
 '4 horas mensuales por estudiante tutorado', 
 '8 horas mensuales por estudiante tutorado', 
 FALSE, 
 TRUE,
 NULL),

-- Posgrado - Maestrías y especialidades
('Tutoría de Tesis de Maestría/Especialidad', 
 'Tutoría para tesis de maestría o especialidad', 
 '6 horas mensuales por estudiante tutorado', 
 NULL, 
 NULL, 
 FALSE, 
 TRUE,
 'Incluye hasta 6 meses después de terminado el período lectivo'),

('Oponencia de Tesis de Maestría/Especialidad', 
 'Ser oponente de tesis de maestría o especialidad', 
 '6 horas por tesis', 
 NULL, 
 NULL, 
 FALSE, 
 TRUE,
 'Solo aplicable en el mes que se realiza la actividad'),

('Tribunal de Tesis de Maestría/Especialidad', 
 'Participar como miembro de tribunal para tesis de maestría o especialidad', 
 '2 horas por tesis', 
 NULL, 
 NULL, 
 FALSE, 
 TRUE,
 'Solo aplicable en el mes que se realiza la actividad'),

-- Doctorado
('Tutoría de Tesis de Doctorado', 
 'Tutoría para tesis de doctorado', 
 '8 horas mensuales por estudiante tutorado', 
 NULL, 
 NULL, 
 FALSE, 
 TRUE,
 'Aplicable en el marco de los cuatro años de formación'),

('Oponencia de Tesis de Doctorado', 
 'Ser oponente en predefensa de tesis de doctorado', 
 '24 horas por tesis', 
 NULL, 
 NULL, 
 FALSE, 
 TRUE,
 'Solo aplicable en el mes que se realiza la actividad'),

('Tribunal de Tesis de Doctorado', 
 'Participar como miembro de tribunal para tesis de doctorado en predefensa o defensa', 
 '4 horas por tesis', 
 NULL, 
 NULL, 
 FALSE, 
 TRUE,
 'Solo aplicable en el mes que se realiza la actividad'),

-- Roles docentes
('Presidente Comisión Nacional de Carrera', 
 'Desempeño como Presidente de la Comisión Nacional de Carrera', 
 '8 horas mensuales', 
 NULL, 
 NULL, 
 FALSE, 
 FALSE,
 NULL),

('Coordinador de Programas', 
 'Coordinación de programas de doctorado, maestría y especialidad', 
 '8 horas mensuales', 
 NULL, 
 NULL, 
 FALSE, 
 FALSE,
 NULL),

('Jefe de Colectivo de Carrera', 
 'Desempeño como Jefe de Colectivo de carrera', 
 NULL, 
 '8 horas mensuales', 
 '16 horas mensuales', 
 FALSE, 
 FALSE,
 NULL),

('Jefe de Disciplina', 
 'Desempeño como Jefe de Disciplina', 
 NULL, 
 '8 horas mensuales', 
 '16 horas mensuales', 
 FALSE, 
 FALSE,
 NULL),

('Jefe de Asignatura', 
 'Desempeño como Jefe de Asignatura', 
 NULL, 
 '8 horas mensuales', 
 '16 horas mensuales', 
 FALSE, 
 FALSE,
 NULL),

('Profesor Guía', 
 'Desempeño como Profesor Guía', 
 NULL, 
 '8 horas mensuales', 
 '16 horas mensuales', 
 FALSE, 
 FALSE,
 NULL)
ON CONFLICT (nombre) DO UPDATE
SET 
  descripcion = EXCLUDED.descripcion,
  horas_estandar = EXCLUDED.horas_estandar,
  horas_auxiliar_titular = EXCLUDED.horas_auxiliar_titular,
  horas_asistente_instructor = EXCLUDED.horas_asistente_instructor,
  requiere_grupo = EXCLUDED.requiere_grupo,
  requiere_estudiantes = EXCLUDED.requiere_estudiantes,
  notas = EXCLUDED.notas;
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL -- 'Administrador', 'Profesor'
);
CREATE TABLE subcategorias_admin (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL -- 'Jefe de Departamento', 'Segundo Jefe de Departamento'
);
-- Tabla de Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100),
    apellidos VARCHAR(100),
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    categoria_id INTEGER REFERENCES categorias(id), -- Puede ser NULL inicialmente o para ciertos roles
    subcategoria_admin_id INTEGER REFERENCES subcategorias_admin(id), -- Solo para administradores
    aprobado BOOLEAN DEFAULT FALSE,
    cotizo BOOLEAN DEFAULT FALSE, -- Para el flujo de aprobación
    miembro_sociedad BOOLEAN DEFAULT FALSE, -- Para el flujo de aprobación
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO roles (nombre) VALUES ('Administrador'), ('Profesor');
INSERT INTO subcategorias_admin (nombre) VALUES ('Jefe de Departamento'), ('Segundo Jefe de Departamento');
CREATE TABLE solicitudes_cambio_categoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_solicitada_id INTEGER NOT NULL REFERENCES categorias(id),
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'Pendiente', -- 'Pendiente', 'Aprobada', 'Rechazada'
    observaciones_admin TEXT, -- Para comentarios del administrador al revisar
    fecha_revision TIMESTAMP WITH TIME ZONE,
    revisado_por_admin_id INTEGER REFERENCES usuarios(id), -- Quién la revisó
    anexos JSON, -- Para adjuntar documentos,fotos,direcciones url, etc.
    CONSTRAINT chk_estado_solicitud CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada'))
);
CREATE TABLE requisiros_cambio_categoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_solicitada_id INTEGER NOT NULL REFERENCES categorias(id),
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'Pendiente', -- 'Pendiente', 'Aprobada', 'Rechazada'
);

CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    publico BOOLEAN DEFAULT TRUE,
    fecha_evento TIMESTAMP WITH TIME ZONE, -- Fecha y hora del evento
    ubicacion VARCHAR(255), -- Lugar del evento
    creado_por_admin_id INTEGER NOT NULL REFERENCES usuarios(id), -- Admin que lo creó
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE convocatorias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    publico BOOLEAN DEFAULT TRUE,
    creado_por_admin_id INTEGER NOT NULL REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE noticias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    ispublica BOOLEAN DEFAULT TRUE, -- Para permitir borradores si se desea en el futuro
    contenido TEXT NOT NULL,
    imagen_base64 TEXT, -- URL relativa a la imagen subida (ej. /uploads/news/imagen-123.jpg)
    publicada BOOLEAN DEFAULT TRUE, -- Para permitir borradores si se desea en el futuro
    creado_por_admin_id INTEGER NOT NULL REFERENCES usuarios(id), -- Admin que la creó
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);