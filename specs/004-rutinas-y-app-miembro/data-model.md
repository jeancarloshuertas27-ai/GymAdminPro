# Data Model: Feature 004 — Rutinas Semanales, Alertas de Coach y App del Miembro

**Branch**: `004-rutinas-y-app-miembro`  
**Database**: SQLite (`server/gymcore.db`)  
**Schema File**: `server/schema.sql`

---

## 1. Nuevas Tablas en SQLite

### 1.1 `maquinas_ejercicios`
Catálogo maestro precargado con las 25 estaciones y máquinas numeradas del gimnasio.

```sql
CREATE TABLE IF NOT EXISTS maquinas_ejercicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_maquina INTEGER NOT NULL UNIQUE,
    codigo_etiqueta TEXT NOT NULL, -- ej: '#08', 'Máquina 8'
    nombre TEXT NOT NULL,          -- ej: 'Press Banca Smith'
    grupo_muscular TEXT NOT NULL,  -- ej: 'Pectoral Mayor'
    descripcion_corta TEXT
);

CREATE INDEX IF NOT EXISTS idx_maquinas_numero ON maquinas_ejercicios(numero_maquina);
```

### 1.2 `rutinas_plantillas`
Plantillas globales de entrenamiento diseñadas por el Administrador.

```sql
CREATE TABLE IF NOT EXISTS rutinas_plantillas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_by INTEGER,
    activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
);
```

### 1.3 `rutinas_dias`
Configuración de cada día (Lunes a Sábado) perteneciente a una plantilla.

```sql
CREATE TABLE IF NOT EXISTS rutinas_dias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rutina_id INTEGER NOT NULL,
    dia_semana TEXT NOT NULL CHECK(dia_semana IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO')),
    enfoque_muscular TEXT NOT NULL DEFAULT 'GENERAL', -- ej: 'PUSH', 'PULL', 'LEGS', 'UPPER', 'REST'
    orden_dia INTEGER NOT NULL, -- 1..6
    UNIQUE(rutina_id, dia_semana),
    FOREIGN KEY (rutina_id) REFERENCES rutinas_plantillas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rutinas_dias_rutina ON rutinas_dias(rutina_id);
```

### 1.4 `rutinas_ejercicios`
Ejercicios ordenados secuencialmente (`1.`, `2.`, `3.`) dentro de un día de rutina.

```sql
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
```

### 1.5 `miembro_rutinas_asignadas`
Relación de la rutina oficial asignada actualmente a cada atleta.

```sql
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
```

> **Sincronización con `membresias`**: Al asignar o modificar una rutina oficial para un socio, el backend también actualiza `membresias.rutina_asignada` con el nombre de la plantilla para mantener coherencia inmediata en el padrón de usuarios y check-in.

### 1.6 `miembro_rutina_ajustes`
Personalización individual del miembro sobre las series y descansos de su rutina oficial asignada (sin mutar la plantilla maestra).

```sql
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
```

### 1.7 `miembro_rutinas_privadas`
Rutinas personales creadas de forma privada por el miembro en `/miembro`. Completamente aisladas del catálogo global de Administrador y Recepción.

```sql
CREATE TABLE IF NOT EXISTS miembro_rutinas_privadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    contenido_json TEXT NOT NULL, -- Estructura de días (LUNES..SABADO) con ejercicios, series, reps, descanso
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rutinas_privadas_usuario ON miembro_rutinas_privadas(usuario_id);
```

### 1.8 `alertas_coach`
Cola de alertas en tiempo real generadas por los miembros desde la sala de máquinas hacia Recepción y Administración.

```sql
CREATE TABLE IF NOT EXISTS alertas_coach (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    maquina_numero TEXT NOT NULL, -- ej: 'Máquina 8', '#08'
    motivo TEXT DEFAULT 'Asistencia en sala',
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE', 'ATENDIDA', 'CANCELADA')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atendido_por INTEGER,
    atendido_at DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (atendido_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alertas_coach_estado ON alertas_coach(estado, created_at DESC);
```

---

## 2. Catálogo Semilla de 25 Máquinas (`maquinas_ejercicios`)

| Nº | Nombre | Grupo Muscular |
|---|---|---|
| 1 | Máquina 1 - Sentadilla Guiada | Cuádriceps |
| 2 | Máquina 2 - Prensa 45° | Cuádriceps / Glúteos |
| 3 | Máquina 3 - Hack Squat | Cuádriceps |
| 4 | Máquina 4 - Extensión de Cuádriceps | Cuádriceps |
| 5 | Máquina 5 - Aductores en Máquina | Aductores |
| 6 | Máquina 6 - Abductores en Máquina | Glúteo Medio |
| 7 | Máquina 7 - Jalón Polea Ancha | Dorsal Ancho |
| 8 | Máquina 8 - Press Banca Smith | Pectoral Mayor |
| 9 | Máquina 9 - Press Inclinado Convergente | Pectoral Superior |
| 10 | Máquina 10 - Press Hombros Máquina | Deltoides Anterior |
| 11 | Máquina 11 - Polea Tríceps | Tríceps Braquial |
| 12 | Máquina 12 - Remo Polea Baja | Densidad Espalda |
| 13 | Máquina 13 - Remo T-Bar Apoyado | Espalda Media |
| 14 | Máquina 14 - Press Mancuernas / Banco | Pectoral / Hombro |
| 15 | Máquina 15 - Pec-Deck (Aperturas) | Aislamiento Pectoral |
| 16 | Máquina 16 - Cruce de Poleas (Cross-Over) | Pectoral Completo |
| 17 | Máquina 17 - Curl Bíceps Predicador | Bíceps Braquial |
| 18 | Máquina 18 - Curl Femoral Tumbado | Isquiosurales |
| 19 | Máquina 19 - Curl Femoral Sentado | Isquiosurales |
| 20 | Máquina 20 - Elevación de Talones (Gemelos) | Pantorrillas |
| 21 | Máquina 21 - Elevaciones Laterales Máquina | Deltoides Lateral |
| 22 | Máquina 22 - Pájaros en Máquina (Posterior) | Deltoides Posterior |
| 23 | Máquina 23 - Abdominales Crunch Máquina | Core / Recto Abdominal |
| 24 | Máquina 24 - Hiperextensiones Lumbares | Zona Lumbar / Glúteo |
| 25 | Máquina 25 - Rack Libre Olímpico | Fuerza Compuesta |

---

## 3. Transiciones de Estado: `alertas_coach`

```
[Miembro presiona "Llamar Coach"]
              │
              ▼
         (PENDIENTE) ──[Miembro presiona "Cancelar solicitud"]──► (CANCELADA)
              │
  [Recepción / Admin presiona
   "Marcar como Atendida"]
              │
              ▼
         (ATENDIDA)
```
