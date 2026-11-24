import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
const dbPath = isTestEnv ? ':memory:' : path.resolve(__dirname, '../gymcore.db');
const db = new DatabaseSync(dbPath);

// Habilitar claves foráneas, modo WAL y tiempo de espera para evitar bloqueos
db.exec('PRAGMA foreign_keys = ON;');
if (!isTestEnv) {
  db.exec('PRAGMA journal_mode = WAL;');
}
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

// Migraciones para soporte ON DELETE SET NULL en solicitudes_membresia (T003)
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

    if (isTestEnv) {
      seedTestFixtures();
    }
  } catch (err) {
    console.warn('[DB Seed Maquinas] Aviso:', err.message);
  }
}

function seedTestFixtures() {
  const adminHash = bcrypt.hashSync('Admin2026!', 10);
  const recepHash = bcrypt.hashSync('Recep2026!', 10);
  const memberHash = bcrypt.hashSync('Atleta2026!', 10);

  db.prepare(`
    INSERT INTO usuarios (rol, username, password_hash, password_plain, nombres, apellidos, dni, celular)
    VALUES ('ADMINISTRADOR', '@admin_01', ?, 'Admin2026!', 'Carlos', 'Mendoza', '45829104', '987654321')
  `).run(adminHash);

  db.prepare(`
    INSERT INTO usuarios (rol, username, password_hash, password_plain, nombres, apellidos, dni, celular, celular_respaldo, domicilio)
    VALUES ('RECEPCIONISTA', '@recep_carlos', ?, 'Recep2026!', 'Diego', 'Quispe', '71482930', '987654322', '911222333', 'Av. Arequipa 1230, Lince')
  `).run(recepHash);

  const memberRes = db.prepare(`
    INSERT INTO usuarios (rol, username, password_hash, password_plain, nombres, apellidos, dni, celular)
    VALUES ('MIEMBRO', '@mateo_val', ?, 'Atleta2026!', 'Mateo', 'Valdivia', '72849102', '987654323')
  `).run(memberHash);
  const memberId = Number(memberRes.lastInsertRowid);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const futureDate = new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  db.prepare(`
    INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago, plan_tag, rutina_asignada)
    VALUES (?, ?, ?, 0, 1, 'ACTIVO', 'EFECTIVO', 'MENSUAL TEST', 'SIN RUTINA ASIGNADA')
  `).run(memberId, today, futureDate);

  db.prepare(`
    INSERT INTO fidelidad (usuario_id, fecha_inscripcion_original, meses_continuos, nivel_actual)
    VALUES (?, ?, 1, 'NOVATO')
  `).run(memberId, today);

  db.prepare(`
    INSERT INTO productos (sku, nombre, categoria, precio_venta, precio_costo, stock, activo)
    VALUES ('TEST-SUP-01', 'Proteína Test 1kg', 'Suplementos', 120, 80, 15, 1)
  `).run();

  db.prepare(`
    INSERT INTO productos (sku, nombre, categoria, precio_venta, precio_costo, stock, activo)
    VALUES ('TEST-ZERO-01', 'Agua Test Agotada', 'Bebidas', 5, 2, 0, 1)
  `).run();

  db.prepare(`
    INSERT INTO promociones (tipo, nombre, duracion_valor, duracion_unidad, precio, fecha_limite, publico_objetivo, activo)
    VALUES ('TARIFA_FIJA', 'Plan Mensual Test', 1, 'MESES', 120, NULL, 'TODOS', 1)
  `).run();
}

seedMaquinasAndDefaultRoutine();

export default db;
