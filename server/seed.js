import db from './db.js';
import bcrypt from 'bcryptjs';

console.log('🌱 Sembrando base de datos GymAdminPro (con Feature 002)...');

// Limpiar tablas para un seed limpio
db.exec(`
  DELETE FROM solicitudes_membresia;
  DELETE FROM ventas_productos;
  DELETE FROM productos;
  DELETE FROM promociones;
  DELETE FROM checkins;
  DELETE FROM fidelidad;
  DELETE FROM membresias;
  DELETE FROM usuarios;
  DELETE FROM sqlite_sequence WHERE name IN (
    'usuarios', 'membresias', 'fidelidad', 'checkins', 
    'promociones', 'productos', 'ventas_productos', 'solicitudes_membresia'
  );
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

const insertPromocion = db.prepare(`
  INSERT INTO promociones (tipo, nombre, duracion_valor, duracion_unidad, precio, fecha_limite, publico_objetivo, banner_url, activo)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertProducto = db.prepare(`
  INSERT INTO productos (sku, nombre, descripcion, precio_venta, precio_costo, stock, categoria, imagen_url, activo)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    nombres: 'Mateo',
    apellidos: 'Valdivia Roca',
    dni: '72849102', // DNI de las maquetas de Stitch
    username: '@mateo_val',
    pass: 'Atleta2026!',
    celular: '+51 987 654 321',
    fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    planTag: 'PLAN ANUAL MUTACIÓN',
    rutina: 'FUERZA & EMPUJE PUSH DAY',
    estado: 'ACTIVO',
    expDays: 48,
    regMonthsAgo: 9,
    nivel: 'MUTANDO',
    tipoPago: 'TRANSFERENCIA',
    nroOp: 'OP-983142'
  },
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
    expDays: -45, // Vencido hace 45 días
    regMonthsAgo: 3,
    nivel: 'NOVATO',
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
    regMonthsAgo: 50,
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

// 4. Sembrar Check-ins previos
if (athleteIds['@mateo_val']) {
  insertCheckin.run(
    athleteIds['@mateo_val'],
    '72849102',
    subDays(now, 0) + ' 19:42:01',
    'VERDE_AUTORIZADO',
    recepId,
    'VIP • 48 DÍAS REST.'
  );
}

// 5. Sembrar Promociones y Precios Maestros (Feature 002)
insertPromocion.run(
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

insertPromocion.run(
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

// 6. Sembrar Productos e Inventario (Feature 002)
const productosSeed = [
  {
    sku: 'SKU-PROT-01',
    nombre: 'Whey Isolate 2kg Gold',
    descripcion: 'Fórmula de máxima pureza microfiltrada con aminoácidos ramificados para hipertrofia y recuperación muscular acelerada.',
    precio_venta: 249.00,
    precio_costo: 160.00,
    stock: 14,
    categoria: 'SUPLEMENTOS',
    imagen_url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80'
  },
  {
    sku: 'SKU-CREA-08',
    nombre: 'Creatina Creapure 300g',
    descripcion: 'Monohidrato de creatina patentado de grado alemán. Incremento comprobado de potencia explosiva y ATP celular.',
    precio_venta: 115.00,
    precio_costo: 70.00,
    stock: 22,
    categoria: 'SUPLEMENTOS',
    imagen_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=600&q=80'
  },
  {
    sku: 'SKU-HYDR-03',
    nombre: 'Bebida Isotónica Electrolitos 500ml',
    descripcion: 'Fórmula de recarga iónica rápida con sodio, potasio y magnesio para evitar calambres y deshidratación intensa.',
    precio_venta: 10.00,
    precio_costo: 4.50,
    stock: 31,
    categoria: 'BEBIDAS',
    imagen_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'
  },
  {
    sku: 'SKU-GEAR-12',
    nombre: 'Shaker Inox 900ml',
    descripcion: 'Acero inoxidable quirúrgico con cierre hermético a prueba de fugas y rejilla mezcladora de disolución rápida.',
    precio_venta: 79.00,
    precio_costo: 34.00,
    stock: 18,
    categoria: 'ACCESORIOS',
    imagen_url: 'https://images.unsplash.com/photo-1570824104453-508955ab713e?auto=format&fit=crop&w=600&q=80'
  },
  {
    sku: 'SKU-SNK-04',
    nombre: 'Barra Proteica Quest Crunch 60g',
    descripcion: '20g de proteína aislada, 1g de azúcar. Reposición solicitada al proveedor logístico.',
    precio_venta: 14.00,
    precio_costo: 8.20,
    stock: 0, // Stock agotado obligatorio para pruebas visuales
    categoria: 'SNACKS',
    imagen_url: 'https://images.unsplash.com/photo-1622484216854-8e11a2f6460f?auto=format&fit=crop&w=600&q=80'
  },
  {
    sku: 'SKU-GEAR-09',
    nombre: 'Cinturón de Levantamiento Cuero 10mm',
    descripcion: 'Cuero curtido multicapa con hebilla de palanca de liberación rápida para sentadilla pesada y despegue.',
    precio_venta: 320.00,
    precio_costo: 195.00,
    stock: 0, // Stock agotado obligatorio para pruebas visuales
    categoria: 'ACCESORIOS',
    imagen_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'
  }
];

for (const p of productosSeed) {
  insertProducto.run(
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
}

console.log('✅ Base de datos sembrada con éxito (incluye usuarios, promociones y productos).');
