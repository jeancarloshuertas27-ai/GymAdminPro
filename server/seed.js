import db from './db.js';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';

console.log('🌱 Sembrando base de datos GymAdminPro para producción...');

// Asegurar archivo de comprobante válido para pruebas visuales en Admin Aprobaciones
const vouchersDir = path.resolve(process.cwd(), 'uploads/vouchers');
if (!fs.existsSync(vouchersDir)) {
  fs.mkdirSync(vouchersDir, { recursive: true });
}
const voucherPath = path.join(vouchersDir, 'seed_voucher.png');
// PNG 1x1 píxel transparente válido
const minimalPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);
fs.writeFileSync(voucherPath, minimalPng);

// Limpiar todas las tablas para un seed estricto y limpio
db.exec(`
  PRAGMA foreign_keys = OFF;
  DELETE FROM alertas_coach;
  DELETE FROM miembro_rutina_ajustes;
  DELETE FROM miembro_rutinas_privadas;
  DELETE FROM miembro_rutinas_asignadas;
  DELETE FROM rutinas_ejercicios;
  DELETE FROM rutinas_dias;
  DELETE FROM rutinas_plantillas;
  DELETE FROM maquinas_ejercicios;
  DELETE FROM solicitudes_membresia;
  DELETE FROM ventas_productos;
  DELETE FROM productos;
  DELETE FROM promociones;
  DELETE FROM checkins;
  DELETE FROM fidelidad;
  DELETE FROM membresias;
  DELETE FROM usuarios;
  DELETE FROM sqlite_sequence;
  PRAGMA foreign_keys = ON;
`);

// Declaraciones preparadas
const insertUser = db.prepare(`
  INSERT INTO usuarios (rol, username, password_hash, password_plain, nombres, apellidos, dni, celular, celular_respaldo, domicilio, foto_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

const insertPromocion = db.prepare(`
  INSERT INTO promociones (tipo, nombre, duracion_valor, duracion_unidad, precio, fecha_limite, publico_objetivo, banner_url, activo)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertProducto = db.prepare(`
  INSERT INTO productos (sku, nombre, descripcion, precio_venta, precio_costo, stock, categoria, imagen_url, activo)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Helpers de fechas
const now = new Date();
const addDays = (d, days) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const subDays = (d, days) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const subMonths = (d, m) => new Date(d.getFullYear(), d.getMonth() - m, d.getDate()).toISOString().split('T')[0];

// =========================================================================
// 1. USUARIOS (EXACTAMENTE 8 USUARIOS BIEN ESTRUCTURADOS)
// =========================================================================

// Hashes
const adminHash = bcrypt.hashSync('Admin2026!', 10);
const recepHash = bcrypt.hashSync('Recep2026!', 10);
const atletaHash = bcrypt.hashSync('Atleta2026!', 10);

// 1.1 Administradores (2)
const admin1Res = insertUser.run(
  'ADMINISTRADOR',
  '@admin_01',
  adminHash,
  'Admin2026!',
  'Carlos',
  'Mendoza',
  '00000001',
  '+51 999 111 222',
  null,
  null,
  null
);
const admin1Id = Number(admin1Res.lastInsertRowid);

const admin2Res = insertUser.run(
  'ADMINISTRADOR',
  '@admin_patricia',
  adminHash,
  'Admin2026!',
  'Patricia',
  'Reyes Soto',
  '00000003',
  '+51 999 333 444',
  null,
  null,
  null
);
const admin2Id = Number(admin2Res.lastInsertRowid);

// 1.2 Recepcionistas (2) con celular de respaldo y domicilio completos
const recep1Res = insertUser.run(
  'RECEPCIONISTA',
  '@recep_carlos',
  recepHash,
  'Recep2026!',
  'Carlos',
  'Mendoza',
  '00000002',
  '+51 988 222 333',
  '+51 912 345 678',
  'Av. Los Ingenieros 340, Dpto 402 - Santiago de Surco',
  null
);
const recep1Id = Number(recep1Res.lastInsertRowid);

const recep2Res = insertUser.run(
  'RECEPCIONISTA',
  '@recep_andrea',
  recepHash,
  'Recep2026!',
  'Andrea',
  'Vega Alarcón',
  '00000004',
  '+51 988 444 555',
  '+51 912 888 999',
  'Jr. Batalla de Ayacucho 124 - Miraflores',
  null
);
const recep2Id = Number(recep2Res.lastInsertRowid);

// 1.3 Miembros (4) estratégicos para pruebas completas
const membersData = [
  {
    // Miembro 1: Membresía ACTIVA en Verde (> 1 mes restante, ej. 75 días), fidelidad MUTANDO
    nombres: 'Mateo',
    apellidos: 'Valdivia Roca',
    dni: '72849102',
    username: '@mateo_val',
    pass: 'Atleta2026!',
    celular: '+51 987 654 321',
    fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    planTag: 'PLAN ANUAL TITANIUM',
    rutina: 'Protocolo Hipertrofia 5 Días',
    estado: 'ACTIVO',
    expDays: 75, // > 1 mes (2 meses y 15 días)
    regMonthsAgo: 9,
    nivel: 'MUTANDO',
    tipoPago: 'TRANSFERENCIA',
    nroOp: 'OP-983142',
    comprobanteUrl: 'uploads/vouchers/seed_voucher.png',
  },
  {
    // Miembro 2: Membresía POR VENCER en Naranja (<= 10 días restantes, ej. 6 días), fidelidad MAMADO
    nombres: 'Carla',
    apellidos: 'Benavides Castro',
    dni: '70918234',
    username: '@carla_fit',
    pass: 'Atleta2026!',
    celular: '+51 971 445 119',
    fotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    planTag: 'TRIMESTRAL PRO',
    rutina: 'Fuerza Bruta 4 Días',
    estado: 'POR_VENCER',
    expDays: 6, // <= 10 días
    regMonthsAgo: 6,
    nivel: 'MAMADO',
    tipoPago: 'TRANSFERENCIA',
    nroOp: 'OP-89123',
    comprobanteUrl: 'uploads/vouchers/seed_voucher.png',
  },
  {
    // Miembro 3: Membresía VENCIDA reciente en Rojo (vencida hace 5 días, dentro de las 2 semanas de gracia), fidelidad PRINCIPIANTE
    nombres: 'Renzo',
    apellidos: 'Almeyda Gómez',
    dni: '74892103',
    username: '@renzo.a',
    pass: 'Atleta2026!',
    celular: '+51 984 221 004',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    planTag: 'MEMBRESÍA MENSUAL',
    rutina: 'Protocolo Hipertrofia 5 Días',
    estado: 'VENCIDO',
    expDays: -5, // Vencida hace 5 días
    regMonthsAgo: 2,
    nivel: 'PRINCIPIANTE',
    tipoPago: 'EFECTIVO',
    nroOp: null,
    comprobanteUrl: null,
  },
  {
    // Miembro 4: Membresía VENCIDA hace más de 1 mes (hace 40 días, permitiendo probar el botón "Eliminar usuario" en Admin), fidelidad NOVATO
    nombres: 'Andrés',
    apellidos: 'Mejía Loyola',
    dni: '71220944',
    username: '@andres_m',
    pass: 'Atleta2026!',
    celular: '+51 912 883 490',
    fotoUrl: null,
    planTag: 'PLAN MENSUAL BÁSICO',
    rutina: 'SIN RUTINA ASIGNADA',
    estado: 'VENCIDO',
    expDays: -40, // Vencida hace 40 días
    regMonthsAgo: 3,
    nivel: 'NOVATO',
    tipoPago: 'EFECTIVO',
    nroOp: null,
    comprobanteUrl: null,
  },
];

const memberIds = {};

for (const m of membersData) {
  const uRes = insertUser.run(
    'MIEMBRO',
    m.username,
    atletaHash,
    m.pass,
    m.nombres,
    m.apellidos,
    m.dni,
    m.celular,
    null,
    null,
    m.fotoUrl
  );
  const uId = Number(uRes.lastInsertRowid);
  memberIds[m.username] = uId;

  const startDate = subMonths(now, m.regMonthsAgo);
  const endDate = m.expDays >= 0 ? addDays(now, m.expDays) : subDays(now, Math.abs(m.expDays));

  insertMembresia.run(
    uId,
    startDate,
    endDate,
    m.expDays > 300 ? 1 : 0,
    m.expDays > 60 && m.expDays <= 300 ? 3 : 1,
    m.estado,
    m.tipoPago,
    m.comprobanteUrl,
    m.nroOp,
    m.planTag,
    m.rutina
  );

  insertFidelidad.run(
    uId,
    startDate,
    m.regMonthsAgo,
    m.nivel,
    null
  );
}

// Checkin inicial de Mateo para alimentar el feed de sala
if (memberIds['@mateo_val']) {
  insertCheckin.run(
    memberIds['@mateo_val'],
    '72849102',
    subDays(now, 0) + ' 19:42:01',
    'VERDE_AUTORIZADO',
    recep1Id,
    'TITANIUM • 75 DÍAS REST.'
  );
}

// =========================================================================
// 2. MÁQUINAS Y RUTINAS GLOBALES (FEATURE 004)
// =========================================================================
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
  INSERT INTO maquinas_ejercicios (numero_maquina, codigo_etiqueta, nombre, grupo_muscular, descripcion_corta)
  VALUES (?, ?, ?, ?, ?)
`);
for (const m of maquinas) {
  insertMaq.run(...m);
}

const getMaqId = (num) => {
  const r = db.prepare('SELECT id FROM maquinas_ejercicios WHERE numero_maquina = ?').get(num);
  return r ? r.id : null;
};

const insDia = db.prepare('INSERT INTO rutinas_dias (rutina_id, dia_semana, enfoque_muscular, orden_dia) VALUES (?, ?, ?, ?)');
const insEx = db.prepare('INSERT INTO rutinas_ejercicios (rutina_dia_id, maquina_id, orden_secuencial, series, repeticiones, tiempo_descanso_segundos) VALUES (?, ?, ?, ?, ?, ?)');

// Plantilla 1: Protocolo Hipertrofia 5 Días
const p1 = db.prepare(`
  INSERT INTO rutinas_plantillas (nombre, descripcion, created_by, activo)
  VALUES ('Protocolo Hipertrofia 5 Días', 'División Push / Pull / Legs / Upper / Core enfocada en masa muscular', ?, 1)
`).run(admin1Id);
const r1Id = Number(p1.lastInsertRowid);

const dias1 = [
  { dia: 'LUNES', enfoque: 'PUSH', orden: 1, exs: [[8, 4, '8-12', 90], [15, 4, '10-12', 60], [11, 3, '12-15', 60], [21, 4, '12-15', 60]] },
  { dia: 'MARTES', enfoque: 'PULL', orden: 2, exs: [[7, 4, '8-12', 90], [12, 4, '10-12', 90], [17, 3, '10-12', 60]] },
  { dia: 'MIERCOLES', enfoque: 'LEGS', orden: 3, exs: [[2, 4, '8-12', 120], [4, 4, '12-15', 60], [18, 4, '10-12', 90], [20, 4, '15-20', 60]] },
  { dia: 'JUEVES', enfoque: 'REST', orden: 4, exs: [] },
  { dia: 'VIERNES', enfoque: 'UPPER', orden: 5, exs: [[9, 4, '8-12', 90], [13, 4, '8-12', 90], [10, 3, '10-12', 90]] },
  { dia: 'SABADO', enfoque: 'CORE', orden: 6, exs: [[23, 4, '15-20', 60], [24, 3, '12-15', 60]] },
];

for (const d of dias1) {
  const dr = insDia.run(r1Id, d.dia, d.enfoque, d.orden);
  const diaId = Number(dr.lastInsertRowid);
  d.exs.forEach(([numMaq, series, reps, rest], idx) => {
    const mId = getMaqId(numMaq);
    if (mId) insEx.run(diaId, mId, idx + 1, series, reps, rest);
  });
}

// Plantilla 2: Fuerza Bruta 4 Días
const p2 = db.prepare(`
  INSERT INTO rutinas_plantillas (nombre, descripcion, created_by, activo)
  VALUES ('Fuerza Bruta 4 Días', 'Enfoque compuesto de fuerza e hipertrofia miofibrilar', ?, 1)
`).run(admin1Id);
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

// Asignaciones de rutinas a los atletas activos
const insAsignacion = db.prepare(`
  INSERT INTO miembro_rutinas_asignadas (usuario_id, rutina_id, asignado_por)
  VALUES (?, ?, ?)
`);
if (memberIds['@mateo_val']) insAsignacion.run(memberIds['@mateo_val'], r1Id, admin1Id);
if (memberIds['@carla_fit']) insAsignacion.run(memberIds['@carla_fit'], r2Id, admin1Id);
if (memberIds['@renzo.a']) insAsignacion.run(memberIds['@renzo.a'], r1Id, admin1Id);

// =========================================================================
// 3. PROMOCIONES Y TARIFAS (FEATURE 002)
// =========================================================================
const promo1Res = insertPromocion.run(
  'PROMOCION_VOLATIL',
  'Plan Anual Mutación 2025',
  12,
  'MESES',
  899.00,
  '2026-12-31',
  'MUTANDO',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  1
);
const promo1Id = Number(promo1Res.lastInsertRowid);

const promo2Res = insertPromocion.run(
  'PROMOCION_VOLATIL',
  'Trimestre Hipertrofia',
  3,
  'MESES',
  320.00,
  '2026-11-30',
  'TODOS',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  1
);
const promo2Id = Number(promo2Res.lastInsertRowid);

insertPromocion.run(
  'TARIFA_FIJA',
  'Pase Fijo 1 Mes',
  30,
  'DIAS',
  120.00,
  null,
  'TODOS',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
  1
);

insertPromocion.run(
  'PROMOCION_VOLATIL',
  'Promoción Verano Flash',
  1,
  'MESES',
  99.00,
  '2026-03-31',
  'TODOS',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  0 // Inactiva para probar estado desactivado en admin
);

// =========================================================================
// 4. PRODUCTOS (EXACTAMENTE 6 PRODUCTOS REALES CON EXACTAMENTE 1 EN STOCK = 0)
// =========================================================================
const productosSeed = [
  {
    sku: 'SKU-PROT-01',
    nombre: 'Whey Isolate 2kg Gold',
    descripcion: 'Fórmula de máxima pureza microfiltrada con aminoácidos ramificados para hipertrofia y recuperación muscular acelerada.',
    precio_venta: 249.00,
    precio_costo: 160.00,
    stock: 14,
    categoria: 'SUPLEMENTOS',
    imagen_url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80',
  },
  {
    sku: 'SKU-CREA-08',
    nombre: 'Creatina Creapure 300g',
    descripcion: 'Monohidrato de creatina patentado de grado alemán. Incremento comprobado de potencia explosiva y ATP celular.',
    precio_venta: 115.00,
    precio_costo: 70.00,
    stock: 22,
    categoria: 'SUPLEMENTOS',
    imagen_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=600&q=80',
  },
  {
    sku: 'SKU-HYDR-03',
    nombre: 'Bebida Isotónica Electrolitos 500ml',
    descripcion: 'Fórmula de recarga iónica rápida con sodio, potasio y magnesio para evitar calambres y deshidratación intensa.',
    precio_venta: 10.00,
    precio_costo: 4.50,
    stock: 30,
    categoria: 'BEBIDAS',
    imagen_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  },
  {
    sku: 'SKU-GEAR-12',
    nombre: 'Shaker Inox 900ml',
    descripcion: 'Acero inoxidable quirúrgico con cierre hermético a prueba de fugas y rejilla mezcladora de disolución rápida.',
    precio_venta: 79.00,
    precio_costo: 34.00,
    stock: 18,
    categoria: 'ACCESORIOS',
    imagen_url: 'https://images.unsplash.com/photo-1570824104453-508955ab713e?auto=format&fit=crop&w=600&q=80',
  },
  {
    sku: 'SKU-GEAR-09',
    nombre: 'Cinturón de Levantamiento Cuero 10mm',
    descripcion: 'Cuero curtido multicapa con hebilla de palanca de liberación rápida para sentadilla pesada y despegue.',
    precio_venta: 320.00,
    precio_costo: 195.00,
    stock: 8,
    categoria: 'ACCESORIOS',
    imagen_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
  },
  {
    sku: 'SKU-SNK-04',
    nombre: 'Barra Proteica Quest Crunch 60g',
    descripcion: '20g de proteína aislada, 1g de azúcar. Reposición pendiente al proveedor logístico.',
    precio_venta: 14.00,
    precio_costo: 8.20,
    stock: 0, // Exactamente 1 producto con stock = 0
    categoria: 'SNACKS',
    imagen_url: 'https://images.unsplash.com/photo-1622484216854-8e11a2f6460f?auto=format&fit=crop&w=600&q=80',
  },
];

const productMap = {};
for (const p of productosSeed) {
  const pRes = insertProducto.run(
    p.sku,
    p.nombre,
    p.descripcion,
    p.precio_venta,
    p.precio_costo,
    p.stock,
    p.categoria,
    p.imagen_url,
    1
  );
  productMap[p.sku] = Number(pRes.lastInsertRowid);
}

// =========================================================================
// 5. CAMBIOS & APROBACIONES PENDIENTES (EXACTAMENTE 4 REGISTROS)
//    - 2 de membresías (1 Efectivo + 1 Transferencia con comprobante válido)
//    - 2 de ventas de productos (1 Efectivo + 1 Transferencia con comprobante válido)
// =========================================================================

// 5.1 Membresía Efectivo (Mateo Valdivia)
db.prepare(`
  INSERT INTO solicitudes_membresia (
    usuario_id, atleta_nombre_historico, atleta_dni_historico, promocion_id,
    dias_agregados, monto, metodo_pago, comprobante_url, operador_id, estado, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE_APROBACION', ?)
`).run(
  memberIds['@mateo_val'],
  'Mateo Valdivia Roca',
  '72849102',
  promo2Id,
  90,
  320.00,
  'EFECTIVO',
  null,
  recep1Id,
  subDays(now, 0) + ' 10:15:00'
);

// 5.2 Membresía Transferencia (Carla Benavides con voucher válido)
db.prepare(`
  INSERT INTO solicitudes_membresia (
    usuario_id, atleta_nombre_historico, atleta_dni_historico, promocion_id,
    dias_agregados, monto, metodo_pago, comprobante_url, operador_id, estado, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE_APROBACION', ?)
`).run(
  memberIds['@carla_fit'],
  'Carla Benavides Castro',
  '70918234',
  promo1Id,
  365,
  899.00,
  'TRANSFERENCIA',
  'uploads/vouchers/seed_voucher.png',
  recep2Id,
  subDays(now, 0) + ' 11:30:00'
);

// 5.3 Venta de Producto Efectivo (Creatina Creapure 300g)
db.prepare(`
  INSERT INTO ventas_productos (
    producto_id, cantidad, precio_unitario, total, metodo_pago, comprobante_url,
    operador_id, operador_nombre_historico, estado, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE_APROBACION', ?)
`).run(
  productMap['SKU-CREA-08'],
  1,
  115.00,
  115.00,
  'EFECTIVO',
  null,
  recep1Id,
  'Carlos Mendoza',
  subDays(now, 0) + ' 14:05:00'
);

// 5.4 Venta de Producto Transferencia (Whey Isolate con voucher válido)
db.prepare(`
  INSERT INTO ventas_productos (
    producto_id, cantidad, precio_unitario, total, metodo_pago, comprobante_url,
    operador_id, operador_nombre_historico, estado, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE_APROBACION', ?)
`).run(
  productMap['SKU-PROT-01'],
  1,
  249.00,
  249.00,
  'TRANSFERENCIA',
  'uploads/vouchers/seed_voucher.png',
  recep2Id,
  'Andrea Vega Alarcón',
  subDays(now, 0) + ' 16:45:00'
);

// =========================================================================
// 6. VACUUM Y COMPACTACIÓN DE SQLITE
// =========================================================================
db.exec('VACUUM;');

console.log('✅ Base de datos GymAdminPro depurada, optimizada y sembrada con éxito:');
console.log('   - 8 Usuarios únicos estructurados.');
console.log('   - 6 Productos reales (1 agotado con stock=0).');
console.log('   - 4 Aprobaciones pendientes (2 membresías + 2 productos; 2 efectivo + 2 transferencia con voucher).');
console.log('   - 2 Plantillas de rutinas globales asignadas.');
console.log('   - 0 Alertas huérfanas.');
console.log('   - VACUUM ejecutado.');
