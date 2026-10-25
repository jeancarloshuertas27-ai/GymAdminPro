# Data Model: Módulo 001 - Usuarios, Roles, Fidelidad y Control de Acceso

**Feature**: `001-usuarios-y-acceso`  
**Database**: SQLite 3 (`better-sqlite3`)  
**Status**: Ready  

---

## 1. Esquema Relacional (DDL SQLite)

```sql
-- Habilitar integridad referencial en SQLite
PRAGMA foreign_keys = ON;

-- 1. TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rol TEXT NOT NULL CHECK(rol IN ('ADMINISTRADOR', 'RECEPCIONISTA', 'MIEMBRO')),
    username TEXT NOT NULL UNIQUE,          -- Ejemplo: '@atleta_94' o '@carlos_m'
    password_hash TEXT NOT NULL,           -- Hash seguro (bcryptjs)
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    dni TEXT NOT NULL UNIQUE CHECK(length(dni) = 8 AND dni GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
    celular TEXT NOT NULL,                 -- Ejemplo: '+51 987 654 321'
    celular_respaldo TEXT,                 -- Requerido para RECEPCIONISTA
    domicilio TEXT,                        -- Requerido para RECEPCIONISTA
    foto_url TEXT,                         -- Ruta relativa: 'uploads/photos/xyz.jpg'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices de consulta rápida
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
    comprobante_url TEXT,                  -- Ruta relativa del voucher: 'uploads/vouchers/abc.png'
    numero_operacion TEXT,                 -- Código de operación bancaria si fue transferencia
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
    ultimo_reinicio DATE,                  -- Fecha de penalización a NOVATO si hubo impago >14d
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fidelidad_usuario ON fidelidad(usuario_id);

-- 4. TABLA: checkins (Log de auditoría y torniquete)
CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,                   -- NULL si el DNI no existe en el padrón
    dni_ingresado TEXT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resultado TEXT NOT NULL CHECK(resultado IN (
        'VERDE_AUTORIZADO', 'NARANJA_AVISO', 'ROJO_DENEGADO', 'MANUAL_FORZADO'
    )),
    operador_id INTEGER,                  -- Usuario (staff) que autorizó o recibió el checkin
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (operador_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_checkins_timestamp ON checkins(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_dni ON checkins(dni_ingresado);
```

---

## 2. Reglas de Negocio y Transiciones de Estado

### A. Semáforo de Acceso (Check-In)
Dado el `DNI` digitado y consultando la membresía vigente:
1. **Días restantes** = `fecha_vencimiento - fecha_actual`:
   - Si `dias_restantes > 10`: **VERDE_AUTORIZADO** (Paso concedido).
   - Si `1 <= dias_restantes <= 10`: **NARANJA_AVISO** (Paso concedido automáticamente con advertencia visual de cobro/recordatorio).
   - Si `dias_restantes <= 0` o usuario no encontrado: **ROJO_DENEGADO** (Paso bloqueado).
2. **Forzar Paso / Pulso Manual**: Registra el evento con estado `MANUAL_FORZADO` asociando el `operador_id` activo en turno.

### B. Escalafón de Fidelidad Táctica
Calculado a partir de los meses de permanencia continua ininterrumpida:
- `<= 1 mes`: **NOVATO** (Nivel 01)
- `> 1 y <= 3 meses`: **PRINCIPIANTE** (Nivel 02)
- `> 3 y <= 5 meses`: **PROMEDIO** (Nivel 03)
- `> 5 y <= 8 meses`: **EN PROGRESO** (Nivel 04)
- `> 8 y <= 12 meses`: **MUTANDO** (Nivel 05)
- `> 1 y <= 2 años (12 a 24 meses)`: **MAMADO/A** (Nivel 06)
- `> 2 y <= 4 años (24 a 48 meses)`: **DIOS/A GRIEGO/A** (Nivel 07)
- `> 4 años (> 48 meses)`: **ANIMAL** (Nivel APEX)

**Regla de Penalización por Impago**:
- Si la diferencia entre `fecha_actual` y `fecha_vencimiento` excede los **14 días corridos** (2 semanas) sin renovación de pago, los meses continuos se reinician a `0` y el nivel pasa forzosamente a **NOVATO**.

### C. Regla de Purga y Eliminación de Usuario
- **Condición**: Un miembro solo puede eliminarse si han transcurrido **más de 30 días naturales** desde el vencimiento de su membresía (`dias_vencido > 30`).
- **Permisos**: Exclusivo para el rol `ADMINISTRADOR`.
- **Acción**: Borrado físico definitivo (`DELETE FROM usuarios WHERE id = ?`), activando la eliminación en cascada de sus membresías y registros asociados.

