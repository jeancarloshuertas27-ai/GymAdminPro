/**
 * Motor de fidelidad táctica y evaluación de membresías para GymAdminPro
 */

export const FIDELITY_LEVELS = [
  { level: 1, name: 'NOVATO', rangeLabel: '< 1 MES', maxMonths: 1, next: 'PRINCIPIANTE' },
  { level: 2, name: 'PRINCIPIANTE', rangeLabel: '1 - 3 MESES', maxMonths: 3, next: 'PROMEDIO' },
  { level: 3, name: 'PROMEDIO', rangeLabel: '3 - 5 MESES', maxMonths: 5, next: 'EN PROGRESO' },
  { level: 4, name: 'EN PROGRESO', rangeLabel: '5 - 8 MESES', maxMonths: 8, next: 'MUTANDO' },
  { level: 5, name: 'MUTANDO', rangeLabel: '8 - 12 MESES', maxMonths: 12, next: 'MAMADO/A' },
  { level: 6, name: 'MAMADO/A', rangeLabel: '1 - 2 AÑOS', maxMonths: 24, next: 'DIOS/A GRIEGO/A' },
  { level: 7, name: 'DIOS/A GRIEGO/A', rangeLabel: '2 - 4 AÑOS', maxMonths: 48, next: 'ANIMAL' },
  { level: 8, name: 'ANIMAL', rangeLabel: '> 4 AÑOS', maxMonths: Infinity, next: null, isApex: true },
];

/**
 * Calcula el nivel de fidelidad en base a los meses continuos y penalizaciones por impago.
 * @param {string|Date} registrationDate Fecha original de inscripción
 * @param {string|Date} expirationDate Fecha de vencimiento de la última membresía
 * @param {Date} [currentDate=new Date()] Fecha de referencia (hoy)
 */
export function calculateFidelity(registrationDate, expirationDate, currentDate = new Date()) {
  const regDate = new Date(registrationDate);
  const expDate = new Date(expirationDate);
  const now = new Date(currentDate);

  // Comprobar penalización: > 14 días corridos tras vencimiento sin renovar
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysOverdue = Math.floor((now - expDate) / msPerDay);

  if (daysOverdue > 14) {
    return {
      level: 1,
      name: 'NOVATO',
      rangeLabel: '< 1 MES',
      months: 0,
      days: 0,
      penalized: true,
      penalizationReason: "Reinicio automático a 'NOVATO' por 2 semanas de impago tras la fecha de caducidad.",
      nextLevel: 'PRINCIPIANTE',
      progressPercent: 0,
      summaryText: 'NIVEL: NOVATO (REINICIADO POR IMPAGO)',
    };
  }

  // Meses acumulados aproximados de permanencia
  const diffTime = Math.max(0, now - regDate);
  const totalDays = Math.floor(diffTime / msPerDay);
  const totalMonths = totalDays / 30.4375; // promedio días por mes

  let currentTier = FIDELITY_LEVELS[0];
  let prevMonths = 0;

  for (const tier of FIDELITY_LEVELS) {
    if (totalMonths <= tier.maxMonths) {
      currentTier = tier;
      break;
    }
    prevMonths = tier.maxMonths;
  }

  // Porcentaje hacia el siguiente nivel
  let progressPercent = 100;
  if (currentTier.next) {
    const rangeSpan = currentTier.maxMonths - prevMonths;
    const progressInSpan = Math.max(0, totalMonths - prevMonths);
    progressPercent = Math.min(100, Math.round((progressInSpan / rangeSpan) * 100));
  }

  return {
    level: currentTier.level,
    name: currentTier.name,
    rangeLabel: currentTier.rangeLabel,
    months: Math.floor(totalMonths),
    days: totalDays,
    penalized: false,
    nextLevel: currentTier.next,
    progressPercent,
    summaryText: `NIVEL: ${currentTier.name} (${Math.floor(totalMonths)} MESES DE CONSTANCIA)`,
  };
}

/**
 * Calcula los días y meses restantes de una membresía con semáforo cromático.
 */
export function calculateRemainingTime(expirationDate, currentDate = new Date()) {
  const exp = new Date(expirationDate);
  const now = new Date(currentDate);
  const msPerDay = 1000 * 60 * 60 * 24;

  const diffMs = exp - now;
  const totalDays = Math.ceil(diffMs / msPerDay);

  if (totalDays <= 0) {
    const daysExpired = Math.abs(totalDays);
    return {
      totalDays,
      daysExpired,
      status: 'EXPIRED',
      trafficColor: 'ROJO',
      text: `VENCIDO (HACE ${daysExpired} DÍAS)`,
      cardText: `VENCIDO HACE ${daysExpired} DÍAS`,
      badgeClass: 'bg-error-container text-on-error',
      canDelete: daysExpired > 30, // Solo purgables si >30 días vencidos
    };
  }

  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;

  let text = '';
  if (months > 0) {
    text = `${months} ${months === 1 ? 'MES' : 'MESES'} Y ${days} ${days === 1 ? 'DÍA' : 'DÍAS'} RESTANTES`;
  } else {
    text = `FALTAN ${totalDays} ${totalDays === 1 ? 'DÍA' : 'DÍAS'}`;
  }

  // Semáforo para el carnet y tarjeta
  let trafficColor = 'VERDE';
  let badgeClass = 'bg-[#3bf589]/20 text-[#3bf589]';

  if (totalDays <= 10) {
    trafficColor = 'ROJO';
    badgeClass = 'bg-error-container/20 text-error';
  } else if (totalDays <= 30) {
    trafficColor = 'NARANJA';
    badgeClass = 'bg-[#f59e0b]/20 text-[#f59e0b]';
  }

  return {
    totalDays,
    months,
    days,
    status: totalDays <= 10 ? 'WARNING' : 'ACTIVE',
    trafficColor,
    text,
    cardText: `${months} meses y ${days} días`,
    badgeClass,
    canDelete: false,
  };
}

/**
 * Evalúa el semáforo para el Check-In en recepción.
 */
export function evaluateCheckIn(member, currentDate = new Date()) {
  if (!member || !member.fecha_vencimiento) {
    return {
      resultado: 'ROJO_DENEGADO',
      titulo: 'ACCESO DENEGADO',
      kicker: 'RESPUESTA RELÉ // PASO BLOQUEADO',
      motivo: 'DNI NO REGISTRADO EN EL PADRÓN',
      alertaColor: 'error',
      grantAccess: false,
    };
  }

  const remaining = calculateRemainingTime(member.fecha_vencimiento, currentDate);

  if (remaining.totalDays > 10) {
    return {
      resultado: 'VERDE_AUTORIZADO',
      titulo: 'ACCESO AUTORIZADO',
      kicker: 'RESPUESTA RELÉ // PASO CONCEDIDO',
      alertaColor: 'primary-container',
      grantAccess: true,
      remaining,
    };
  }

  if (remaining.totalDays >= 1) {
    return {
      resultado: 'NARANJA_AVISO',
      titulo: 'ACCESO CONCEDIDO (AVISO DE PAGO)',
      kicker: 'RESPUESTA RELÉ // PASO CONCEDIDO',
      alertaColor: 'tertiary-container',
      grantAccess: true, // Concede paso físico automático para evitar demoras
      warningMessage: `Faltan ${remaining.totalDays} días para el vencimiento de su membresía.`,
      remaining,
    };
  }

  return {
    resultado: 'ROJO_DENEGADO',
    titulo: 'ACCESO DENEGADO',
    kicker: 'RESPUESTA RELÉ // PASO BLOQUEADO',
    motivo: `Membresía caducada hace ${remaining.daysExpired} días. Se requiere renovación.`,
    alertaColor: 'error-container',
    grantAccess: false,
    remaining,
  };
}

