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

export default db;
