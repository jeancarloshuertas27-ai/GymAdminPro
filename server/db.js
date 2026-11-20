import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../gymcore.db');
const db = new DatabaseSync(dbPath);

// Habilitar claves foráneas, modo WAL y tiempo de espera para evitar bloqueos
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 5000;');

// Inicializar esquema DDL
const schemaPath = path.resolve(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
}

// Migraciones automáticas idempotentes para Feature 003
function ensureColumn(table, column, definition) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!cols.some(c => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  } catch (e) {
    console.warn(`[DB Migration] Aviso en ${table}.${column}:`, e.message);
  }
}

ensureColumn('solicitudes_membresia', 'atleta_nombre_historico', 'TEXT');
ensureColumn('solicitudes_membresia', 'atleta_dni_historico', 'TEXT');
ensureColumn('ventas_productos', 'operador_nombre_historico', 'TEXT');
ensureColumn('usuarios', 'password_plain', 'TEXT');

// Inicializar contraseñas planas para soporte del administrador
try {
  db.prepare("UPDATE usuarios SET password_plain = 'Admin2026!' WHERE username = '@admin_01' AND password_plain IS NULL").run();
  db.prepare("UPDATE usuarios SET password_plain = 'Recep2026!' WHERE (username = '@recep_carlos' OR username = '@recepcion_01') AND password_plain IS NULL").run();
  db.prepare("UPDATE usuarios SET password_plain = 'Atleta2026!' WHERE username = '@mateo_val' AND password_plain IS NULL").run();
  db.prepare("UPDATE usuarios SET password_plain = 'RnzAlpha99!' WHERE username = '@renzo.a' AND password_plain IS NULL").run();
  db.prepare("UPDATE usuarios SET password_plain = 'PowerFit2024#' WHERE username = '@carla_fit' AND password_plain IS NULL").run();
  db.prepare("UPDATE usuarios SET password_plain = 'AndresPass_23' WHERE username = '@andres_m' AND password_plain IS NULL").run();
  db.prepare("UPDATE usuarios SET password_plain = 'Atleta2026!' WHERE password_plain IS NULL AND rol = 'MIEMBRO'").run();
} catch (e) {
  // Ignorar si falla actualización inicial
}

// Migración para soporte ON DELETE SET NULL en solicitudes_membresia (T003)
function migrateSolicitudesMembresia() {
  try {
    const row = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'solicitudes_membresia'").get();
    if (row && row.sql.includes('ON DELETE CASCADE')) {
      db.exec(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE solicitudes_membresia_new (
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

        INSERT INTO solicitudes_membresia_new (
          id, usuario_id, atleta_nombre_historico, atleta_dni_historico, promocion_id,
          dias_agregados, monto, metodo_pago, comprobante_url, operador_id,
          estado, notas_rechazo, created_at, resolved_at, resolved_by
        )
        SELECT 
          id, usuario_id, atleta_nombre_historico, atleta_dni_historico, promocion_id,
          dias_agregados, monto, metodo_pago, comprobante_url, operador_id,
          estado, notas_rechazo, created_at, resolved_at, resolved_by
        FROM solicitudes_membresia;

        DROP TABLE solicitudes_membresia;
        ALTER TABLE solicitudes_membresia_new RENAME TO solicitudes_membresia;

        CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_membresia(estado);
        CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario ON solicitudes_membresia(usuario_id);
        CREATE INDEX IF NOT EXISTS idx_solicitudes_created ON solicitudes_membresia(created_at DESC);
        PRAGMA foreign_keys = ON;
      `);
      console.log('[DB Migration] solicitudes_membresia migrada a ON DELETE SET NULL exitosamente');
    }
  } catch (err) {
    console.error('[DB Migration Error]:', err.message);
  }
}

migrateSolicitudesMembresia();

// Semilla idempotente de 25 máquinas y plantillas iniciales de rutina (Feature 004 - T002)
function seedMaquinasAndDefaultRoutine() {
  try {
    const maquinas = [
      [1, '#01', 'Máquina 1 - Sentadilla Guiada', 'Cuádriceps', 'Control vertical guiado'],
      [2, '#02', 'Máquina 2 - Prensa 45°', 'Cuádriceps / Glúteos', 'Carga pesada piernas'],
      [3, '#03', 'Máquina 3 - Hack Squat', 'Cuádriceps', 'Enfoque vasto lateral'],
      [4, '#04', 'Máquina 4 - Extensión de Cuádriceps', 'Cuádriceps', 'Aislamiento anterior'],
      [5, '#05', 'Máquina 5 - Aductores en Máquina', 'Aductores', 'Musculatura interna'],
      [6, '#06', 'Máquina 6 - Abductores en Máquina', 'Glúteo Medio', 'Estabilización de cadera'],
      [7, '#07', 'Máquina 7 - Jalón Polea Ancha', 'Dorsal Ancho', 'Amplitud de espalda'],
      [8, '#08', 'Máquina 8 - Press Banca Smith', 'Pectoral Mayor', 'Empuje plano guiado'],
      [9, '#09', 'Máquina 9 - Press Inclinado Convergente', 'Pectoral Superior', 'Haz clavicular'],
      [10, '#10', 'Máquina 10 - Press Hombros Máquina', 'Deltoides Anterior', 'Empuje vertical seguro'],
      [11, '#11', 'Máquina 11 - Polea Tríceps', 'Tríceps Braquial', 'Extensión en polea alta'],
      [12, '#12', 'Máquina 12 - Remo Polea Baja', 'Densidad Espalda', 'Tracción horizontal'],
      [13, '#13', 'Máquina 13 - Remo T-Bar Apoyado', 'Espalda Media', 'Romboides y trapecio'],
      [14, '#14', 'Máquina 14 - Press Mancuernas / Banco', 'Pectoral / Hombro', 'Rango libre convergente'],
      [15, '#15', 'Máquina 15 - Pec-Deck (Aperturas)', 'Aislamiento Pectoral', 'Contracción pico pectoral'],
      [16, '#16', 'Máquina 16 - Cruce de Poleas (Cross-Over)', 'Pectoral Completo', 'Tensión continua cables'],
      [17, '#17', 'Máquina 17 - Curl Bíceps Predicador', 'Bíceps Braquial', 'Aislamiento brazo'],
      [18, '#18', 'Máquina 18 - Curl Femoral Tumbado', 'Isquiosurales', 'Cadena posterior pierna'],
      [19, '#19', 'Máquina 19 - Curl Femoral Sentado', 'Isquiosurales', 'Flexión de rodilla'],
      [20, '#20', 'Máquina 20 - Elevación de Talones (Gemelos)', 'Pantorrillas', 'Gastrocnemio y sóleo'],
      [21, '#21', 'Máquina 21 - Elevaciones Laterales Máquina', 'Deltoides Lateral', 'Amplitud de hombros'],
      [22, '#22', 'Máquina 22 - Pájaros en Máquina (Posterior)', 'Deltoides Posterior', 'Cabeza posterior'],
      [23, '#23', 'Máquina 23 - Abdominales Crunch Máquina', 'Core / Recto Abdominal', 'Flexión de tronco con carga'],
      [24, '#24', 'Máquina 24 - Hiperextensiones Lumbares', 'Zona Lumbar / Glúteo', 'Erectores espinales'],
      [25, '#25', 'Máquina 25 - Rack Libre Olímpico', 'Fuerza Compuesta', 'Sentadilla / Peso muerto'],
    ];

    const countRow = db.prepare('SELECT COUNT(*) AS total FROM maquinas_ejercicios').get();
    if (countRow.total < 25) {
      const insertMaq = db.prepare(`
        INSERT OR IGNORE INTO maquinas_ejercicios (numero_maquina, codigo_etiqueta, nombre, grupo_muscular, descripcion_corta)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const m of maquinas) {
        insertMaq.run(...m);
      }
    }

    const plantillasCount = db.prepare('SELECT COUNT(*) AS total FROM rutinas_plantillas').get();
    if (plantillasCount.total === 0) {
      const admin = db.prepare("SELECT id FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1").get();
      const adminId = admin ? admin.id : null;

      // Plantilla 1
      const p1 = db.prepare(`
        INSERT INTO rutinas_plantillas (nombre, descripcion, created_by, activo)
        VALUES ('Protocolo Hipertrofia 5 Días', 'División Push / Pull / Legs / Upper / Core enfocada en masa muscular', ?, 1)
      `).run(adminId);
      const r1Id = Number(p1.lastInsertRowid);

      const getMaqId = (num) => {
        const r = db.prepare('SELECT id FROM maquinas_ejercicios WHERE numero_maquina = ?').get(num);
        return r ? r.id : null;
      };

      const dias1 = [
        { dia: 'LUNES', enfoque: 'PUSH', orden: 1, exs: [[8, 4, '8-12', 90], [15, 4, '10-12', 60], [11, 3, '12-15', 60], [21, 4, '12-15', 60]] },
        { dia: 'MARTES', enfoque: 'PULL', orden: 2, exs: [[7, 4, '8-12', 90], [12, 4, '10-12', 90], [17, 3, '10-12', 60]] },
        { dia: 'MIERCOLES', enfoque: 'LEGS', orden: 3, exs: [[2, 4, '8-12', 120], [4, 4, '12-15', 60], [18, 4, '10-12', 90], [20, 4, '15-20', 60]] },
        { dia: 'JUEVES', enfoque: 'REST', orden: 4, exs: [] },
        { dia: 'VIERNES', enfoque: 'UPPER', orden: 5, exs: [[9, 4, '8-12', 90], [13, 4, '8-12', 90], [10, 3, '10-12', 90]] },
        { dia: 'SABADO', enfoque: 'CORE', orden: 6, exs: [[23, 4, '15-20', 60], [24, 3, '12-15', 60]] },
      ];

      const insDia = db.prepare('INSERT INTO rutinas_dias (rutina_id, dia_semana, enfoque_muscular, orden_dia) VALUES (?, ?, ?, ?)');
      const insEx = db.prepare('INSERT INTO rutinas_ejercicios (rutina_dia_id, maquina_id, orden_secuencial, series, repeticiones, tiempo_descanso_segundos) VALUES (?, ?, ?, ?, ?, ?)');

      for (const d of dias1) {
        const dr = insDia.run(r1Id, d.dia, d.enfoque, d.orden);
        const diaId = Number(dr.lastInsertRowid);
        d.exs.forEach(([numMaq, series, reps, rest], idx) => {
          const mId = getMaqId(numMaq);
          if (mId) insEx.run(diaId, mId, idx + 1, series, reps, rest);
        });
      }

      // Plantilla 2
      const p2 = db.prepare(`
        INSERT INTO rutinas_plantillas (nombre, descripcion, created_by, activo)
        VALUES ('Fuerza Bruta 4 Días', 'Enfoque compuesto de fuerza e hipertrofia miofibrilar', ?, 1)
      `).run(adminId);
      const r2Id = Number(p2.lastInsertRowid);

      const dias2 = [
        { dia: 'LUNES', enfoque: 'TORSO A', orden: 1, exs: [[8, 5, '6-8', 120], [12, 4, '6-8', 120], [10, 4, '8-12', 90]] },
        { dia: 'MARTES', enfoque: 'PIERNA A', orden: 2, exs: [[25, 5, '6-8', 120], [18, 4, '8-12', 90], [20, 4, '12-15', 60]] },
        { dia: 'MIERCOLES', enfoque: 'REST', orden: 3, exs: [] },
        { dia: 'JUEVES', enfoque: 'TORSO B', orden: 4, exs: [[14, 4, '8-12', 90], [7, 4, '8-12', 90], [11, 3, '10-12', 60], [17, 3, '10-12', 60]] },
        { dia: 'VIERNES', enfoque: 'PIERNA B', orden: 5, exs: [[2, 4, '8-12', 120], [3, 4, '8-12', 90], [19, 4, '10-12', 90]] },
        { dia: 'SABADO', enfoque: 'REST', orden: 6, exs: [] },
      ];

      for (const d of dias2) {
        const dr = insDia.run(r2Id, d.dia, d.enfoque, d.orden);
        const diaId = Number(dr.lastInsertRowid);
        d.exs.forEach(([numMaq, series, reps, rest], idx) => {
          const mId = getMaqId(numMaq);
          if (mId) insEx.run(diaId, mId, idx + 1, series, reps, rest);
        });
      }

      // Asignar la primera rutina al atleta demo (@mateo_val o primer MIEMBRO) si no tiene asignación
      const mateo = db.prepare("SELECT id FROM usuarios WHERE rol = 'MIEMBRO' ORDER BY id ASC LIMIT 1").get();
      if (mateo) {
        db.prepare(`
          INSERT OR IGNORE INTO miembro_rutinas_asignadas (usuario_id, rutina_id, asignado_por)
          VALUES (?, ?, ?)
        `).run(mateo.id, r1Id, adminId);
        db.prepare(`
          UPDATE membresias SET rutina_asignada = 'Protocolo Hipertrofia 5 Días'
          WHERE usuario_id = ? AND (rutina_asignada IS NULL OR rutina_asignada = 'SIN RUTINA ASIGNADA')
        `).run(mateo.id);
      }
    }
  } catch (err) {
    console.warn('[DB Seed F004] Aviso:', err.message);
  }
}

seedMaquinasAndDefaultRoutine();

export default db;
