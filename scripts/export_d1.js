import fs from 'node:fs';
import path from 'node:path';
import db from '../server/db.js';

const schemaPath = path.resolve('server/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

// Orden padre -> hijo para inserción
const insertTables = [
  'maquinas_ejercicios',
  'usuarios',
  'membresias',
  'fidelidad',
  'promociones',
  'productos',
  'rutinas_plantillas',
  'rutinas_dias',
  'rutinas_ejercicios',
  'miembro_rutinas_asignadas',
  'miembro_rutina_ajustes',
  'miembro_rutinas_privadas',
  'solicitudes_membresia',
  'ventas_productos',
  'checkins',
  'alertas_coach',
];

// Orden hijo -> padre para limpieza sin violar claves foráneas en D1/SQLite
const deleteTables = [...insertTables].reverse();

let sql = schema + '\n\n-- LIMPIEZA TOTAL DE DATOS ANTERIORES (ORDEN HIJO -> PADRE)\n';
for (const t of deleteTables) {
  sql += `DELETE FROM ${t};\n`;
}

sql += '\n-- DATOS INICIALES SEED LIMPIOS DE PRODUCCIÓN\n';
for (const t of insertTables) {
  const rows = db.prepare(`SELECT * FROM ${t}`).all();
  if (rows.length === 0) continue;
  sql += `\n-- Tabla: ${t}\n`;
  for (const row of rows) {
    const cols = Object.keys(row);
    const vals = cols.map((c) => {
      const v = row[c];
      if (v === null || v === undefined) return 'NULL';
      if (typeof v === 'number') return v;
      return "'" + String(v).replace(/'/g, "''") + "'";
    });
    sql += `INSERT OR REPLACE INTO ${t} (${cols.join(', ')}) VALUES (${vals.join(', ')});\n`;
  }
}

const outputPath = path.resolve('server/d1_seed.sql');
fs.writeFileSync(outputPath, sql, 'utf-8');
console.log(`✅ Archivo d1_seed.sql generado con éxito en ${outputPath} (${sql.length} bytes).`);
