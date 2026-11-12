/**
 * Convierte timestamps de SQLite (almacenados en UTC como 'YYYY-MM-DD HH:MM:SS')
 * a la hora local exacta del navegador / Perú (HH:MM:SS en formato 24h).
 */
export function formatLocalTime(dateInput) {
  if (!dateInput) return '--:--:--';
  try {
    let raw = String(dateInput).trim();
    let iso = raw;

    // Si viene solo hora 'HH:MM:SS' o 'HH:MM'
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) {
      const today = new Date().toISOString().split('T')[0];
      const timePart = raw.length === 5 ? `${raw}:00` : raw;
      iso = `${today}T${timePart}Z`;
    }
    // Si viene formato SQLite 'YYYY-MM-DD HH:MM:SS'
    else if (raw.includes(' ') && !raw.includes('T')) {
      iso = raw.replace(' ', 'T') + 'Z';
    }
    // Si viene ISO sin indicador de zona horaria
    else if (!raw.endsWith('Z') && !raw.includes('+') && !raw.includes('-')) {
      iso = raw + 'Z';
    }

    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      // Fallback si no parseó como fecha completa
      return raw;
    }

    return d.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return String(dateInput);
  }
}

