-- Esquema DDL para GymAdminPro (SQLite)
PRAGMA foreign_keys = ON;

-- 1. TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rol TEXT NOT NULL CHECK(rol IN ('ADMINISTRADOR', 'RECEPCIONISTA', 'MIEMBRO')),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_plain TEXT,
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

-- =========================================================================
-- FEATURE 004: RUTINAS SEMANALES, ALERTAS DE COACH Y APP DEL MIEMBRO
-- =========================================================================

-- 9. TABLA: maquinas_ejercicios
CREATE TABLE IF NOT EXISTS maquinas_ejercicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_maquina INTEGER NOT NULL UNIQUE,
    codigo_etiqueta TEXT NOT NULL,
    nombre TEXT NOT NULL,
    grupo_muscular TEXT NOT NULL,
    descripcion_corta TEXT
);

CREATE INDEX IF NOT EXISTS idx_maquinas_numero ON maquinas_ejercicios(numero_maquina);

-- 10. TABLA: rutinas_plantillas
CREATE TABLE IF NOT EXISTS rutinas_plantillas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_by INTEGER,
    activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 11. TABLA: rutinas_dias
CREATE TABLE IF NOT EXISTS rutinas_dias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rutina_id INTEGER NOT NULL,
    dia_semana TEXT NOT NULL CHECK(dia_semana IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO')),
    enfoque_muscular TEXT NOT NULL DEFAULT 'GENERAL',
    orden_dia INTEGER NOT NULL,
    UNIQUE(rutina_id, dia_semana),
    FOREIGN KEY (rutina_id) REFERENCES rutinas_plantillas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rutinas_dias_rutina ON rutinas_dias(rutina_id);

-- 12. TABLA: rutinas_ejercicios
CREATE TABLE IF NOT EXISTS rutinas_ejercicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rutina_dia_id INTEGER NOT NULL,
    maquina_id INTEGER NOT NULL,
    orden_secuencial INTEGER NOT NULL CHECK(orden_secuencial > 0),
    series INTEGER NOT NULL DEFAULT 4 CHECK(series > 0),
    repeticiones TEXT NOT NULL DEFAULT '8-12',
    tiempo_descanso_segundos INTEGER NOT NULL DEFAULT 90 CHECK(tiempo_descanso_segundos >= 0),
    FOREIGN KEY (rutina_dia_id) REFERENCES rutinas_dias(id) ON DELETE CASCADE,
    FOREIGN KEY (maquina_id) REFERENCES maquinas_ejercicios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rutinas_ejercicios_dia ON rutinas_ejercicios(rutina_dia_id, orden_secuencial);

-- 13. TABLA: miembro_rutinas_asignadas
CREATE TABLE IF NOT EXISTS miembro_rutinas_asignadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    rutina_id INTEGER NOT NULL,
    asignado_por INTEGER,
    fecha_asignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rutina_id) REFERENCES rutinas_plantillas(id) ON DELETE CASCADE,
    FOREIGN KEY (asignado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_miembro_rutina_usuario ON miembro_rutinas_asignadas(usuario_id);

-- 14. TABLA: miembro_rutina_ajustes
CREATE TABLE IF NOT EXISTS miembro_rutina_ajustes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    rutina_ejercicio_id INTEGER NOT NULL,
    series_custom INTEGER CHECK(series_custom > 0),
    descanso_custom_segundos INTEGER CHECK(descanso_custom_segundos >= 0),
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, rutina_ejercicio_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rutina_ejercicio_id) REFERENCES rutinas_ejercicios(id) ON DELETE CASCADE
);

-- 15. TABLA: miembro_rutinas_privadas
CREATE TABLE IF NOT EXISTS miembro_rutinas_privadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    contenido_json TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rutinas_privadas_usuario ON miembro_rutinas_privadas(usuario_id);

-- 16. TABLA: alertas_coach
CREATE TABLE IF NOT EXISTS alertas_coach (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    maquina_numero TEXT NOT NULL,
    motivo TEXT DEFAULT 'Asistencia en sala',
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE', 'ATENDIDA', 'CANCELADA')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atendido_por INTEGER,
    atendido_at DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (atendido_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alertas_coach_estado ON alertas_coach(estado, created_at DESC);
