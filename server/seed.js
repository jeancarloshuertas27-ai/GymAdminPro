import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import db from './db.js';

function getPeruDateStr(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

function addMonthsIso(dateStr, monthsToAdd) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + monthsToAdd);
  return d.toISOString().split('T')[0];
}

function runSeed() {
  console.log('=== GymAdminPro: Reiniciando base de datos en estado limpio de PRODUCCIÓN ===');

  // 1. Limpieza completa de tablas operativas y catálogos de prueba
  db.exec('PRAGMA foreign_keys = OFF;');
  const tablesToClear = [
    'alertas_coach',
    'miembro_rutina_ajustes',
    'miembro_rutinas_privadas',
    'miembro_rutinas_asignadas',
    'rutinas_ejercicios',
    'rutinas_dias',
    'rutinas_plantillas',
    'ventas_productos',
    'solicitudes_membresia',
    'checkins',
    'membresias',
    'fidelidad',
    'productos',
    'promociones',
    'usuarios',
  ];
  for (const tbl of tablesToClear) {
    db.exec(`DELETE FROM ${tbl};`);
  }
  db.exec('DELETE FROM sqlite_sequence;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Limpiar archivos de uploads de prueba si existieran (preservando .gitkeep)
  for (const sub of ['uploads/vouchers', 'uploads/photos', 'uploads/productos', 'uploads/promociones']) {
    const dirPath = path.resolve(process.cwd(), sub);
    if (fs.existsSync(dirPath)) {
      for (const file of fs.readdirSync(dirPath)) {
        if (file !== '.gitkeep') {
          try {
            fs.unlinkSync(path.join(dirPath, file));
          } catch {
            // Ignorar si está en uso
          }
        }
      }
    }
  }

  // 2. Asegurar el catálogo oficial de 25 máquinas físicas
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

  const insertMaq = db.prepare(`
    INSERT OR IGNORE INTO maquinas_ejercicios (numero_maquina, codigo_etiqueta, nombre, grupo_muscular, descripcion_corta)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const m of maquinas) {
    insertMaq.run(...m);
  }

  // 3. Insertar ÚNICAMENTE los 6 usuarios reales de producción
  const adminHash = bcrypt.hashSync('Admin2026!', 10);
  const recepHash = bcrypt.hashSync('Recep2026!', 10);
  const memberHash = bcrypt.hashSync('Atleta2026!', 10);

  const insertUser = db.prepare(`
    INSERT INTO usuarios (rol, username, password_hash, password_plain, nombres, apellidos, dni, celular, celular_respaldo, domicilio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 2 Administradores
  insertUser.run('ADMINISTRADOR', '@cmendoza', adminHash, 'Admin2026!', 'Carlos', 'Mendoza', '45829104', '987654321', null, null);
  insertUser.run('ADMINISTRADOR', '@preyes', adminHash, 'Admin2026!', 'Patricia', 'Reyes', '46910283', '987654322', null, null);

  // 2 Recepcionistas (con celular de respaldo y domicilio)
  insertUser.run('RECEPCIONISTA', '@dquispe', recepHash, 'Recep2026!', 'Diego', 'Quispe', '71482930', '987112233', '911223344', 'Av. Arequipa 1240, Lince, Lima');
  insertUser.run('RECEPCIONISTA', '@avega', recepHash, 'Recep2026!', 'Andrea', 'Vega', '72938415', '987223344', '912334455', 'Jr. de la Unión 485, Cercado de Lima');

  // 2 Miembros con membresía activa y nivel inicial NOVATO
  const m1 = insertUser.run('MIEMBRO', '@mvaldivia', memberHash, 'Atleta2026!', 'Mateo', 'Valdivia', '74829103', '991122334', null, null);
  const m2 = insertUser.run('MIEMBRO', '@vtorres', memberHash, 'Atleta2026!', 'Valentina', 'Torres', '75910428', '992233445', null, null);

  const hoyPeru = getPeruDateStr();
  const vencMateo = addMonthsIso(hoyPeru, 3);
  const vencValentina = addMonthsIso(hoyPeru, 1);

  const insertMemb = db.prepare(`
    INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago, plan_tag, rutina_asignada)
    VALUES (?, ?, ?, 0, ?, 'ACTIVO', 'EFECTIVO', ?, 'SIN RUTINA ASIGNADA')
  `);
  insertMemb.run(Number(m1.lastInsertRowid), hoyPeru, vencMateo, 3, 'PLAN TRIMESTRAL');
  insertMemb.run(Number(m2.lastInsertRowid), hoyPeru, vencValentina, 1, 'PLAN MENSUAL');

  const insertFid = db.prepare(`
    INSERT INTO fidelidad (usuario_id, fecha_inscripcion_original, meses_continuos, nivel_actual)
    VALUES (?, ?, 0, 'NOVATO')
  `);
  insertFid.run(Number(m1.lastInsertRowid), hoyPeru);
  insertFid.run(Number(m2.lastInsertRowid), hoyPeru);

  console.log('Seed de producción aplicado:');
  console.log('- 6 usuarios reales (2 Admin, 2 Recepción, 2 Miembros)');
  console.log('- 25 máquinas físicas registradas');
  console.log('- 0 productos, 0 promociones, 0 aprobaciones, 0 rutinas, 0 check-ins, 0 alertas');
}

runSeed();
