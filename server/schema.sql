-- Esquema DDL para GymAdminPro (SQLite)
PRAGMA foreign_keys = ON;

-- 1. TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rol TEXT NOT NULL CHECK(rol IN ('ADMINISTRADOR', 'RECEPCIONISTA', 'MIEMBRO')),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    dni TEXT NOT NULL UNIQUE CHECK(length(dni) = 8 AND dni GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
    celular TEXT NOT NULL,
    celular_respaldo TEXT,
    domicilio TEXT,
    foto_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_dni ON usuarios(dni);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_apellidos ON usuarios(apellidos COLLATE NOCASE);

-- 2. TABLA: membresias
CREATE TABLE IF NOT EXISTS membresias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    anios INTEGER NOT NULL DEFAULT 0,
    meses INTEGER NOT NULL DEFAULT 0,
    estado TEXT NOT NULL CHECK(estado IN ('ACTIVO', 'POR_VENCER', 'VENCIDO')),
    tipo_pago TEXT NOT NULL CHECK(tipo_pago IN ('EFECTIVO', 'TRANSFERENCIA')),
    comprobante_url TEXT,
    numero_operacion TEXT,
    plan_tag TEXT DEFAULT 'MEMBRESÍA ESTÁNDAR',
    rutina_asignada TEXT DEFAULT 'SIN RUTINA ASIGNADA',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_membresias_usuario ON membresias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_membresias_vencimiento ON membresias(fecha_vencimiento);

-- 3. TABLA: fidelidad
CREATE TABLE IF NOT EXISTS fidelidad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    fecha_inscripcion_original DATE NOT NULL,
    meses_continuos INTEGER NOT NULL DEFAULT 0,
    nivel_actual TEXT NOT NULL CHECK(nivel_actual IN (
        'NOVATO', 'PRINCIPIANTE', 'PROMEDIO', 'EN_PROGRESO', 
        'MUTANDO', 'MAMADO', 'DIOS_GRIEGO', 'ANIMAL'
    )),
    ultimo_reinicio DATE,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fidelidad_usuario ON fidelidad(usuario_id);

-- 4. TABLA: checkins
CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    dni_ingresado TEXT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resultado TEXT NOT NULL CHECK(resultado IN (
        'VERDE_AUTORIZADO', 'NARANJA_AVISO', 'ROJO_DENEGADO', 'MANUAL_FORZADO'
    )),
    operador_id INTEGER,
    motivo TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (operador_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_checkins_timestamp ON checkins(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_dni ON checkins(dni_ingresado);

