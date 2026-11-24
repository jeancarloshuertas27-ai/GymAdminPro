import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import {
  calculateFidelity,
  calculateRemainingTime,
  evaluateCheckIn,
} from '../server/utils/fidelity.js';

const app = new Hono();

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const TIER_ORDER = {
  TODOS: 0,
  NOVATO: 1,
  PRINCIPIANTE: 2,
  PROMEDIO: 3,
  EN_PROGRESO: 4,
  MUTANDO: 5,
  MAMADO: 6,
  DIOS_GRIEGO: 7,
  ANIMAL: 8,
};

function getPeruDateStr(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

function getPeruDayNameNormalized(date = new Date()) {
  const raw = date.toLocaleDateString('es-PE', { weekday: 'long', timeZone: 'America/Lima' });
  return raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function calculateNewExpirationDate(currentExpiration, daysToAdd, today = getPeruDateStr()) {
  const wasActive = currentExpiration && currentExpiration > today;
  const baseDate = wasActive ? currentExpiration : today;
  const base = new Date(baseDate);
  const result = new Date(base.getTime() + daysToAdd * 86400000);
  return {
    newExpirationDate: result.toISOString().split('T')[0],
    baseUsed: baseDate,
    wasActive: Boolean(wasActive),
  };
}

function normalizeTier(tier) {
  if (!tier) return 'TODOS';
  const t = String(tier).toUpperCase().trim();
  if (t === 'TODOS') return 'TODOS';
  if (t.includes('DIOS')) return 'DIOS_GRIEGO';
  if (t.includes('ANIMAL')) return 'ANIMAL';
  if (t.includes('MAMAD')) return 'MAMADO';
  if (t.includes('MUTAN')) return 'MUTANDO';
  if (t.includes('PROGRESO')) return 'EN_PROGRESO';
  if (t.includes('PROMEDIO')) return 'PROMEDIO';
  if (t.includes('PRINCIPIANTE')) return 'PRINCIPIANTE';
  if (t.includes('NOVATO')) return 'NOVATO';
  return 'NOVATO';
}

function canMemberAccessPromo(userFidelityLevel, promoRequiredLevel) {
  if (!promoRequiredLevel || promoRequiredLevel === 'TODOS') return true;
  const normPromo = normalizeTier(promoRequiredLevel);
  if (normPromo === 'TODOS') return true;
  const normUser = normalizeTier(userFidelityLevel);
  const userRank = TIER_ORDER[normUser] !== undefined ? TIER_ORDER[normUser] : 1;
  const requiredRank = TIER_ORDER[normPromo] !== undefined ? TIER_ORDER[normPromo] : 0;
  return userRank >= requiredRank;
}

function sanitizeProductForRole(product, role) {
  if (!product) return null;
  const p = { ...product };
  if (role === 'MIEMBRO') {
    if (p.stock === 0) return null;
    delete p.precio_costo;
    delete p.margen_porcentaje;
    return p;
  }
  if (role === 'ADMINISTRADOR' || role === 'ADMIN') {
    const costo = Number(p.precio_costo || 0);
    const pvp = Number(p.precio_venta || 0);
    p.margen_porcentaje = pvp > 0 ? parseFloat((((pvp - costo) / pvp) * 100).toFixed(1)) : 0.0;
    return p;
  }
  delete p.precio_costo;
  delete p.margen_porcentaje;
  return p;
}

async function fileToDataUrl(file) {
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    return null;
  }
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const mime = file.type || 'image/jpeg';
  return `data:${mime};base64,${btoa(binary)}`;
}

async function parseRequestPayload(c) {
  const ct = (c.req.header('content-type') || '').toLowerCase();
  if (ct.includes('multipart/form-data')) {
    const fd = await c.req.formData();
    const fields = {};
    const files = {};
    for (const [key, val] of fd.entries()) {
      if (val && typeof val === 'object' && typeof val.arrayBuffer === 'function') {
        if (val.size > 0) {
          files[key] = await fileToDataUrl(val);
        }
      } else {
        fields[key] = val;
      }
    }
    return { fields, files };
  }
  try {
    const body = await c.req.json();
    return { fields: body || {}, files: {} };
  } catch {
    return { fields: {}, files: {} };
  }
}

// =========================================================================
// CORS MULTI-ORIGEN PARA LOS 3 SITIOS CLOUDFLARE Y LOCALHOST
// =========================================================================
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*';
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return origin;
    if (origin.endsWith('.pages.dev') || origin.endsWith('.workers.dev')) return origin;
    if (origin.includes('gymadminpro') || origin.includes('gymcore')) return origin;
    return origin;
  },
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
}));

async function getAuthenticatedUser(c) {
  const authHeader = c.req.header('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const userId = token.startsWith('uid_') ? Number(token.split('_')[1]) : Number(token);
  if (!userId || Number.isNaN(userId)) return null;

  const user = await c.env.DB.prepare(
    'SELECT id, rol, username, nombres, apellidos, dni, celular, foto_url FROM usuarios WHERE id = ?'
  ).bind(userId).first();
  return user || null;
}

// =========================================================================
// 1. HEALTH CHECK
// =========================================================================
app.get('/api/health', (c) => {
  return c.json({
    status: 'ONLINE',
    system: 'GymAdminPro // Cloudflare Worker + D1 Serverless',
    timestamp: new Date().toISOString(),
    region: c.req.header('cf-ipcountry') || 'GLOBAL',
  });
});

// =========================================================================
// 2. AUTENTICACIÓN Y SEGREGACIÓN DE ROLES
// =========================================================================
app.post('/api/auth/login/:portal?', async (c) => {
  const portalParam = c.req.param('portal');
  let body = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const rawInput = String(body.username || '').trim();
  const rawPassword = String(body.password || '');
  const requestedPortal = String(portalParam || body.portal || '').toLowerCase();

  if (!rawInput || !rawPassword) {
    return c.json({ error: 'Debe ingresar nombre de usuario y contraseña.' }, 400);
  }

  const cleanUser = rawInput.startsWith('@') ? rawInput : `@${rawInput}`;
  const withoutAt = rawInput.startsWith('@') ? rawInput.slice(1) : rawInput;

  const user = await c.env.DB.prepare(
    'SELECT * FROM usuarios WHERE username = ? COLLATE NOCASE OR username = ? COLLATE NOCASE OR dni = ?'
  ).bind(cleanUser, withoutAt, rawInput).first();

  if (!user) {
    return c.json({ error: 'Credenciales inválidas. Verifique su usuario y contraseña.' }, 401);
  }

  const validPassword = bcrypt.compareSync(rawPassword, user.password_hash) ||
    (rawPassword.trim() !== rawPassword && bcrypt.compareSync(rawPassword.trim(), user.password_hash));

  if (!validPassword) {
    return c.json({ error: 'Credenciales inválidas. Verifique su usuario y contraseña.' }, 401);
  }

  if (requestedPortal === 'admin' && user.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado: este portal es exclusivo para Administradores.' }, 403);
  }
  if ((requestedPortal === 'recepcion' || requestedPortal === 'reception') && user.rol !== 'RECEPCIONISTA') {
    return c.json({ error: 'Acceso denegado: este portal es exclusivo para personal de Recepción.' }, 403);
  }
  if ((requestedPortal === 'miembro' || requestedPortal === 'member') && user.rol !== 'MIEMBRO') {
    return c.json({ error: 'Acceso denegado: este portal es exclusivo para Miembros.' }, 403);
  }

  const token = `uid_${user.id}_${Date.now()}`;
  return c.json({
    token,
    user: {
      id: user.id,
      rol: user.rol,
      username: user.username,
      nombres: user.nombres,
      apellidos: user.apellidos,
      dni: user.dni,
      celular: user.celular,
      foto_url: user.foto_url,
    },
  });
});

app.get('/api/auth/me', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user) return c.json({ error: 'No autorizado' }, 401);
  return c.json({ user });
});

// =========================================================================
// 3. CHECK-IN POR DNI Y FEED EN VIVO
// =========================================================================
app.post('/api/checkin', async (c) => {
  const operator = await getAuthenticatedUser(c);
  let body = {};
  try { body = await c.req.json(); } catch { body = {}; }
  const cleanDni = String(body.dni || '').trim();

  if (!cleanDni || !/^\d{8}$/.test(cleanDni)) {
    return c.json({ error: 'Debe ingresar un DNI válido de 8 dígitos numéricos.' }, 400);
  }

  const user = await c.env.DB.prepare(`
    SELECT u.id, u.nombres, u.apellidos, u.dni, u.foto_url,
           m.fecha_vencimiento, m.estado, m.plan_tag, m.rutina_asignada,
           rp.id AS rutina_id, rp.nombre AS plantilla_nombre,
           f.nivel_actual, f.fecha_inscripcion_original
    FROM usuarios u
    LEFT JOIN membresias m ON m.usuario_id = u.id
    LEFT JOIN miembro_rutinas_asignadas mra ON mra.usuario_id = u.id
    LEFT JOIN rutinas_plantillas rp ON rp.id = mra.rutina_id AND rp.activo = 1
    LEFT JOIN fidelidad f ON f.usuario_id = u.id
    WHERE u.dni = ? AND u.rol = 'MIEMBRO'
    ORDER BY m.id DESC LIMIT 1
  `).bind(cleanDni).first();

  const evaluation = evaluateCheckIn(user);
  await c.env.DB.prepare(`
    INSERT INTO checkins (usuario_id, dni_ingresado, resultado, operador_id, motivo)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    user ? user.id : null,
    cleanDni,
    evaluation.resultado,
    operator?.id || null,
    evaluation.motivo || evaluation.warningMessage || (user ? (user.plan_tag || 'MEMBRESÍA') : 'NO REGISTRADO')
  ).run();

  if (!user) {
    return c.json({
      resultado: evaluation.resultado,
      titulo: evaluation.titulo,
      kicker: evaluation.kicker,
      motivo: evaluation.motivo,
      grantAccess: false,
    });
  }

  const fidelity = calculateFidelity(user.fecha_inscripcion_original || new Date(), user.fecha_vencimiento);
  const remaining = calculateRemainingTime(user.fecha_vencimiento);
  const mesPeru = getPeruDateStr().slice(0, 7);

  const asistenciaRow = await c.env.DB.prepare(`
    SELECT COUNT(*) AS total
    FROM checkins
    WHERE usuario_id = ? AND strftime('%Y-%m', timestamp) = ?
      AND resultado IN ('VERDE_AUTORIZADO', 'NARANJA_AVISO', 'MANUAL_FORZADO')
  `).bind(user.id, mesPeru).first();
  const checkinsMes = Number(asistenciaRow?.total || 0);

  const diaNormalizado = getPeruDayNameNormalized();
  let ejerciciosHoy = [];
  let enfoqueHoy = user.plantilla_nombre || user.rutina_asignada || 'SIN RUTINA ASIGNADA';

  if (user.rutina_id) {
    const diaRow = await c.env.DB.prepare(`
      SELECT id, enfoque_muscular
      FROM rutinas_dias
      WHERE rutina_id = ? AND dia_semana = ?
      LIMIT 1
    `).bind(user.rutina_id, diaNormalizado).first();

    if (diaRow) {
      const esDescanso = String(diaRow.enfoque_muscular || '').toUpperCase() === 'REST';
      enfoqueHoy = esDescanso ? 'DESCANSO PROGRAMADO' : (diaRow.enfoque_muscular || enfoqueHoy);
      if (!esDescanso) {
        const { results } = await c.env.DB.prepare(`
          SELECT re.series, re.repeticiones, re.tiempo_descanso_segundos,
                 m.nombre AS nombre_ejercicio, m.nombre AS maquina_nombre, m.codigo_etiqueta, m.grupo_muscular
          FROM rutinas_ejercicios re
          LEFT JOIN maquinas_ejercicios m ON m.id = re.maquina_id
          WHERE re.rutina_dia_id = ?
          ORDER BY re.orden_secuencial ASC
        `).bind(diaRow.id).all();
        ejerciciosHoy = results || [];
      }
    }
  }

  const rutinaDisplay = user.plantilla_nombre || user.rutina_asignada || 'SIN RUTINA ASIGNADA';

  return c.json({
    resultado: evaluation.resultado,
    titulo: evaluation.titulo,
    kicker: evaluation.kicker,
    authCode: `#AUTH-${cleanDni.slice(-5)}`,
    grantAccess: evaluation.grantAccess,
    warningMessage: evaluation.warningMessage || null,
    membresia: {
      plan_tag: user.plan_tag || 'SIN MEMBRESÍA',
      fecha_vencimiento: user.fecha_vencimiento,
      dias_restantes: remaining.totalDays,
    },
    atleta: {
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      nombreCompleto: `${user.nombres} ${user.apellidos}`.toUpperCase(),
      dni: user.dni,
      fotoUrl: user.foto_url || null,
      tiempoRestante: remaining.text,
      tiempoRestanteCorto: remaining.cardText,
      estadoMembresia: remaining.text,
      diasRestantes: remaining.totalDays,
      trafficColor: remaining.trafficColor,
      fechaVencimiento: user.fecha_vencimiento,
      nivelFidelidad: fidelity.name,
      planTag: user.plan_tag || 'SIN MEMBRESÍA',
      rutinaHoy: enfoqueHoy,
      rutinaAsignada: rutinaDisplay,
      ejerciciosHoy,
      checkinsMes,
      asistenciaMes: `${checkinsMes} ${checkinsMes === 1 ? 'SESIÓN ESTE MES' : 'SESIONES ESTE MES'}`,
    },
  });
});

app.get('/api/checkin/recent', async (c) => {
  const limit = Number(c.req.query('limit') || 10);
  const { results } = await c.env.DB.prepare(`
    SELECT c.id, c.dni_ingresado, c.timestamp, c.resultado, c.motivo,
           u.nombres, u.apellidos
    FROM checkins c
    LEFT JOIN usuarios u ON u.id = c.usuario_id
    ORDER BY c.timestamp DESC, c.id DESC
    LIMIT ?
  `).bind(limit).all();

  return c.json((results || []).map((r) => {
    const timePart = r.timestamp ? (r.timestamp.split(' ')[1] || '') : '';
    return {
      id: r.id,
      timestamp: r.timestamp,
      hora: timePart ? timePart.substring(0, 8) : '',
      dni: r.dni_ingresado,
      dni_ingresado: r.dni_ingresado,
      nombres: r.nombres || '',
      apellidos: r.apellidos || '',
      nombre: r.nombres && r.apellidos ? `${r.nombres} ${r.apellidos}` : `DNI ${r.dni_ingresado}`,
      detalle: r.motivo || 'ACCESO REGISTRADO',
      resultado: r.resultado,
    };
  }));
});

app.post('/api/checkin/force', async (c) => {
  const operator = await getAuthenticatedUser(c);
  if (!operator || !['ADMINISTRADOR', 'RECEPCIONISTA'].includes(operator.rol)) {
    return c.json({ error: 'Acceso denegado.' }, 403);
  }
  let body = {};
  try { body = await c.req.json(); } catch { body = {}; }
  const cleanDni = body.dni ? String(body.dni).trim() : '00000000';
  const motivo = body.motivo || 'PULSO MANUAL POR RECEPCIÓN';
  const user = await c.env.DB.prepare('SELECT id FROM usuarios WHERE dni = ?').bind(cleanDni).first();

  await c.env.DB.prepare(`
    INSERT INTO checkins (usuario_id, dni_ingresado, resultado, operador_id, motivo)
    VALUES (?, ?, 'MANUAL_FORZADO', ?, ?)
  `).bind(user ? user.id : null, cleanDni, operator.id, motivo).run();

  return c.json({ success: true, message: 'Apertura manual concedida y registrada en auditoría.' });
});

// =========================================================================
// 4. USUARIOS (PADRÓN, CREACIÓN, EDICIÓN, PURGA)
// =========================================================================
app.get('/api/users', async (c) => {
  const currentUser = await getAuthenticatedUser(c);
  if (!currentUser || !['ADMINISTRADOR', 'RECEPCIONISTA'].includes(currentUser.rol)) {
    return c.json({ error: 'No autorizado' }, 401);
  }

  const isAdmin = currentUser.rol === 'ADMINISTRADOR';
  const search = String(c.req.query('search') || '').trim().toLowerCase();
  const status = String(c.req.query('status') || 'all');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.max(1, Number(c.req.query('limit') || 10));

  const { results: allUsers } = await c.env.DB.prepare(`
    SELECT u.id, u.rol, u.apellidos, u.nombres, u.dni, u.username, u.password_plain, u.celular, u.foto_url, u.created_at,
           m.fecha_inicio, m.fecha_vencimiento, m.plan_tag, m.rutina_asignada,
           rp.nombre AS plantilla_nombre,
           f.nivel_actual, f.fecha_inscripcion_original
    FROM usuarios u
    LEFT JOIN membresias m ON m.usuario_id = u.id
    LEFT JOIN miembro_rutinas_asignadas mra ON mra.usuario_id = u.id
    LEFT JOIN rutinas_plantillas rp ON rp.id = mra.rutina_id AND rp.activo = 1
    LEFT JOIN fidelidad f ON f.usuario_id = u.id
    WHERE u.rol = 'MIEMBRO'
    ORDER BY u.apellidos COLLATE NOCASE ASC
  `).all();

  let activosCount = 0;
  let porVencerCount = 0;
  let vencidosCount = 0;
  let vencidosPurgablesCount = 0;
  let sinRutinaCount = 0;

  const enrichedList = (allUsers || []).map((user) => {
    const remaining = user.fecha_vencimiento ? calculateRemainingTime(user.fecha_vencimiento) : {
      totalDays: 0,
      daysExpired: 0,
      status: 'EXPIRED',
      trafficColor: 'ROJO',
      text: 'SIN MEMBRESÍA',
      cardText: 'SIN MEMBRESÍA',
      canDelete: true,
    };

    const fidelity = user.fecha_inscripcion_original && user.fecha_vencimiento
      ? calculateFidelity(user.fecha_inscripcion_original, user.fecha_vencimiento)
      : { name: 'NOVATO', level: 1 };

    const rutinaAsignada = user.plantilla_nombre || user.rutina_asignada || 'SIN RUTINA ASIGNADA';

    if (remaining.status === 'ACTIVE') activosCount++;
    else if (remaining.status === 'WARNING') porVencerCount++;
    else vencidosCount++;

    if (remaining.canDelete) vencidosPurgablesCount++;
    if (!user.plantilla_nombre && !user.rutina_asignada) sinRutinaCount++;

    const estadoMembresia = remaining.status === 'ACTIVE'
      ? 'ACTIVO'
      : remaining.status === 'WARNING'
        ? 'POR_VENCER'
        : 'VENCIDO';

    return {
      id: user.id,
      rol: user.rol,
      apellidos: user.apellidos,
      nombres: user.nombres,
      dni: user.dni,
      username: isAdmin ? user.username : null,
      password_visible: isAdmin ? (user.password_plain || '') : null,
      passwordRaw: isAdmin ? (user.password_plain || '') : null,
      celular: user.celular,
      fotoUrl: user.foto_url || null,
      planTag: user.plan_tag || 'SIN MEMBRESÍA',
      rutinaAsignada,
      fecha_vencimiento: user.fecha_vencimiento,
      dias_inactivo: remaining.daysExpired || 0,
      puede_eliminar_inactivo: Boolean(remaining.canDelete),
      estado_membresia: estadoMembresia,
      estadoMembresia,
      tiempoRestante: remaining.text,
      tiempoRestanteCorto: remaining.cardText,
      diasRestantes: remaining.totalDays,
      trafficColor: remaining.trafficColor,
      nivelFidelidad: fidelity.name,
      canDelete: Boolean(remaining.canDelete),
    };
  });

  let filtered = enrichedList;
  if (search) {
    filtered = filtered.filter((u) =>
      u.apellidos.toLowerCase().includes(search) ||
      u.nombres.toLowerCase().includes(search) ||
      u.dni.includes(search) ||
      (u.username && u.username.toLowerCase().includes(search))
    );
  }
  if (status === 'active') filtered = filtered.filter((u) => u.estadoMembresia === 'ACTIVO');
  else if (status === 'warning') filtered = filtered.filter((u) => u.estadoMembresia === 'POR_VENCER');
  else if (status === 'expired') filtered = filtered.filter((u) => u.estadoMembresia === 'VENCIDO');

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);
  const totalPadron = (allUsers || []).length;
  const tasaActivos = totalPadron > 0 ? Math.round(((activosCount + porVencerCount) / totalPadron) * 100) : 0;

  return c.json({
    total,
    page,
    limit,
    totalPages,
    metrics: {
      total: totalPadron,
      totalPadron,
      activos: activosCount,
      porVencer: porVencerCount,
      vencidos: vencidosCount,
      vencidosPurgables: vencidosPurgablesCount,
      sinRutina: sinRutinaCount,
      tasaActivos: `${tasaActivos}%`,
    },
    users: paginated,
  });
});

app.get('/api/users/:id', async (c) => {
  const currentUser = await getAuthenticatedUser(c);
  if (!currentUser) return c.json({ error: 'No autorizado' }, 401);

  const id = Number(c.req.param('id'));
  if (currentUser.rol === 'MIEMBRO' && currentUser.id !== id) {
    return c.json({ error: 'No tiene permisos para ver el perfil de otro usuario.' }, 403);
  }

  const user = await c.env.DB.prepare(`
    SELECT u.id, u.rol, u.username, u.nombres, u.apellidos, u.dni, u.celular, u.foto_url,
           m.fecha_inicio, m.fecha_vencimiento, m.plan_tag, m.rutina_asignada,
           rp.nombre AS plantilla_nombre,
           f.nivel_actual, f.fecha_inscripcion_original
    FROM usuarios u
    LEFT JOIN membresias m ON m.usuario_id = u.id
    LEFT JOIN miembro_rutinas_asignadas mra ON mra.usuario_id = u.id
    LEFT JOIN rutinas_plantillas rp ON rp.id = mra.rutina_id AND rp.activo = 1
    LEFT JOIN fidelidad f ON f.usuario_id = u.id
    WHERE u.id = ?
  `).bind(id).first();

  if (!user) return c.json({ error: 'Usuario no encontrado' }, 404);

  const isAdmin = currentUser.rol === 'ADMINISTRADOR';
  const remaining = user.fecha_vencimiento ? calculateRemainingTime(user.fecha_vencimiento) : {
    totalDays: 0,
    daysExpired: 99,
    text: 'SIN MEMBRESÍA',
    cardText: 'SIN MEMBRESÍA',
    trafficColor: 'ROJO',
    badgeClass: 'bg-error-container text-on-error',
    canDelete: true,
  };

  const fidelity = user.fecha_inscripcion_original && user.fecha_vencimiento
    ? calculateFidelity(user.fecha_inscripcion_original, user.fecha_vencimiento)
    : { name: 'NOVATO', level: 1, months: 0, progressPercent: 0, nextLevel: 'PRINCIPIANTE', rangeLabel: '< 1 MES', summaryText: 'NIVEL: NOVATO (0 MESES)' };

  const canDelete = Boolean(remaining.canDelete);
  const rutinaReal = user.plantilla_nombre || user.rutina_asignada || 'SIN RUTINA ASIGNADA';
  const planReal = user.plan_tag || 'SIN MEMBRESÍA';

  return c.json({
    id: user.id,
    nombres: user.nombres,
    apellidos: user.apellidos,
    nombreCompleto: `${user.apellidos}, ${user.nombres}`,
    dni: user.dni,
    username: isAdmin ? user.username : null,
    celular: user.celular,
    fotoUrl: user.foto_url || null,
    canDelete,
    puedeEliminar: canDelete,
    user: {
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      dni: user.dni,
      username: isAdmin ? user.username : null,
      celular: user.celular,
      foto_url: user.foto_url,
    },
    remaining: {
      totalDays: remaining.totalDays,
      daysExpired: remaining.daysExpired || 0,
      text: remaining.text,
      cardText: remaining.cardText,
      trafficColor: remaining.trafficColor,
      badgeClass: remaining.badgeClass,
      canDelete: remaining.canDelete,
    },
    fidelity: {
      name: fidelity.name,
      level: fidelity.level,
      rangeLabel: fidelity.rangeLabel,
      months: fidelity.months,
      progressPercent: fidelity.progressPercent,
      nextLevel: fidelity.nextLevel,
      penalized: fidelity.penalized,
      summaryText: fidelity.summaryText,
    },
    membership: {
      estado: remaining.status || 'EXPIRED',
      tiempoRestanteTexto: remaining.text,
      diasRestantes: remaining.totalDays,
      fechaVencimiento: user.fecha_vencimiento,
      fecha_vencimiento: user.fecha_vencimiento,
      plan_tag: planReal,
      rutina_asignada: rutinaReal,
    },
    membresia: {
      estado: remaining.status || 'EXPIRED',
      tiempoRestanteTexto: remaining.text,
      diasRestantes: remaining.totalDays,
      diasVencido: remaining.daysExpired || 0,
      fechaVencimiento: user.fecha_vencimiento,
      planTag: planReal,
      trafficColor: remaining.trafficColor,
    },
    fidelidad: {
      nivel: fidelity.name,
      nivelNumero: fidelity.level,
      tiempoAcumulado: `${fidelity.months} meses de constancia`,
      progresoSiguientePorcentaje: fidelity.progressPercent,
      siguienteNivel: fidelity.nextLevel,
      penalizado: fidelity.penalized,
    },
    rutinaActual: rutinaReal,
  });
});

app.post('/api/users', async (c) => {
  try {
    const currentUser = await getAuthenticatedUser(c);
    if (!currentUser || !['ADMINISTRADOR', 'RECEPCIONISTA'].includes(currentUser.rol)) {
      return c.json({ error: 'Acceso denegado.' }, 403);
    }

    const { fields, files } = await parseRequestPayload(c);
    const tipo = fields.tipo ? String(fields.tipo) : (fields.rol === 'RECEPCIONISTA' ? 'reception' : 'member');
    if (!['reception', 'member'].includes(tipo)) {
      return c.json({ error: "El tipo de usuario debe ser 'reception' o 'member'." }, 400);
    }
    if (tipo === 'reception' && currentUser.rol !== 'ADMINISTRADOR') {
      return c.json({ error: 'Solo un Administrador puede registrar personal de Recepción.' }, 403);
    }

    const { nombres, apellidos, dni, celular, celular_respaldo, domicilio, username, password, numero_operacion, rutina, anios, meses, tipo_pago } = fields;
    if (!nombres || !apellidos || !dni || !celular || !username || !password) {
      return c.json({ error: 'Todos los campos obligatorios deben ser completados.' }, 400);
    }

    const cleanDni = String(dni).trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      return c.json({ error: 'El DNI debe tener exactamente 8 dígitos numéricos.' }, 400);
    }

    const cleanUsername = String(username).trim().startsWith('@')
      ? String(username).trim()
      : `@${String(username).trim()}`;

    const existingDni = await c.env.DB.prepare('SELECT id FROM usuarios WHERE dni = ?').bind(cleanDni).first();
    if (existingDni) {
      return c.json({ error: 'El DNI ya se encuentra registrado en el padrón.' }, 400);
    }

    const existingUser = await c.env.DB.prepare('SELECT id FROM usuarios WHERE username = ? COLLATE NOCASE').bind(cleanUsername).first();
    if (existingUser) {
      return c.json({ error: 'El nombre de usuario ya está en uso. Elija otro.' }, 400);
    }

    const cleanPassword = String(password).trim();
    const passHash = bcrypt.hashSync(cleanPassword, 10);
    const fotoUrl = files.foto || fields.foto_url || null;
    const rol = tipo === 'reception' ? 'RECEPCIONISTA' : 'MIEMBRO';

    const res = await c.env.DB.prepare(`
      INSERT INTO usuarios (rol, username, password_hash, password_plain, nombres, apellidos, dni, celular, celular_respaldo, domicilio, foto_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      rol,
      cleanUsername,
      passHash,
      cleanPassword,
      String(nombres).trim(),
      String(apellidos).trim(),
      cleanDni,
      String(celular).trim(),
      celular_respaldo ? String(celular_respaldo).trim() : null,
      domicilio ? String(domicilio).trim() : null,
      fotoUrl
    ).run();

    const newUserId = Number(res.meta.last_row_id);

    if (rol === 'MIEMBRO') {
      const now = new Date();
      const numYears = Math.max(0, parseInt(anios || 0, 10) || 0);
      const numMonths = Math.max(0, parseInt(meses || 0, 10) || 0);
      const expDate = new Date(now);
      expDate.setFullYear(expDate.getFullYear() + numYears);
      expDate.setMonth(expDate.getMonth() + numMonths);

      const fechaInicioStr = getPeruDateStr(now);
      const fechaVencStr = expDate.toISOString().split('T')[0];
      const tipoPagoUpper = String(tipo_pago || 'EFECTIVO').toUpperCase();
      const voucherUrl = files.voucher || fields.comprobante_url || null;

      if (tipoPagoUpper === 'TRANSFERENCIA' && !voucherUrl) {
        await c.env.DB.prepare('DELETE FROM usuarios WHERE id = ?').bind(newUserId).run();
        return c.json({ error: 'Debe adjuntar obligatoriamente el comprobante/voucher de pago por transferencia.' }, 400);
      }

      let plantillaMatch = null;
      if (rutina) {
        plantillaMatch = await c.env.DB.prepare(`
          SELECT id, nombre FROM rutinas_plantillas
          WHERE activo = 1 AND (CAST(id AS TEXT) = ? OR nombre = ?)
          LIMIT 1
        `).bind(String(rutina).trim(), String(rutina).trim()).first();
      }

      const rutinaNombreFinal = plantillaMatch
        ? plantillaMatch.nombre
        : (rutina && String(rutina).trim() ? String(rutina).trim() : 'Sin rutina asignada');

      await c.env.DB.prepare(`
        INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago, comprobante_url, numero_operacion, plan_tag, rutina_asignada)
        VALUES (?, ?, ?, ?, ?, 'ACTIVO', ?, ?, ?, ?, ?)
      `).bind(
        newUserId,
        fechaInicioStr,
        fechaVencStr,
        numYears,
        numMonths,
        tipoPagoUpper,
        voucherUrl,
        numero_operacion ? String(numero_operacion).trim() : null,
        numYears > 0 ? 'VIP ANUAL' : 'MEMBRESÍA MENSUAL',
        rutinaNombreFinal
      ).run();

      if (plantillaMatch) {
        await c.env.DB.prepare(`
          INSERT INTO miembro_rutinas_asignadas (usuario_id, rutina_id, asignado_por)
          VALUES (?, ?, ?)
          ON CONFLICT(usuario_id) DO UPDATE SET
            rutina_id = excluded.rutina_id,
            asignado_por = excluded.asignado_por,
            fecha_asignacion = CURRENT_TIMESTAMP
        `).bind(newUserId, plantillaMatch.id, currentUser.id).run();
      }

      await c.env.DB.prepare(`
        INSERT INTO fidelidad (usuario_id, fecha_inscripcion_original, meses_continuos, nivel_actual, ultimo_reinicio)
        VALUES (?, ?, 0, 'NOVATO', NULL)
      `).bind(newUserId, fechaInicioStr).run();
    }

    return c.json({
      success: true,
      message: `${rol === 'RECEPCIONISTA' ? 'Personal de recepción' : 'Atleta'} registrado exitosamente con membresía activada.`,
      user: {
        id: newUserId,
        rol,
        dni: cleanDni,
        username: cleanUsername,
      },
    }, 201);
  } catch (err) {
    return c.json({ error: err.message }, 400);
  }
});

app.put('/api/users/:id', async (c) => {
  const currentUser = await getAuthenticatedUser(c);
  if (!currentUser) return c.json({ error: 'No autorizado' }, 401);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const fields = [];
  const binds = [];

  ['nombres', 'apellidos', 'celular', 'celular_respaldo', 'domicilio', 'foto_url'].forEach((f) => {
    if (body[f] !== undefined) {
      fields.push(`${f} = ?`);
      binds.push(typeof body[f] === 'string' ? body[f].trim() : body[f]);
    }
  });

  if (body.password !== undefined && body.password !== null && String(body.password).trim() !== '') {
    const cleanPass = String(body.password).trim();
    if (cleanPass.length < 6) {
      return c.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' }, 400);
    }
    fields.push('password_hash = ?', 'password_plain = ?');
    binds.push(bcrypt.hashSync(cleanPass, 10), cleanPass);
  }

  if (fields.length === 0) return c.json({ success: true, message: 'Sin cambios' });

  fields.push('updated_at = CURRENT_TIMESTAMP');
  binds.push(id);
  await c.env.DB.prepare(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run();
  return c.json({ success: true, message: 'Datos del atleta actualizados correctamente.' });
});

async function handleDeleteUser(c) {
  const currentUser = await getAuthenticatedUser(c);
  if (!currentUser || currentUser.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado. Solo el Administrador puede eliminar usuarios.' }, 403);
  }

  const id = Number(c.req.param('id'));
  const user = await c.env.DB.prepare('SELECT id, nombres, apellidos, dni FROM usuarios WHERE id = ?').bind(id).first();
  if (!user) return c.json({ error: 'Usuario no encontrado.' }, 404);

  const memb = await c.env.DB.prepare('SELECT fecha_vencimiento FROM membresias WHERE usuario_id = ?').bind(id).first();
  if (memb && memb.fecha_vencimiento) {
    const remaining = calculateRemainingTime(memb.fecha_vencimiento);
    if (!remaining.canDelete) {
      return c.json({
        error: 'Bloqueo de seguridad: Este usuario no cumple los requisitos (>30 días de inactividad/vencimiento) para ser purgado.',
      }, 400);
    }
  }

  await c.env.DB.prepare(`
    UPDATE solicitudes_membresia
    SET atleta_nombre_historico = COALESCE(atleta_nombre_historico, ?),
        atleta_dni_historico = COALESCE(atleta_dni_historico, ?)
    WHERE usuario_id = ?
  `).bind(`${user.nombres} ${user.apellidos}`, user.dni, id).run();

  await c.env.DB.prepare('DELETE FROM usuarios WHERE id = ?').bind(id).run();
  return c.json({ success: true, message: `Usuario ${user.nombres} ${user.apellidos} purgado definitivamente de la base de datos.` });
}

app.delete('/api/users/:id/inactivo', handleDeleteUser);
app.delete('/api/users/:id', handleDeleteUser);

// =========================================================================
// 5. PRODUCTOS E INVENTARIO
// =========================================================================
app.get('/api/productos/ventas-turno', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user) return c.json({ error: 'No autorizado' }, 401);

  const today = getPeruDateStr();
  const row = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(total), 0) AS total_ventas,
           COUNT(id) AS total_transacciones
    FROM ventas_productos
    WHERE DATE(created_at, '-5 hours') = ?
      AND estado != 'RECHAZADO'
  `).bind(today).first();

  return c.json({
    total_ventas: parseFloat(Number(row?.total_ventas || 0).toFixed(2)),
    total_transacciones: Number(row?.total_transacciones || 0),
  });
});

app.get('/api/productos', async (c) => {
  const user = await getAuthenticatedUser(c);
  const role = user?.rol || 'INVITADO';
  const { results } = await c.env.DB.prepare('SELECT * FROM productos WHERE activo = 1 ORDER BY id ASC').all();
  const list = (results || []).map((p) => sanitizeProductForRole(p, role)).filter(Boolean);
  return c.json(list);
});

app.post('/api/productos', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado. Solo el Administrador puede agregar productos al inventario.' }, 403);
  }

  const { fields, files } = await parseRequestPayload(c);
  const { nombre, descripcion, precio_venta, precio_costo, stock, categoria, sku } = fields;
  if (!nombre || !String(nombre).trim()) {
    return c.json({ error: 'El nombre del producto es obligatorio' }, 400);
  }
  const pvp = parseFloat(precio_venta);
  const costo = parseFloat(precio_costo || 0);
  const stockQty = parseInt(stock, 10);
  if (Number.isNaN(pvp) || pvp < 0 || Number.isNaN(costo) || costo < 0 || Number.isNaN(stockQty) || stockQty < 0) {
    return c.json({ error: 'Precios o stock inválidos' }, 400);
  }

  const finalSku = sku && String(sku).trim() ? String(sku).trim() : `SKU-${Date.now().toString().slice(-6)}`;
  const imagenUrl = files.imagen || fields.imagen_url || null;

  const res = await c.env.DB.prepare(`
    INSERT INTO productos (sku, nombre, descripcion, precio_venta, precio_costo, stock, categoria, imagen_url, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).bind(
    finalSku,
    String(nombre).trim(),
    descripcion ? String(descripcion).trim() : '',
    pvp,
    costo,
    stockQty,
    categoria || 'GENERAL',
    imagenUrl
  ).run();

  const created = await c.env.DB.prepare('SELECT * FROM productos WHERE id = ?').bind(res.meta.last_row_id).first();
  return c.json({
    message: 'Producto registrado exitosamente en el inventario',
    producto: sanitizeProductForRole(created, 'ADMINISTRADOR'),
  }, 201);
});

app.put('/api/productos/:id', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado. Solo el Administrador puede editar productos.' }, 403);
  }

  const id = Number(c.req.param('id'));
  const existing = await c.env.DB.prepare('SELECT * FROM productos WHERE id = ? AND activo = 1').bind(id).first();
  if (!existing) return c.json({ error: 'Producto no encontrado' }, 404);

  const { fields, files } = await parseRequestPayload(c);
  const nombre = fields.nombre !== undefined ? String(fields.nombre).trim() : existing.nombre;
  const descripcion = fields.descripcion !== undefined ? String(fields.descripcion).trim() : existing.descripcion;
  const precio_venta = fields.precio_venta !== undefined ? parseFloat(fields.precio_venta) : existing.precio_venta;
  const precio_costo = fields.precio_costo !== undefined ? parseFloat(fields.precio_costo) : existing.precio_costo;
  const stock = fields.stock !== undefined ? parseInt(fields.stock, 10) : existing.stock;
  const categoria = fields.categoria !== undefined ? fields.categoria : existing.categoria;
  const imagenUrl = files.imagen || fields.imagen_url || existing.imagen_url;

  await c.env.DB.prepare(`
    UPDATE productos
    SET nombre = ?, descripcion = ?, precio_venta = ?, precio_costo = ?, stock = ?, categoria = ?, imagen_url = ?
    WHERE id = ?
  `).bind(nombre, descripcion, precio_venta, precio_costo, stock, categoria, imagenUrl, id).run();

  const updated = await c.env.DB.prepare('SELECT * FROM productos WHERE id = ?').bind(id).first();
  return c.json({
    message: 'Producto actualizado correctamente',
    producto: sanitizeProductForRole(updated, 'ADMINISTRADOR'),
  });
});

app.delete('/api/productos/:id', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado. Solo el Administrador puede eliminar productos.' }, 403);
  }
  const id = Number(c.req.param('id'));
  await c.env.DB.prepare('UPDATE productos SET activo = 0 WHERE id = ?').bind(id).run();
  return c.json({
    success: true,
    message: 'Producto dado de baja lógicamente del inventario. El histórico se mantiene intacto.',
  });
});

app.post('/api/productos/vender', async (c) => {
  const operator = await getAuthenticatedUser(c);
  if (!operator || !['ADMINISTRADOR', 'RECEPCIONISTA'].includes(operator.rol)) {
    return c.json({ error: 'Acceso denegado.' }, 403);
  }

  const { fields, files } = await parseRequestPayload(c);
  const prodId = Number(fields.producto_id);
  const qty = parseInt(fields.cantidad, 10);
  if (Number.isNaN(qty) || qty <= 0) {
    return c.json({ error: 'La cantidad a vender debe ser mayor a 0' }, 400);
  }

  const payMethod = fields.metodo_pago === 'TRANSFERENCIA' ? 'TRANSFERENCIA' : 'EFECTIVO';
  const comprobanteUrl = files.comprobante || fields.comprobante_url || null;
  if (payMethod === 'TRANSFERENCIA' && !comprobanteUrl && operator.rol === 'RECEPCIONISTA') {
    return c.json({ error: 'La captura de transferencia bancaria es obligatoria en recepción' }, 400);
  }

  const product = await c.env.DB.prepare('SELECT * FROM productos WHERE id = ? AND activo = 1').bind(prodId).first();
  if (!product) return c.json({ error: 'Producto no disponible para la venta' }, 404);
  if (product.stock < qty) {
    return c.json({ error: `Stock insuficiente. Máximo disponible: ${product.stock} unidades.` }, 400);
  }

  await c.env.DB.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?').bind(qty, prodId).run();

  const total = parseFloat((product.precio_venta * qty).toFixed(2));
  const estado = 'PENDIENTE_APROBACION';

  const res = await c.env.DB.prepare(`
    INSERT INTO ventas_productos (producto_id, cantidad, precio_unitario, total, metodo_pago, comprobante_url, operador_id, operador_nombre_historico, estado, resolved_at, resolved_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
  `).bind(
    prodId,
    qty,
    product.precio_venta,
    total,
    payMethod,
    comprobanteUrl,
    operator.id,
    `${operator.nombres} ${operator.apellidos}`,
    estado
  ).run();

  const updatedProduct = await c.env.DB.prepare('SELECT stock FROM productos WHERE id = ?').bind(prodId).first();

  return c.json({
    message: payMethod === 'TRANSFERENCIA'
      ? 'Venta por transferencia registrada. Stock reservado preventivamente; entrega en espera de aprobación del Administrador.'
      : 'Venta en efectivo registrada en mostrador y enviada a la Lista de Cambios y Aprobaciones para arqueo del Administrador.',
    venta: {
      id: Number(res.meta.last_row_id),
      producto_id: prodId,
      cantidad: qty,
      total,
      metodo_pago: payMethod,
      estado,
      despacho_autorizado: payMethod === 'EFECTIVO',
      stock_restante: updatedProduct?.stock ?? 0,
    },
  });
});

// =========================================================================
// 6. PROMOCIONES
// =========================================================================
app.get('/api/promociones/para-miembro', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'MIEMBRO') {
    return c.json({ error: 'Acceso exclusivo para miembros autenticados.' }, 403);
  }

  const fid = await c.env.DB.prepare('SELECT nivel_actual FROM fidelidad WHERE usuario_id = ?').bind(user.id).first();
  const nivelActual = fid?.nivel_actual || 'NOVATO';
  const today = getPeruDateStr();

  const { results } = await c.env.DB.prepare('SELECT * FROM promociones ORDER BY activo DESC, created_at DESC').all();
  const promociones = (results || []).filter((p) => {
    if (p.activo !== 1) return false;
    if (p.fecha_limite && p.fecha_limite < today) return false;
    return canMemberAccessPromo(nivelActual, p.publico_objetivo);
  });

  return c.json({ nivel_actual: nivelActual, promociones });
});

app.get('/api/promociones', async (c) => {
  const user = await getAuthenticatedUser(c);
  const role = user?.rol || 'INVITADO';
  const nivelMiembro = c.req.query('nivel_miembro');
  const today = getPeruDateStr();
  const { results } = await c.env.DB.prepare('SELECT * FROM promociones ORDER BY activo DESC, created_at DESC').all();
  const allRows = results || [];

  if (role === 'MIEMBRO') {
    const fid = await c.env.DB.prepare('SELECT nivel_actual FROM fidelidad WHERE usuario_id = ?').bind(user.id).first();
    const nivelActual = fid?.nivel_actual || 'NOVATO';
    return c.json(allRows.filter((p) => p.activo === 1 && (!p.fecha_limite || p.fecha_limite >= today) && canMemberAccessPromo(nivelActual, p.publico_objetivo)));
  }

  if (nivelMiembro) {
    return c.json(allRows.filter((p) => p.activo === 1 && (!p.fecha_limite || p.fecha_limite >= today) && canMemberAccessPromo(nivelMiembro, p.publico_objetivo)));
  }

  if (role === 'ADMINISTRADOR') {
    return c.json(allRows);
  }

  return c.json(allRows.filter((p) => p.activo === 1));
});

app.post('/api/promociones', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado. Solo el Administrador puede gestionar promociones.' }, 403);
  }

  const { fields, files } = await parseRequestPayload(c);
  const { tipo, nombre, duracion_valor, duracion_unidad, precio, fecha_limite, publico_objetivo } = fields;
  if (!nombre || !String(nombre).trim()) {
    return c.json({ error: 'El nombre de la promoción es obligatorio' }, 400);
  }

  const bannerUrl = files.banner || fields.banner_url || null;
  const res = await c.env.DB.prepare(`
    INSERT INTO promociones (tipo, nombre, duracion_valor, duracion_unidad, precio, fecha_limite, publico_objetivo, banner_url, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).bind(
    tipo || 'TARIFA_FIJA',
    String(nombre).trim(),
    Number(duracion_valor),
    duracion_unidad || 'MESES',
    Number(precio),
    fecha_limite || null,
    publico_objetivo || 'TODOS',
    bannerUrl
  ).run();

  const created = await c.env.DB.prepare('SELECT * FROM promociones WHERE id = ?').bind(res.meta.last_row_id).first();
  return c.json({
    message: 'Promoción creada y publicada exitosamente en el catálogo',
    promocion: created,
  }, 201);
});

app.patch('/api/promociones/:id/archivar', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado. Solo el Administrador puede archivar tarifas.' }, 403);
  }
  const id = Number(c.req.param('id'));
  await c.env.DB.prepare('UPDATE promociones SET activo = 0 WHERE id = ?').bind(id).run();
  return c.json({ success: true, id, activo: 0, message: 'Tarifa archivada correctamente.' });
});

app.patch('/api/promociones/:id/estado', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado. Solo el Administrador puede activar o desactivar promociones.' }, 403);
  }
  const id = Number(c.req.param('id'));
  const b = await c.req.json();
  const activo = b.activo ? 1 : 0;
  await c.env.DB.prepare('UPDATE promociones SET activo = ? WHERE id = ?').bind(activo, id).run();
  return c.json({
    success: true,
    id,
    activo,
    message: activo === 1 ? 'Promoción activada correctamente.' : 'Promoción desactivada correctamente.',
  });
});

// =========================================================================
// 7. MEMBRESÍAS Y APROBACIONES
// =========================================================================
app.get('/api/membresias/buscar/:dni', async (c) => {
  const operator = await getAuthenticatedUser(c);
  if (!operator || !['ADMINISTRADOR', 'RECEPCIONISTA'].includes(operator.rol)) {
    return c.json({ error: 'Acceso denegado.' }, 403);
  }

  const dni = String(c.req.param('dni') || '').trim();
  if (!/^\d{8}$/.test(dni)) {
    return c.json({ error: 'El DNI a consultar debe contener exactamente 8 dígitos' }, 400);
  }

  const usuario = await c.env.DB.prepare(`
    SELECT u.id, u.nombres, u.apellidos, u.dni, u.foto_url, u.rol,
           f.nivel_actual AS nivel_fidelidad
    FROM usuarios u
    LEFT JOIN fidelidad f ON u.id = f.usuario_id
    WHERE u.dni = ?
  `).bind(dni).first();

  if (!usuario) {
    return c.json({ error: `No se encontró ningún atleta con el DNI ${dni}` }, 404);
  }

  const memb = await c.env.DB.prepare(`
    SELECT * FROM membresias
    WHERE usuario_id = ?
    ORDER BY fecha_vencimiento DESC
    LIMIT 1
  `).bind(usuario.id).first();

  const today = getPeruDateStr();
  let diasRestantes = 0;
  let estado = 'VENCIDO';
  let fechaVencimiento = null;
  let planTag = 'SIN MEMBRESÍA';

  if (memb && memb.fecha_vencimiento) {
    fechaVencimiento = memb.fecha_vencimiento;
    planTag = memb.plan_tag || 'MEMBRESÍA ACTIVA';
    diasRestantes = Math.round((new Date(memb.fecha_vencimiento) - new Date(today)) / 86400000);
    estado = diasRestantes > 10 ? 'ACTIVO' : diasRestantes > 0 ? 'POR_VENCER' : 'VENCIDO';
  }

  return c.json({
    usuario,
    membresia_actual: {
      id: memb ? memb.id : null,
      fecha_inicio: memb ? memb.fecha_inicio : today,
      fecha_vencimiento: fechaVencimiento,
      dias_restantes: diasRestantes,
      estado,
      plan_tag: planTag,
    },
  });
});

app.post('/api/membresias/asignar', async (c) => {
  const operator = await getAuthenticatedUser(c);
  if (!operator || !['ADMINISTRADOR', 'RECEPCIONISTA'].includes(operator.rol)) {
    return c.json({ error: 'Acceso denegado.' }, 403);
  }

  const { fields, files } = await parseRequestPayload(c);
  const userId = Number(fields.usuario_id);
  const usuario = await c.env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(userId).first();
  if (!usuario) return c.json({ error: 'Atleta no encontrado' }, 404);

  let diasAgregados = 0;
  let planTag = 'RECARGA MANUAL';
  let promoId = null;

  if (fields.modo === 'PROMO' && fields.promocion_id) {
    promoId = Number(fields.promocion_id);
    const promo = await c.env.DB.prepare('SELECT * FROM promociones WHERE id = ?').bind(promoId).first();
    if (!promo) return c.json({ error: 'Promoción no encontrada' }, 404);
    planTag = promo.nombre;
    if (promo.duracion_unidad === 'MESES') {
      diasAgregados = promo.duracion_valor === 12 ? 365 : promo.duracion_valor * 30;
    } else {
      diasAgregados = promo.duracion_valor;
    }
  } else if (fields.dias) {
    diasAgregados = parseInt(fields.dias, 10);
  } else {
    const qty = parseInt(fields.cantidad_tiempo, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      return c.json({ error: 'La cantidad de tiempo manual debe ser mayor a 0' }, 400);
    }
    const unit = String(fields.unidad_tiempo || 'MESES').toUpperCase();
    if (unit === 'MESES') {
      diasAgregados = qty * 30;
      planTag = `PASE MANUAL (${qty} MESES)`;
    } else {
      diasAgregados = qty;
      planTag = `PASE MANUAL (${qty} DÍAS)`;
    }
  }

  const montoNum = parseFloat(fields.monto);
  if (Number.isNaN(montoNum) || montoNum < 0) {
    return c.json({ error: 'El importe debe ser un número válido en Soles (S/)' }, 400);
  }

  const payMethod = fields.metodo_pago === 'TRANSFERENCIA' ? 'TRANSFERENCIA' : 'EFECTIVO';
  const comprobanteUrl = files.comprobante || fields.comprobante_url || null;
  const isReception = operator.rol === 'RECEPCIONISTA' || fields.origen === 'RECEPCION';

  if (payMethod === 'TRANSFERENCIA' && isReception) {
    if (!comprobanteUrl) {
      return c.json({ error: 'La subida del comprobante es obligatoria para transferencias en Recepción' }, 400);
    }
    const res = await c.env.DB.prepare(`
      INSERT INTO solicitudes_membresia (usuario_id, atleta_nombre_historico, atleta_dni_historico, promocion_id, dias_agregados, monto, metodo_pago, comprobante_url, operador_id, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE_APROBACION')
    `).bind(
      userId,
      `${usuario.nombres} ${usuario.apellidos}`,
      usuario.dni,
      promoId,
      diasAgregados,
      montoNum,
      payMethod,
      comprobanteUrl,
      operator.id
    ).run();

    return c.json({
      message: 'Comprobante de transferencia remitido a la Lista de Cambios y Aprobaciones.',
      transaccion: {
        id: Number(res.meta.last_row_id),
        usuario_id: userId,
        dias_agregados: diasAgregados,
        monto: montoNum,
        metodo_pago: payMethod,
        estado: 'PENDIENTE_APROBACION',
      },
    });
  }

  const memb = await c.env.DB.prepare('SELECT * FROM membresias WHERE usuario_id = ? ORDER BY fecha_vencimiento DESC LIMIT 1').bind(userId).first();
  const today = getPeruDateStr();
  const { newExpirationDate } = calculateNewExpirationDate(memb ? memb.fecha_vencimiento : null, diasAgregados, today);

  if (memb) {
    await c.env.DB.prepare(`
      UPDATE membresias SET fecha_vencimiento = ?, plan_tag = ?, estado = 'ACTIVO' WHERE id = ?
    `).bind(newExpirationDate, planTag, memb.id).run();
  } else {
    await c.env.DB.prepare(`
      INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago, plan_tag)
      VALUES (?, ?, ?, 0, 1, 'ACTIVO', ?, ?)
    `).bind(userId, today, newExpirationDate, payMethod, planTag).run();
  }

  const res = await c.env.DB.prepare(`
    INSERT INTO solicitudes_membresia (usuario_id, atleta_nombre_historico, atleta_dni_historico, promocion_id, dias_agregados, monto, metodo_pago, comprobante_url, operador_id, estado, resolved_at, resolved_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE_APROBACION', NULL, NULL)
  `).bind(
    userId,
    `${usuario.nombres} ${usuario.apellidos}`,
    usuario.dni,
    promoId,
    diasAgregados,
    montoNum,
    payMethod,
    comprobanteUrl,
    operator.id
  ).run();

  const nuevoSaldo = Math.round((new Date(newExpirationDate) - new Date(today)) / 86400000);
  return c.json({
    message: 'Tiempo de membresía registrado y activado en mostrador. Pendiente de verificación de efectivo por Administración.',
    transaccion: {
      id: Number(res.meta.last_row_id),
      usuario_id: userId,
      dias_agregados: diasAgregados,
      monto: montoNum,
      metodo_pago: payMethod,
      estado: 'PENDIENTE_APROBACION',
      nueva_fecha_vencimiento: newExpirationDate,
      nuevo_saldo_dias: nuevoSaldo,
    },
  });
});

app.get('/api/aprobaciones', async (c) => {
  const currentUser = await getAuthenticatedUser(c);
  if (!currentUser || currentUser.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado. Exclusivo para el Administrador.' }, 403);
  }

  const today = getPeruDateStr();

  const { results: membPend } = await c.env.DB.prepare(`
    SELECT sm.id, 'MEMBRESIA' AS tipo_transaccion, sm.usuario_id,
           COALESCE(u.nombres, '') AS atleta_nombres,
           COALESCE(u.apellidos, sm.atleta_nombre_historico, '') AS atleta_apellidos,
           COALESCE(u.dni, sm.atleta_dni_historico, '') AS atleta_dni,
           sm.promocion_id, p.nombre AS promocion_nombre,
           sm.dias_agregados, sm.monto, sm.metodo_pago, sm.comprobante_url,
           sm.operador_id, COALESCE(op.nombres || ' ' || op.apellidos, 'Operador') AS operador_nombre,
           sm.created_at
    FROM solicitudes_membresia sm
    LEFT JOIN usuarios u ON sm.usuario_id = u.id
    LEFT JOIN promociones p ON sm.promocion_id = p.id
    LEFT JOIN usuarios op ON sm.operador_id = op.id
    WHERE sm.estado = 'PENDIENTE_APROBACION'
    ORDER BY sm.created_at ASC
  `).all();

  const { results: ventPend } = await c.env.DB.prepare(`
    SELECT vp.id, 'PRODUCTO' AS tipo_transaccion, vp.producto_id,
           prod.nombre AS producto_nombre, prod.sku AS producto_sku,
           vp.cantidad, vp.precio_unitario, vp.total, vp.metodo_pago, vp.comprobante_url,
           vp.operador_id, COALESCE(op.nombres || ' ' || op.apellidos, vp.operador_nombre_historico, 'Operador') AS operador_nombre,
           vp.created_at
    FROM ventas_productos vp
    JOIN productos prod ON vp.producto_id = prod.id
    LEFT JOIN usuarios op ON vp.operador_id = op.id
    WHERE vp.estado = 'PENDIENTE_APROBACION'
    ORDER BY vp.created_at ASC
  `).all();

  const { results: historialVentas } = await c.env.DB.prepare(`
    SELECT vp.id, 'PRODUCTO' AS tipo_transaccion, vp.producto_id,
           prod.nombre AS producto_nombre, prod.sku AS producto_sku,
           vp.cantidad, vp.precio_unitario, vp.total, vp.metodo_pago, vp.estado,
           COALESCE(op.nombres || ' ' || op.apellidos, vp.operador_nombre_historico, 'Operador') AS operador_nombre,
           vp.created_at, vp.resolved_at
    FROM ventas_productos vp
    JOIN productos prod ON vp.producto_id = prod.id
    LEFT JOIN usuarios op ON vp.operador_id = op.id
    WHERE DATE(vp.created_at, '-5 hours') = ?
    ORDER BY vp.created_at DESC
  `).bind(today).all();

  const { results: historialMembresias } = await c.env.DB.prepare(`
    SELECT sm.id, 'MEMBRESIA' AS tipo_transaccion,
           COALESCE(u.nombres || ' ' || u.apellidos, sm.atleta_nombre_historico, 'Atleta') AS atleta_nombre,
           COALESCE(u.dni, sm.atleta_dni_historico, '') AS atleta_dni,
           sm.dias_agregados, sm.monto, sm.metodo_pago, sm.estado,
           COALESCE(op.nombres || ' ' || op.apellidos, 'Operador') AS operador_nombre,
           sm.created_at, sm.resolved_at
    FROM solicitudes_membresia sm
    LEFT JOIN usuarios u ON sm.usuario_id = u.id
    LEFT JOIN usuarios op ON sm.operador_id = op.id
    WHERE DATE(sm.created_at, '-5 hours') = ?
    ORDER BY sm.created_at DESC
  `).bind(today).all();

  let efectivoHoy = 0;
  let transferenciasHoy = 0;
  (historialVentas || []).filter((v) => v.estado === 'APROBADO').forEach((v) => {
    if (v.metodo_pago === 'EFECTIVO') efectivoHoy += Number(v.total);
    else transferenciasHoy += Number(v.total);
  });
  (historialMembresias || []).filter((m) => m.estado === 'APROBADO').forEach((m) => {
    if (m.metodo_pago === 'EFECTIVO') efectivoHoy += Number(m.monto);
    else transferenciasHoy += Number(m.monto);
  });

  let totalEfectivoPendiente = 0;
  let totalTransferenciaPendiente = 0;
  (membPend || []).forEach((m) => {
    if (m.metodo_pago === 'EFECTIVO') totalEfectivoPendiente += Number(m.monto);
    else totalTransferenciaPendiente += Number(m.monto);
  });
  (ventPend || []).forEach((v) => {
    if (v.metodo_pago === 'EFECTIVO') totalEfectivoPendiente += Number(v.total);
    else totalTransferenciaPendiente += Number(v.total);
  });

  const totalHoy = efectivoHoy + transferenciasHoy;
  return c.json({
    membresias_pendientes: membPend || [],
    ventas_pendientes: ventPend || [],
    resumen_hoy: {
      efectivo_hoy: parseFloat(efectivoHoy.toFixed(2)),
      transferencias_hoy: parseFloat(transferenciasHoy.toFixed(2)),
      total_hoy: parseFloat(totalHoy.toFixed(2)),
    },
    resumen_arqueo: {
      efectivo_hoy: parseFloat(efectivoHoy.toFixed(2)),
      transferencias_hoy: parseFloat(transferenciasHoy.toFixed(2)),
      total_hoy: parseFloat(totalHoy.toFixed(2)),
      total_efectivo_pendiente: totalEfectivoPendiente,
      total_transferencia_pendiente: totalTransferenciaPendiente,
      total_pendiente: totalEfectivoPendiente + totalTransferenciaPendiente,
      total_transacciones_pendientes: (membPend || []).length + (ventPend || []).length,
    },
    historial_hoy: {
      ventas: historialVentas || [],
      membresias: historialMembresias || [],
    },
  });
});

app.post('/api/aprobaciones/:tipo/:id/aprobar', async (c) => {
  const admin = await getAuthenticatedUser(c);
  if (!admin || admin.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado. Exclusivo para el Administrador.' }, 403);
  }

  const tipo = c.req.param('tipo');
  const id = Number(c.req.param('id'));

  if (tipo === 'membresia') {
    const sol = await c.env.DB.prepare('SELECT * FROM solicitudes_membresia WHERE id = ?').bind(id).first();
    if (!sol) return c.json({ error: 'Solicitud de membresía no encontrada' }, 404);
    if (sol.estado !== 'PENDIENTE_APROBACION') {
      return c.json({ error: `La solicitud ya se encuentra en estado ${sol.estado}` }, 400);
    }

    let newEnd = null;
    if (sol.metodo_pago === 'TRANSFERENCIA') {
      const memb = await c.env.DB.prepare('SELECT * FROM membresias WHERE usuario_id = ?').bind(sol.usuario_id).first();
      const today = getPeruDateStr();
      const { newExpirationDate } = calculateNewExpirationDate(memb ? memb.fecha_vencimiento : null, sol.dias_agregados, today);
      newEnd = newExpirationDate;

      if (memb) {
        await c.env.DB.prepare("UPDATE membresias SET fecha_vencimiento = ?, estado = 'ACTIVO' WHERE id = ?").bind(newEnd, memb.id).run();
      } else {
        await c.env.DB.prepare(`
          INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago, plan_tag)
          VALUES (?, ?, ?, 0, 1, 'ACTIVO', 'TRANSFERENCIA', 'RENOVACIÓN POR TRANSFERENCIA')
        `).bind(sol.usuario_id, today, newEnd).run();
      }
    } else {
      const memb = await c.env.DB.prepare('SELECT fecha_vencimiento FROM membresias WHERE usuario_id = ?').bind(sol.usuario_id).first();
      newEnd = memb?.fecha_vencimiento || null;
    }

    await c.env.DB.prepare(`
      UPDATE solicitudes_membresia
      SET estado = 'APROBADO', comprobante_url = 'PURGADO_TRAS_APROBACION', resolved_at = CURRENT_TIMESTAMP, resolved_by = ?
      WHERE id = ?
    `).bind(admin.id, id).run();

    return c.json({
      message: 'Transacción aprobada con éxito. Los beneficios fueron aplicados y el comprobante gráfico ha sido purgado del servidor.',
      id,
      tipo: 'membresia',
      estado: 'APROBADO',
      nueva_fecha_vencimiento: newEnd,
      comprobante_url: 'PURGADO_TRAS_APROBACION',
    });
  }

  if (tipo === 'producto') {
    const venta = await c.env.DB.prepare('SELECT * FROM ventas_productos WHERE id = ?').bind(id).first();
    if (!venta) return c.json({ error: 'Venta no encontrada' }, 404);
    if (venta.estado !== 'PENDIENTE_APROBACION') {
      return c.json({ error: `La venta ya se encuentra en estado ${venta.estado}` }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE ventas_productos
      SET estado = 'APROBADO', comprobante_url = 'PURGADO_TRAS_APROBACION', resolved_at = CURRENT_TIMESTAMP, resolved_by = ?
      WHERE id = ?
    `).bind(admin.id, id).run();

    return c.json({
      message: 'Transacción aprobada con éxito. Los beneficios fueron aplicados y el comprobante gráfico ha sido purgado del servidor.',
      id,
      tipo: 'producto',
      estado: 'APROBADO',
      despacho_autorizado: true,
      comprobante_url: 'PURGADO_TRAS_APROBACION',
    });
  }

  return c.json({ error: 'Tipo de transacción no válido. Use membresia o producto.' }, 400);
});

app.post('/api/aprobaciones/:tipo/:id/rechazar', async (c) => {
  const admin = await getAuthenticatedUser(c);
  if (!admin || admin.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado. Exclusivo para el Administrador.' }, 403);
  }

  const tipo = c.req.param('tipo');
  const id = Number(c.req.param('id'));

  if (tipo === 'membresia') {
    const sol = await c.env.DB.prepare('SELECT * FROM solicitudes_membresia WHERE id = ?').bind(id).first();
    if (!sol) return c.json({ error: 'Solicitud de membresía no encontrada' }, 404);
    if (sol.estado !== 'PENDIENTE_APROBACION') {
      return c.json({ error: `La solicitud ya se encuentra en estado ${sol.estado}` }, 400);
    }

    const memb = await c.env.DB.prepare('SELECT * FROM membresias WHERE usuario_id = ?').bind(sol.usuario_id).first();
    if (memb && memb.fecha_vencimiento && (sol.metodo_pago === 'EFECTIVO' || sol.operador_id === admin.id)) {
      const currentEnd = new Date(memb.fecha_vencimiento);
      const revertedEnd = new Date(currentEnd.getTime() - sol.dias_agregados * 86400000).toISOString().split('T')[0];
      const today = getPeruDateStr();
      const newEstado = revertedEnd >= today ? 'ACTIVO' : 'VENCIDO';
      await c.env.DB.prepare('UPDATE membresias SET fecha_vencimiento = ?, estado = ? WHERE id = ?').bind(revertedEnd, newEstado, memb.id).run();
    }

    await c.env.DB.prepare('DELETE FROM solicitudes_membresia WHERE id = ?').bind(id).run();
    return c.json({
      message: 'Transacción rechazada correctamente.',
      id,
      tipo: 'membresia',
      estado: 'RECHAZADO',
      eliminado: true,
    });
  }

  if (tipo === 'producto') {
    const venta = await c.env.DB.prepare('SELECT * FROM ventas_productos WHERE id = ?').bind(id).first();
    if (!venta) return c.json({ error: 'Venta no encontrada' }, 404);
    if (venta.estado !== 'PENDIENTE_APROBACION') {
      return c.json({ error: `La venta ya se encuentra en estado ${venta.estado}` }, 400);
    }

    await c.env.DB.prepare('UPDATE productos SET stock = stock + ? WHERE id = ?').bind(venta.cantidad, venta.producto_id).run();
    await c.env.DB.prepare('DELETE FROM ventas_productos WHERE id = ?').bind(id).run();
    return c.json({
      message: 'Transacción rechazada correctamente.',
      id,
      tipo: 'producto',
      estado: 'RECHAZADO',
      stock_restaurado: true,
      eliminado: true,
    });
  }

  return c.json({ error: 'Tipo de transacción no válido.' }, 400);
});

// =========================================================================
// 8. RUTINAS SEMANALES, MÁQUINAS Y RUTINAS PRIVADAS
// =========================================================================
async function hydratePlantillaD1(db, plantilla, ajustesMap = null) {
  if (!plantilla) return null;
  const { results: diasRows } = await db.prepare(`
    SELECT id, dia_semana, enfoque_muscular, orden_dia
    FROM rutinas_dias
    WHERE rutina_id = ?
    ORDER BY orden_dia ASC
  `).bind(plantilla.id).all();

  let totalEjercicios = 0;
  const diasMap = new Map();

  for (const d of (diasRows || [])) {
    const { results: exRows } = await db.prepare(`
      SELECT re.id, re.maquina_id, m.numero_maquina, m.codigo_etiqueta, m.nombre, m.grupo_muscular,
             re.orden_secuencial, re.series, re.repeticiones, re.tiempo_descanso_segundos
      FROM rutinas_ejercicios re
      JOIN maquinas_ejercicios m ON re.maquina_id = m.id
      WHERE re.rutina_dia_id = ?
      ORDER BY re.orden_secuencial ASC
    `).bind(d.id).all();

    const ejercicios = (exRows || []).map((ex) => {
      const ajuste = ajustesMap ? ajustesMap.get(ex.id) : null;
      return {
        ...ex,
        series_original: ex.series,
        descanso_original: ex.tiempo_descanso_segundos,
        series: ajuste?.series_custom ?? ex.series,
        tiempo_descanso_segundos: ajuste?.descanso_custom_segundos ?? ex.tiempo_descanso_segundos,
        personalizado: Boolean(ajuste),
      };
    });

    totalEjercicios += ejercicios.length;
    diasMap.set(d.dia_semana, {
      id: d.id,
      dia_semana: d.dia_semana,
      enfoque_muscular: ejercicios.length === 0 ? 'REST' : (d.enfoque_muscular || 'GENERAL'),
      orden_dia: d.orden_dia,
      ejercicios,
    });
  }

  const diasCompletos = DIAS_SEMANA.map((dia, idx) => {
    if (diasMap.has(dia)) return diasMap.get(dia);
    return { id: null, dia_semana: dia, enfoque_muscular: 'REST', orden_dia: idx + 1, ejercicios: [] };
  });

  return {
    id: plantilla.id,
    nombre: plantilla.nombre,
    descripcion: plantilla.descripcion || '',
    total_ejercicios: totalEjercicios,
    created_at: plantilla.created_at,
    dias: diasCompletos,
  };
}

async function saveRoutineDaysD1(db, rutinaId, dias = []) {
  const diasInputMap = new Map();
  if (Array.isArray(dias)) {
    for (const d of dias) {
      if (d?.dia_semana) diasInputMap.set(String(d.dia_semana).toUpperCase(), d);
    }
  }

  for (let idx = 0; idx < DIAS_SEMANA.length; idx++) {
    const diaNombre = DIAS_SEMANA[idx];
    const payloadDia = diasInputMap.get(diaNombre);
    const ejercicios = Array.isArray(payloadDia?.ejercicios) ? payloadDia.ejercicios : [];
    const enfoque = ejercicios.length === 0
      ? 'REST'
      : String(payloadDia?.enfoque_muscular || 'GENERAL').trim() || 'GENERAL';

    const diaRes = await db.prepare(`
      INSERT INTO rutinas_dias (rutina_id, dia_semana, enfoque_muscular, orden_dia)
      VALUES (?, ?, ?, ?)
    `).bind(rutinaId, diaNombre, enfoque, idx + 1).run();

    const diaId = Number(diaRes.meta.last_row_id);
    for (let i = 0; i < ejercicios.length; i++) {
      const ex = ejercicios[i];
      await db.prepare(`
        INSERT INTO rutinas_ejercicios (rutina_dia_id, maquina_id, orden_secuencial, series, repeticiones, tiempo_descanso_segundos)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        diaId,
        Number(ex.maquina_id),
        i + 1,
        Math.max(1, parseInt(ex.series, 10) || 4),
        String(ex.repeticiones || '8-12').trim(),
        Math.max(0, parseInt(ex.tiempo_descanso_segundos, 10) || 90)
      ).run();
    }
  }
}

app.get('/api/rutinas/maquinas', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user) return c.json({ error: 'No autorizado' }, 401);
  const { results } = await c.env.DB.prepare('SELECT * FROM maquinas_ejercicios ORDER BY numero_maquina ASC').all();
  return c.json({ maquinas: results || [] });
});

app.get('/api/rutinas/plantillas', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || !['ADMINISTRADOR', 'RECEPCIONISTA'].includes(user.rol)) {
    return c.json({ error: 'Acceso denegado.' }, 403);
  }
  const { results: rows } = await c.env.DB.prepare('SELECT * FROM rutinas_plantillas WHERE activo = 1 ORDER BY id DESC').all();
  const plantillas = [];
  for (const r of (rows || [])) {
    plantillas.push(await hydratePlantillaD1(c.env.DB, r));
  }
  return c.json({ plantillas });
});

app.post('/api/rutinas/plantillas', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado.' }, 403);
  }
  const b = await c.req.json();
  if (!b.nombre || !String(b.nombre).trim()) {
    return c.json({ error: 'El nombre de la rutina es obligatorio' }, 400);
  }

  const res = await c.env.DB.prepare(`
    INSERT INTO rutinas_plantillas (nombre, descripcion, created_by, activo)
    VALUES (?, ?, ?, 1)
  `).bind(String(b.nombre).trim(), b.descripcion ? String(b.descripcion).trim() : '', user.id).run();

  const rutinaId = Number(res.meta.last_row_id);
  await saveRoutineDaysD1(c.env.DB, rutinaId, b.dias || []);

  const row = await c.env.DB.prepare('SELECT * FROM rutinas_plantillas WHERE id = ?').bind(rutinaId).first();
  const plantilla = await hydratePlantillaD1(c.env.DB, row);
  return c.json({ message: 'Rutina guardada correctamente', plantilla }, 201);
});

app.put('/api/rutinas/plantillas/:id', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado.' }, 403);
  }
  const rutinaId = Number(c.req.param('id'));
  const existing = await c.env.DB.prepare('SELECT * FROM rutinas_plantillas WHERE id = ? AND activo = 1').bind(rutinaId).first();
  if (!existing) return c.json({ error: 'Plantilla de rutina no encontrada' }, 404);

  const b = await c.req.json();
  if (!b.nombre || !String(b.nombre).trim()) {
    return c.json({ error: 'El nombre de la rutina es obligatorio' }, 400);
  }

  await c.env.DB.prepare('UPDATE rutinas_plantillas SET nombre = ?, descripcion = ? WHERE id = ?')
    .bind(String(b.nombre).trim(), b.descripcion ? String(b.descripcion).trim() : '', rutinaId).run();

  await c.env.DB.prepare('DELETE FROM rutinas_dias WHERE rutina_id = ?').bind(rutinaId).run();
  await saveRoutineDaysD1(c.env.DB, rutinaId, b.dias || []);

  const updated = await c.env.DB.prepare('SELECT * FROM rutinas_plantillas WHERE id = ?').bind(rutinaId).first();
  const plantilla = await hydratePlantillaD1(c.env.DB, updated);
  return c.json({ message: 'Rutina actualizada correctamente', plantilla });
});

app.get('/api/rutinas/buscar-atleta/:dni', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || !['ADMINISTRADOR', 'RECEPCIONISTA'].includes(user.rol)) {
    return c.json({ error: 'Acceso denegado.' }, 403);
  }
  const cleanDni = String(c.req.param('dni') || '').trim();
  const row = await c.env.DB.prepare(`
    SELECT u.id, u.nombres, u.apellidos, u.dni, u.foto_url,
           f.nivel_actual,
           mra.rutina_id,
           rp.nombre AS plantilla_nombre,
           (SELECT m.rutina_asignada FROM membresias m WHERE m.usuario_id = u.id ORDER BY m.id DESC LIMIT 1) AS membresia_rutina_texto
    FROM usuarios u
    LEFT JOIN fidelidad f ON f.usuario_id = u.id
    LEFT JOIN miembro_rutinas_asignadas mra ON mra.usuario_id = u.id
    LEFT JOIN rutinas_plantillas rp ON rp.id = mra.rutina_id AND rp.activo = 1
    WHERE u.dni = ? AND u.rol = 'MIEMBRO'
    LIMIT 1
  `).bind(cleanDni).first();

  if (!row) {
    return c.json({ error: 'No se encontró ningún miembro registrado con ese DNI.' }, 404);
  }

  const rutinaNombre = row.plantilla_nombre || (
    row.membresia_rutina_texto && row.membresia_rutina_texto !== 'SIN RUTINA ASIGNADA'
      ? row.membresia_rutina_texto
      : null
  );

  return c.json({
    atleta: {
      id: row.id,
      nombres: row.nombres,
      apellidos: row.apellidos,
      dni: row.dni,
      foto_url: row.foto_url || null,
      nivel_actual: row.nivel_actual || 'NOVATO',
      rutina_id: row.rutina_id || null,
      rutina_nombre: rutinaNombre || 'Sin rutina asignada',
      rutina_etiqueta: `rutina: ${rutinaNombre || 'Sin rutina asignada'}`,
    },
  });
});

app.put('/api/rutinas/asignar', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || !['ADMINISTRADOR', 'RECEPCIONISTA'].includes(user.rol)) {
    return c.json({ error: 'Acceso denegado.' }, 403);
  }
  const b = await c.req.json();
  const atleta = await c.env.DB.prepare("SELECT id, nombres, apellidos FROM usuarios WHERE id = ? AND rol = 'MIEMBRO'").bind(Number(b.usuario_id)).first();
  if (!atleta) return c.json({ error: 'Atleta no encontrado' }, 400);

  const plantilla = await c.env.DB.prepare('SELECT id, nombre FROM rutinas_plantillas WHERE id = ? AND activo = 1').bind(Number(b.rutina_id)).first();
  if (!plantilla) return c.json({ error: 'Plantilla de rutina no encontrada' }, 400);

  await c.env.DB.prepare(`
    INSERT INTO miembro_rutinas_asignadas (usuario_id, rutina_id, asignado_por)
    VALUES (?, ?, ?)
    ON CONFLICT(usuario_id) DO UPDATE SET
      rutina_id = excluded.rutina_id,
      asignado_por = excluded.asignado_por,
      fecha_asignacion = CURRENT_TIMESTAMP
  `).bind(atleta.id, plantilla.id, user.id).run();

  await c.env.DB.prepare('UPDATE membresias SET rutina_asignada = ? WHERE usuario_id = ?').bind(plantilla.nombre, atleta.id).run();

  return c.json({
    message: 'Rutina asignada exitosamente.',
    usuario_id: atleta.id,
    rutina_id: plantilla.id,
    rutina_nombre: plantilla.nombre,
    rutina_etiqueta: `rutina: ${plantilla.nombre}`,
  });
});

app.get('/api/rutinas/mi-rutina', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'MIEMBRO') {
    return c.json({ error: 'Acceso exclusivo para miembros.' }, 403);
  }

  const asignacion = await c.env.DB.prepare(`
    SELECT rp.*
    FROM miembro_rutinas_asignadas mra
    JOIN rutinas_plantillas rp ON mra.rutina_id = rp.id
    WHERE mra.usuario_id = ? AND rp.activo = 1
    LIMIT 1
  `).bind(user.id).first();

  let rutinaAsignada = null;
  if (asignacion) {
    const { results: ajustesRows } = await c.env.DB.prepare(`
      SELECT rutina_ejercicio_id, series_custom, descanso_custom_segundos
      FROM miembro_rutina_ajustes
      WHERE usuario_id = ?
    `).bind(user.id).all();
    const ajustesMap = new Map((ajustesRows || []).map((a) => [a.rutina_ejercicio_id, a]));
    rutinaAsignada = await hydratePlantillaD1(c.env.DB, asignacion, ajustesMap);
  }

  const { results: privadasRows } = await c.env.DB.prepare(`
    SELECT id, nombre, contenido_json, created_at, updated_at
    FROM miembro_rutinas_privadas
    WHERE usuario_id = ?
    ORDER BY created_at DESC, id DESC
  `).bind(user.id).all();

  const rutinasPrivadas = (privadasRows || []).map((row) => {
    let dias = [];
    try { dias = JSON.parse(row.contenido_json); } catch { dias = []; }
    return { id: row.id, nombre: row.nombre, dias, privada: true, created_at: row.created_at };
  });

  return c.json({ rutina_asignada: rutinaAsignada, rutinas_privadas: rutinasPrivadas });
});

app.patch('/api/rutinas/mi-rutina/ajustar-ejercicio', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'MIEMBRO') return c.json({ error: 'Acceso exclusivo para miembros.' }, 403);
  const b = await c.req.json();
  const ejId = Number(b.rutina_ejercicio_id);
  const ejercicio = await c.env.DB.prepare('SELECT id, series, tiempo_descanso_segundos FROM rutinas_ejercicios WHERE id = ?').bind(ejId).first();
  if (!ejercicio) return c.json({ error: 'Ejercicio de rutina no encontrado' }, 400);

  const seriesNum = b.series_custom !== undefined && b.series_custom !== null
    ? Math.max(1, parseInt(b.series_custom, 10))
    : ejercicio.series;
  const descansoNum = b.descanso_custom_segundos !== undefined && b.descanso_custom_segundos !== null
    ? Math.max(0, parseInt(b.descanso_custom_segundos, 10))
    : ejercicio.tiempo_descanso_segundos;

  await c.env.DB.prepare(`
    INSERT INTO miembro_rutina_ajustes (usuario_id, rutina_ejercicio_id, series_custom, descanso_custom_segundos)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(usuario_id, rutina_ejercicio_id) DO UPDATE SET
      series_custom = excluded.series_custom,
      descanso_custom_segundos = excluded.descanso_custom_segundos,
      updated_at = CURRENT_TIMESTAMP
  `).bind(user.id, ejId, seriesNum, descansoNum).run();

  return c.json({
    message: 'Ajustes de entrenamiento guardados.',
    rutina_ejercicio_id: ejId,
    series: seriesNum,
    tiempo_descanso_segundos: descansoNum,
  });
});

app.post('/api/rutinas/privadas', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'MIEMBRO') return c.json({ error: 'Acceso exclusivo para miembros.' }, 403);
  const b = await c.req.json();
  if (!b.nombre || !String(b.nombre).trim()) {
    return c.json({ error: 'El nombre de tu rutina personal es obligatorio' }, 400);
  }

  const diasMap = new Map();
  if (Array.isArray(b.dias)) {
    for (const d of b.dias) {
      if (d?.dia_semana) diasMap.set(String(d.dia_semana).toUpperCase(), d);
    }
  }

  const normalizedDias = DIAS_SEMANA.map((diaNombre, idx) => {
    const d = diasMap.get(diaNombre);
    const rawExs = Array.isArray(d?.ejercicios) ? d.ejercicios : [];
    const ejercicios = rawExs.map((ex, i) => ({
      maquina_id: Number(ex.maquina_id),
      numero_maquina: ex.numero_maquina,
      codigo_etiqueta: ex.codigo_etiqueta,
      nombre: ex.nombre,
      grupo_muscular: ex.grupo_muscular,
      orden_secuencial: i + 1,
      series: Math.max(1, parseInt(ex.series, 10) || 4),
      repeticiones: String(ex.repeticiones || '8-12').trim(),
      tiempo_descanso_segundos: Math.max(0, parseInt(ex.tiempo_descanso_segundos, 10) || 90),
    }));
    return {
      dia_semana: diaNombre,
      enfoque_muscular: ejercicios.length === 0 ? 'REST' : (d?.enfoque_muscular || 'PERSONAL'),
      orden_dia: idx + 1,
      ejercicios,
    };
  });

  const cleanNombre = String(b.nombre).trim();
  const res = await c.env.DB.prepare(`
    INSERT INTO miembro_rutinas_privadas (usuario_id, nombre, contenido_json)
    VALUES (?, ?, ?)
  `).bind(user.id, cleanNombre, JSON.stringify(normalizedDias)).run();

  return c.json({
    message: 'Rutina personal privada guardada.',
    rutina: { id: Number(res.meta.last_row_id), nombre: cleanNombre, dias: normalizedDias, privada: true },
  }, 201);
});

app.delete('/api/rutinas/privadas/:id', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'MIEMBRO') return c.json({ error: 'Acceso exclusivo para miembros.' }, 403);
  const id = Number(c.req.param('id'));
  const res = await c.env.DB.prepare('DELETE FROM miembro_rutinas_privadas WHERE id = ? AND usuario_id = ?').bind(id, user.id).run();
  if (!res.meta?.changes) return c.json({ error: 'Rutina privada no encontrada' }, 404);
  return c.json({ message: 'Rutina personal eliminada' });
});

// =========================================================================
// 9. ALERTAS COACH EN TIEMPO REAL
// =========================================================================
app.get('/api/alertas-coach/pendientes', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || !['ADMINISTRADOR', 'RECEPCIONISTA'].includes(user.rol)) {
    return c.json({ error: 'Acceso denegado.' }, 403);
  }
  const { results } = await c.env.DB.prepare(`
    SELECT a.*, u.nombres || ' ' || u.apellidos AS atleta_nombre, u.dni AS atleta_dni
    FROM alertas_coach a
    JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.estado = 'PENDIENTE'
    ORDER BY a.created_at ASC
  `).all();
  return c.json({ alertas: results || [] });
});

app.get('/api/alertas-coach/mi-alerta', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user) return c.json({ error: 'No autorizado' }, 401);
  const alerta = await c.env.DB.prepare(`
    SELECT * FROM alertas_coach
    WHERE usuario_id = ? AND estado = 'PENDIENTE'
    ORDER BY created_at DESC LIMIT 1
  `).bind(user.id).first();
  return c.json({ alerta: alerta || null });
});

app.post('/api/alertas-coach', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user) return c.json({ error: 'No autorizado' }, 401);
  const b = await c.req.json();

  const prev = await c.env.DB.prepare("SELECT id FROM alertas_coach WHERE usuario_id = ? AND estado = 'PENDIENTE'").bind(user.id).first();
  if (prev) return c.json({ error: 'Ya tienes una alerta pendiente activa.' }, 409);

  const res = await c.env.DB.prepare(`
    INSERT INTO alertas_coach (usuario_id, maquina_numero, motivo, estado)
    VALUES (?, ?, ?, 'PENDIENTE')
  `).bind(user.id, String(b.maquina_numero || '15'), b.motivo || 'Asistencia en sala').run();

  const created = await c.env.DB.prepare('SELECT * FROM alertas_coach WHERE id = ?').bind(res.meta.last_row_id).first();
  return c.json({ success: true, id: res.meta.last_row_id, alerta: created }, 201);
});

app.patch('/api/alertas-coach/:id/atender', async (c) => {
  const id = Number(c.req.param('id'));
  const user = await getAuthenticatedUser(c);
  await c.env.DB.prepare("UPDATE alertas_coach SET estado = 'ATENDIDA', atendido_por = ?, atendido_at = CURRENT_TIMESTAMP WHERE id = ?").bind(user?.id || 1, id).run();
  return c.json({ success: true });
});

app.patch('/api/alertas-coach/:id/cancelar', async (c) => {
  const id = Number(c.req.param('id'));
  await c.env.DB.prepare("UPDATE alertas_coach SET estado = 'CANCELADA' WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// =========================================================================
// 10. AYUDA CON IA (GOOGLE GEMINI CON CONTEXTO REAL DE RUTINA EN D1)
// =========================================================================
const handleAyudaIa = async (c) => {
  let b = {};
  try { b = await c.req.json(); } catch { b = {}; }
  const mensaje = String(b.mensaje || b.pregunta || '').trim();
  const user = await getAuthenticatedUser(c);

  if (!mensaje) {
    return c.json({ error: 'El mensaje de consulta no puede estar vacío.' }, 400);
  }

  const apiKey = String(c.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'tu_api_key_de_gemini_aqui') {
    return c.json({
      respuesta: '¡Hola! Para consultas en sala puedes pedir asistencia a nuestro coach de turno. Configura tu GEMINI_API_KEY en Cloudflare Secrets para habilitar la IA avanzada.',
      fuente: 'local_fallback',
    });
  }

  const hoyPeru = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Lima',
  });

  let rutinaContext = 'Sin rutina oficial asignada todavía.';
  if (user) {
    const asignacion = await c.env.DB.prepare(`
      SELECT rp.*
      FROM miembro_rutinas_asignadas mra
      JOIN rutinas_plantillas rp ON mra.rutina_id = rp.id
      WHERE mra.usuario_id = ? AND rp.activo = 1
      LIMIT 1
    `).bind(user.id).first();
    if (asignacion) {
      const hydrated = await hydratePlantillaD1(c.env.DB, asignacion);
      rutinaContext = `${hydrated.nombre}: ` + hydrated.dias.map((d) =>
        `${d.dia_semana} (${d.enfoque_muscular}): ${d.ejercicios.map((e) => `${e.codigo_etiqueta} ${e.nombre} ${e.series}x${e.repeticiones}`).join(', ') || 'Descanso'}`
      ).join(' | ');
    }
  }

  const memberName = user ? `${user.nombres} ${user.apellidos}` : 'Atleta';
  const systemInstruction = `Eres el entrenador asistente táctico de IA de GymAdminPro para el atleta ${memberName}.
Hoy es: ${hoyPeru}.
Rutina del atleta: ${rutinaContext}
REGLAS OBLIGATORIAS:
1. Responde siempre en español de Perú, con tono motivador, técnico, conciso y profesional.
2. Si el miembro pregunta qué le toca entrenar "hoy", responde con los ejercicios exactos correspondientes a hoy (${hoyPeru}) según su rutina.
3. Si hoy es domingo o su día dice REST, indícale amablemente que corresponde descanso muscular.
4. Si consulta por máquinas alternativas ante congestión en sala, sugiere máquinas equivalentes de musculación.`;

  const models = [
    c.env.GEMINI_MODEL || 'gemini-2.5-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
  ];

  let answer = null;
  let usedModel = null;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: mensaje }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { maxOutputTokens: 600, temperature: 0.6 },
        }),
        signal: AbortSignal.timeout(28000),
      });
      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          answer = candidate.trim();
          usedModel = model;
          break;
        }
      }
    } catch {
      // Siguiente modelo en caso de error
    }
  }

  if (answer) {
    return c.json({ respuesta: answer, modelo: usedModel, fuente: 'google_gemini', timestamp: new Date().toISOString() });
  }
  return c.json({
    respuesta: 'El asistente de IA está con alta demanda en este momento. Por favor, intenta de nuevo en unos segundos.',
    fuente: 'alta_demanda',
  });
};

app.post('/api/miembro/ayuda-ia', handleAyudaIa);
app.post('/api/asistente-ia/consultar', handleAyudaIa);

// =========================================================================
// 11. REPORTES Y DASHBOARD ADMINISTRATIVO (1:1 CON EXPRESS)
// =========================================================================
app.get('/api/reportes/dashboard', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado. Exclusivo para el Administrador.' }, 403);
  }

  const today = getPeruDateStr();
  const monthPrefix = today.slice(0, 7);

  const ingresosMemb = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(monto), 0) AS total
    FROM solicitudes_membresia
    WHERE estado = 'APROBADO' AND DATE(created_at, '-5 hours') = ?
  `).bind(today).first();

  const ingresosProd = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(total), 0) AS total
    FROM ventas_productos
    WHERE estado = 'APROBADO' AND DATE(created_at, '-5 hours') = ?
  `).bind(today).first();

  const membTotal = Number(ingresosMemb?.total || 0);
  const prodTotal = Number(ingresosProd?.total || 0);

  const activosRow = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT usuario_id) AS total FROM membresias WHERE fecha_vencimiento >= ?
  `).bind(today).first();

  const porVencerRow = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT usuario_id) AS total
    FROM membresias
    WHERE fecha_vencimiento >= ? AND (julianday(fecha_vencimiento) - julianday(?)) <= 10
  `).bind(today, today).first();

  const nuevosMesRow = await c.env.DB.prepare(`
    SELECT COUNT(*) AS total FROM usuarios
    WHERE rol = 'MIEMBRO' AND strftime('%Y-%m', created_at, '-5 hours') = ?
  `).bind(monthPrefix).first();

  const stockCriticoCountRow = await c.env.DB.prepare(`
    SELECT COUNT(*) AS total FROM productos WHERE activo = 1 AND stock < 5
  `).first();

  const { results: productosCriticos } = await c.env.DB.prepare(`
    SELECT id, sku, nombre, stock, precio_venta
    FROM productos WHERE activo = 1 AND stock < 5
    ORDER BY stock ASC, nombre ASC LIMIT 4
  `).all();

  const { results: pendingMemb } = await c.env.DB.prepare(`
    SELECT sm.id, 'MEMBRESIA' AS tipo, sm.monto, sm.metodo_pago, sm.created_at,
           COALESCE(u.nombres || ' ' || u.apellidos, sm.atleta_nombre_historico, 'Atleta') AS concepto,
           'Renovación' AS subtitulo
    FROM solicitudes_membresia sm
    LEFT JOIN usuarios u ON sm.usuario_id = u.id
    WHERE sm.estado = 'PENDIENTE_APROBACION'
    ORDER BY sm.created_at DESC LIMIT 4
  `).all();

  const { results: pendingProd } = await c.env.DB.prepare(`
    SELECT vp.id, 'PRODUCTO' AS tipo, vp.total AS monto, vp.metodo_pago, vp.created_at,
           prod.nombre AS concepto, (vp.cantidad || ' unid. vendidas') AS subtitulo
    FROM ventas_productos vp
    JOIN productos prod ON vp.producto_id = prod.id
    WHERE vp.estado = 'PENDIENTE_APROBACION'
    ORDER BY vp.created_at DESC LIMIT 4
  `).all();

  const pendCount = await c.env.DB.prepare(`
    SELECT (SELECT COUNT(*) FROM solicitudes_membresia WHERE estado = 'PENDIENTE_APROBACION') +
           (SELECT COUNT(*) FROM ventas_productos WHERE estado = 'PENDIENTE_APROBACION') AS total
  `).first();

  return c.json({
    fecha: today,
    ingresos_hoy: {
      total: parseFloat((membTotal + prodTotal).toFixed(2)),
      membresias: parseFloat(membTotal.toFixed(2)),
      productos: parseFloat(prodTotal.toFixed(2)),
    },
    atletas: {
      total_activos: Number(activosRow?.total || 0),
      por_vencer_10d: Number(porVencerRow?.total || 0),
      nuevos_este_mes: Number(nuevosMesRow?.total || 0),
    },
    stock_critico: {
      total_items: Number(stockCriticoCountRow?.total || 0),
      items: productosCriticos || [],
    },
    aprobaciones: {
      total_pendientes: Number(pendCount?.total || 0),
      recientes: [...(pendingMemb || []), ...(pendingProd || [])].slice(0, 4),
    },
  });
});

app.get('/api/reportes/diario', async (c) => {
  const user = await getAuthenticatedUser(c);
  if (!user || user.rol !== 'ADMINISTRADOR') {
    return c.json({ error: 'Acceso denegado. Exclusivo para el Administrador.' }, 403);
  }

  const fechaParam = c.req.query('fecha');
  const targetDate = fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam) ? fechaParam : getPeruDateStr();

  const { results: membresiasTrans } = await c.env.DB.prepare(`
    SELECT sm.id,
           COALESCE(u.nombres || ' ' || u.apellidos, sm.atleta_nombre_historico, 'Atleta no especificado') AS atleta_nombre,
           COALESCE(u.dni, sm.atleta_dni_historico, '00000000') AS atleta_dni,
           COALESCE(p.nombre, 'Membresía ' || sm.dias_agregados || ' días') AS plan_nombre,
           sm.dias_agregados, sm.monto, sm.metodo_pago,
           strftime('%H:%M', sm.created_at, '-5 hours') AS hora, sm.estado
    FROM solicitudes_membresia sm
    LEFT JOIN usuarios u ON sm.usuario_id = u.id
    LEFT JOIN promociones p ON sm.promocion_id = p.id
    WHERE sm.estado = 'APROBADO' AND DATE(sm.created_at, '-5 hours') = ?
    ORDER BY sm.created_at ASC
  `).bind(targetDate).all();

  const totalMembresias = (membresiasTrans || []).reduce((s, x) => s + Number(x.monto), 0);

  const { results: nuevosUsuarios } = await c.env.DB.prepare(`
    SELECT id, nombres, apellidos, dni, celular, strftime('%H:%M', created_at, '-5 hours') AS hora
    FROM usuarios
    WHERE rol = 'MIEMBRO' AND DATE(created_at, '-5 hours') = ?
    ORDER BY created_at ASC
  `).bind(targetDate).all();

  const { results: ventasRaw } = await c.env.DB.prepare(`
    SELECT vp.id, vp.producto_id, prod.nombre AS producto_nombre, prod.sku AS producto_sku,
           vp.cantidad, vp.precio_unitario, prod.precio_costo, vp.total, vp.metodo_pago,
           strftime('%H:%M', vp.created_at, '-5 hours') AS hora
    FROM ventas_productos vp
    JOIN productos prod ON vp.producto_id = prod.id
    WHERE vp.estado = 'APROBADO' AND DATE(vp.created_at, '-5 hours') = ?
    ORDER BY vp.created_at ASC
  `).bind(targetDate).all();

  const totalProductos = (ventasRaw || []).reduce((s, v) => s + Number(v.total), 0);
  const costoTotal = (ventasRaw || []).reduce((s, v) => s + (Number(v.cantidad) * Number(v.precio_costo || 0)), 0);
  const gananciaNeta = totalProductos - costoTotal;

  const grouped = new Map();
  for (const v of (ventasRaw || [])) {
    if (!grouped.has(v.producto_id)) {
      grouped.set(v.producto_id, {
        producto_id: v.producto_id,
        nombre: v.producto_nombre,
        sku: v.producto_sku,
        cantidad_total: 0,
        precio_unitario: v.precio_unitario,
        subtotal: 0,
      });
    }
    const e = grouped.get(v.producto_id);
    e.cantidad_total += v.cantidad;
    e.subtotal += v.total;
  }

  return c.json({
    fecha: targetDate,
    bloque_a_membresias: {
      total_recaudado: parseFloat(totalMembresias.toFixed(2)),
      cantidad_transacciones: (membresiasTrans || []).length,
      transacciones: membresiasTrans || [],
    },
    bloque_b_nuevos_usuarios: {
      total_nuevos: (nuevosUsuarios || []).length,
      usuarios: nuevosUsuarios || [],
    },
    bloque_c_productos_ganancias: {
      total_ingresos: parseFloat(totalProductos.toFixed(2)),
      costo_total: parseFloat(costoTotal.toFixed(2)),
      ganancia_neta: parseFloat(gananciaNeta.toFixed(2)),
      cantidad_ventas: (ventasRaw || []).length,
    },
    bloque_d_productos_detalle: Array.from(grouped.values()),
    resumen_total: {
      total_ingresos_dia: parseFloat((totalMembresias + totalProductos).toFixed(2)),
    },
  });
});

// Fallback SPA si el Worker sirve también ASSETS estáticos
app.notFound(async (c) => {
  if (c.env.ASSETS && !c.req.path.startsWith('/api/')) {
    const assetRes = await c.env.ASSETS.fetch(c.req.raw);
    if (assetRes.status === 404) {
      const url = new URL(c.req.url);
      return c.env.ASSETS.fetch(new Request(new URL('/index.html', url), c.req.raw));
    }
    return assetRes;
  }
  return c.json({ error: 'Ruta no encontrada' }, 404);
});

export default app;
