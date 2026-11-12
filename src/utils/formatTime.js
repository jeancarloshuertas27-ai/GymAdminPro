/**
 * Utilidades de fecha y hora sincronizadas estrictamente con la hora actual de Perú (America/Lima, UTC-5).
 */

export function parseUtcDate(dateInput) {
  if (!dateInput) return null;
  let raw = String(dateInput).trim();

  // Si viene solo hora 'HH:MM:SS' o 'HH:MM'
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) {
    const today = new Date().toISOString().split('T')[0];
    const timePart = raw.length === 5 ? `${raw}:00` : raw;
    raw = `${today}T${timePart}Z`;
  }
  // Si viene formato SQLite 'YYYY-MM-DD HH:MM:SS' sin zona horaria
  else if (raw.includes(' ') && !raw.includes('T')) {
    raw = raw.replace(' ', 'T') + 'Z';
  }
  // Si viene ISO sin 'Z' ni offset +/-
  else if (!raw.endsWith('Z') && !raw.includes('+') && !raw.slice(10).includes('-')) {
    raw = raw + 'Z';
  }

  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Convierte cualquier timestamp o fecha a la hora exacta de Perú (HH:MM o HH:MM:SS)
 */
export function formatLocalTime(dateInput, includeSeconds = false) {
  if (!dateInput) return '--:--';
  const d = parseUtcDate(dateInput) || new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  return d.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false,
  });
}

/**
 * Formatea fecha y hora combinada en Perú: "12 nov. 2026 - 16:54"
 */
export function formatPeruDateTime(dateInput) {
  if (!dateInput) return 'Hoy';
  const d = parseUtcDate(dateInput) || new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const fecha = d.toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const hora = d.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${fecha} - ${hora}`;
}
