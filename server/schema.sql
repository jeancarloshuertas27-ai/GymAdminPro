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

-- 5. TABLA: promociones (Feature 002)
CREATE TABLE IF NOT EXISTS promociones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL CHECK(tipo IN ('TARIFA_FIJA', 'PROMOCION_VOLATIL')) DEFAULT 'TARIFA_FIJA',
    nombre TEXT NOT NULL,
    duracion_valor INTEGER NOT NULL CHECK(duracion_valor > 0),
    duracion_unidad TEXT NOT NULL CHECK(duracion_unidad IN ('MESES', 'DIAS')),
    precio REAL NOT NULL CHECK(precio >= 0),
    fecha_limite DATE,
    publico_objetivo TEXT NOT NULL DEFAULT 'TODOS' CHECK(publico_objetivo IN (
        'TODOS', 'NOVATO', 'PRINCIPIANTE', 'PROMEDIO', 'EN_PROGRESO', 
        'MUTANDO', 'MAMADO', 'DIOS_GRIEGO', 'ANIMAL'
    )),
    banner_url TEXT,
    activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promociones_activo ON promociones(activo);
CREATE INDEX IF NOT EXISTS idx_promociones_publico ON promociones(publico_objetivo);

-- 6. TABLA: productos (Feature 002)
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_venta REAL NOT NULL CHECK(precio_venta >= 0),
    precio_costo REAL NOT NULL CHECK(precio_costo >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
    categoria TEXT NOT NULL DEFAULT 'GENERAL',
    imagen_url TEXT,
    activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);

-- 7. TABLA: ventas_productos (Feature 002 & 003)
CREATE TABLE IF NOT EXISTS ventas_productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK(cantidad > 0),
    precio_unitario REAL NOT NULL CHECK(precio_unitario >= 0),
    total REAL NOT NULL CHECK(total >= 0),
    metodo_pago TEXT NOT NULL CHECK(metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA')),
    comprobante_url TEXT,
    operador_id INTEGER,
    operador_nombre_historico TEXT,
    estado TEXT NOT NULL CHECK(estado IN ('PENDIENTE_APROBACION', 'APROBADO', 'RECHAZADO')),
    notas_rechazo TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolved_by INTEGER,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (operador_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas_productos(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_producto ON ventas_productos(producto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_created ON ventas_productos(created_at DESC);

-- 8. TABLA: solicitudes_membresia (Feature 002 & 003)
CREATE TABLE IF NOT EXISTS solicitudes_membresia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    atleta_nombre_historico TEXT,
    atleta_dni_historico TEXT,
    promocion_id INTEGER,
    dias_agregados INTEGER NOT NULL CHECK(dias_agregados > 0),
    monto REAL NOT NULL CHECK(monto >= 0),
    metodo_pago TEXT NOT NULL CHECK(metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA')),
    comprobante_url TEXT,
    operador_id INTEGER NOT NULL,
    estado TEXT NOT NULL CHECK(estado IN ('PENDIENTE_APROBACION', 'APROBADO', 'RECHAZADO')),
    notas_rechazo TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolved_by INTEGER,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (promocion_id) REFERENCES promociones(id) ON DELETE SET NULL,
    FOREIGN KEY (operador_id) REFERENCES usuarios(id),
    FOREIGN KEY (resolved_by) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_membresia(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario ON solicitudes_membresia(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_created ON solicitudes_membresia(created_at DESC);
