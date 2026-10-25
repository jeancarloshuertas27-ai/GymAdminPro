import db from './db.js';
import bcrypt from 'bcryptjs';

console.log('🌱 Sembrando base de datos GymAdminPro...');

// Limpiar tablas para un seed limpio
db.exec(`
  DELETE FROM checkins;
  DELETE FROM fidelidad;
  DELETE FROM membresias;
  DELETE FROM usuarios;
  DELETE FROM sqlite_sequence WHERE name IN ('usuarios', 'membresias', 'fidelidad', 'checkins');
`);

const insertUser = db.prepare(`
  INSERT INTO usuarios (rol, username, password_hash, nombres, apellidos, dni, celular, celular_respaldo, domicilio, foto_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMembresia = db.prepare(`
  INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago, comprobante_url, numero_operacion, plan_tag, rutina_asignada)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertFidelidad = db.prepare(`
  INSERT INTO fidelidad (usuario_id, fecha_inscripcion_original, meses_continuos, nivel_actual, ultimo_reinicio)
  VALUES (?, ?, ?, ?, ?)
`);

const insertCheckin = db.prepare(`
  INSERT INTO checkins (usuario_id, dni_ingresado, timestamp, resultado, operador_id, motivo)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// 1. Crear Administrador
const adminPassHash = bcrypt.hashSync('Admin2026!', 10);
const adminResult = insertUser.run(
  'ADMINISTRADOR',
  '@admin_01',
  adminPassHash,
  'Carlos',
  'Mendoza',
  '00000001',
  '+51 999 111 222',
  null,
  null,
  null
);
const adminId = Number(adminResult.lastInsertRowid);

// 2. Crear Recepcionista
const recepPassHash = bcrypt.hashSync('Recep2026!', 10);
const recepResult = insertUser.run(
  'RECEPCIONISTA',
  '@recep_carlos',
  recepPassHash,
  'Carlos',
  'Mendoza',
  '00000002',
  '+51 988 222 333',
  '+51 912 345 678',
  'Av. Los Ingenieros 340, Dpto 402 - Santiago de Surco',
  null
);
const recepId = Number(recepResult.lastInsertRowid);

// Helper para calcular fechas relativas
const now = new Date();
const addDays = (d, days) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const subDays = (d, days) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const subMonths = (d, m) => new Date(d.getFullYear(), d.getMonth() - m, d.getDate()).toISOString().split('T')[0];

// 3. Crear Atletas de prueba
const athletes = [
  {
    nombres: 'Renzo',
    apellidos: 'Almeyda Gómez',
    dni: '74892103',
    username: '@renzo.a',
    pass: 'RnzAlpha99!',
    celular: '+51 984 221 004',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    planTag: 'VIP ANUAL',
    rutina: 'PPL Clásico // Fuerza & Hipertrofia (6 días)',
    estado: 'ACTIVO',
    expDays: 180,
    regMonthsAgo: 10,
    nivel: 'MUTANDO',
    tipoPago: 'EFECTIVO'
  },
  {
    nombres: 'Carla',
    apellidos: 'Benavides Castro',
    dni: '70918234',
    username: '@carla_fit',
    pass: 'PowerFit2024#',
    celular: '+51 971 445 119',
    fotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    planTag: 'TRIMESTRAL PRO',
    rutina: 'Torso-Pierna Intenso 4 Días',
    estado: 'POR_VENCER',
    expDays: 8,
    regMonthsAgo: 2,
    nivel: 'PRINCIPIANTE',
    tipoPago: 'TRANSFERENCIA',
    nroOp: 'OP-89123'
  },
  {
    nombres: 'Diego',
    apellidos: 'Guzmán Prado',
    dni: '72849102',
    username: '@dguzman',
    pass: 'IronSpartan_44',
    celular: '+51 987 654 321',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    planTag: 'PLAN ANUAL TITANIUM',
    rutina: 'HIPERTROFIA & FUERZA - PUSH DAY',
    estado: 'ACTIVO',
    expDays: 48,
    regMonthsAgo: 9,
    nivel: 'MUTANDO',
    tipoPago: 'TRANSFERENCIA',
    nroOp: 'OP-983142'
  },
  {
    nombres: 'Andrés',
    apellidos: 'Mejía Loyola',
    dni: '71220944',
    username: '@andres_m',
    pass: 'AndresPass_23',
    celular: '+51 912 883 490',
    fotoUrl: null,
    planTag: 'PLAN MENSUAL BÁSICO',
    rutina: 'FULLBODY BÁSICO',
    estado: 'VENCIDO',
    expDays: -45, // Vencido hace 45 días (PURGABLE >30d)
    regMonthsAgo: 3,
    nivel: 'NOVATO',
    tipoPago: 'EFECTIVO'
  },
  {
    nombres: 'Mateo',
    apellidos: 'Valdivia Roca',
    dni: '72849105',
    username: '@mateo_val',
    pass: 'Atleta2026!',
    celular: '+51 991 760 213',
    fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    planTag: 'VIP ANUAL',
    rutina: 'FUERZA & EMPUJE PUSH DAY',
    estado: 'ACTIVO',
    expDays: 90,
    regMonthsAgo: 11,
    nivel: 'MUTANDO',
    tipoPago: 'EFECTIVO'
  },
  {
    nombres: 'Valeria',
    apellidos: 'Espinoza Vargas',
    dni: '72849106',
    username: '@vale_power',
    pass: 'ValePower_99',
    celular: '+51 965 110 398',
    fotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    planTag: 'SEMESTRAL ELITE',
    rutina: 'Powerlifting Bloque 2 // Pico Máximo',
    estado: 'ACTIVO',
    expDays: 161,
    regMonthsAgo: 50, // > 4 años
    nivel: 'ANIMAL',
    tipoPago: 'TRANSFERENCIA',
    nroOp: 'OP-441029'
  }
];

const athleteIds = {};

for (const a of athletes) {
  const hash = bcrypt.hashSync(a.pass, 10);
  const uRes = insertUser.run(
    'MIEMBRO',
    a.username,
    hash,
    a.nombres,
    a.apellidos,
    a.dni,
    a.celular,
    null,
    null,
    a.fotoUrl
  );
  const userId = Number(uRes.lastInsertRowid);
  athleteIds[a.username] = userId;

  const startDate = subMonths(now, a.regMonthsAgo);
  const endDate = a.expDays >= 0 ? addDays(now, a.expDays) : subDays(now, Math.abs(a.expDays));

  insertMembresia.run(
    userId,
    startDate,
    endDate,
    1,
    0,
    a.estado,
    a.tipoPago,
    a.nroOp ? 'uploads/vouchers/seed_voucher.png' : null,
    a.nroOp || null,
    a.planTag,
    a.rutina
  );

  insertFidelidad.run(
    userId,
    startDate,
    a.regMonthsAgo,
    a.nivel,
    null
  );
}

// 4. Sembrar algunos check-ins previos para el feed
if (athleteIds['@dguzman']) {
  insertCheckin.run(
    athleteIds['@dguzman'],
    '72849102',
    subDays(now, 0) + ' 19:42:01',
    'VERDE_AUTORIZADO',
    recepId,
    'VIP • 48 DÍAS REST.'
  );
}

if (athleteIds['@carla_fit']) {
  insertCheckin.run(
    athleteIds['@carla_fit'],
    '70918234',
    subDays(now, 0) + ' 19:38:15',
    'NARANJA_AVISO',
    recepId,
    'FALTAN 8 DÍAS (AVISO)'
  );
}

if (athleteIds['@andres_m']) {
  insertCheckin.run(
    athleteIds['@andres_m'],
    '71220944',
    subDays(now, 0) + ' 19:31:54',
    'ROJO_DENEGADO',
    recepId,
    'VENCIDO HACE 45 DÍAS'
  );
}

console.log('✅ Base de datos sembrada con éxito.');

