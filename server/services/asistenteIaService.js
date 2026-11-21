import 'dotenv/config';
import db from '../db.js';
import { rutinaService } from './rutinaService.js';

const RECHAZO_TEMATICO_EXACTO =
  'Solo puedo ayudarte con dudas sobre tu rutina de entrenamiento, ejercicios y máquinas del gimnasio.';

export const MENSAJE_ALTA_DEMANDA =
  'El asistente de IA está con alta demanda en este momento. Por favor, intenta de nuevo en unos segundos.';

export const MENSAJE_API_KEY_INVALIDA =
  'La clave GEMINI_API_KEY en el archivo .env es inválida o aún no está activa en Google AI Studio. Por favor, verifica tu API key.';

export const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
];

let cachedValidModel = null;
let cachedDiscoveredModels = null;

export function resetModelCache() {
  cachedValidModel = null;
  cachedDiscoveredModels = null;
}

function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findMachinesByNumbers(maquinas, nums) {
  return maquinas.filter((m) => nums.includes(Number(m.numero_maquina)));
}

/**
 * Motor deportivo local de contingencia (Offline Fallback)
 * Mantenido exclusivamente para compatibilidad de pruebas unitarias existentes.
 */
export function generarRespuestaLocalFallback(mensaje, maquinas = []) {
  const norm = normalizeText(mensaje);

  const numMatch = norm.match(/(?:maquina\s*#?|#)\s*(\d{1,2})\b/);
  const occupiedNum = numMatch ? Number(numMatch[1]) : null;

  const pickAlternatives = (candidateNums) => {
    const filtered = candidateNums.filter((n) => n !== occupiedNum);
    return findMachinesByNumbers(maquinas, filtered).slice(0, 2);
  };

  if (
    [8, 9, 14, 15, 16].includes(occupiedNum) ||
    /(pecho|pectoral|press|banca|smith|pec.?deck|apertur|cruce)/.test(norm)
  ) {
    const alts = pickAlternatives([9, 14, 16, 15, 8]);
    const ocupadoTxt = occupiedNum ? `Si la Máquina #${String(occupiedNum).padStart(2, '0')} está ocupada, ` : '';
    return {
      respuesta:
        `${ocupadoTxt}puedes trabajar el pectoral con excelentes resultados alternando hacia ${alts.map((a) => a.nombre).join(' o ')}. ` +
        `Protocolo sugerido: 4 series de 8-12 repeticiones con 90 segundos de descanso, controlando el descenso en 2-3 segundos y manteniendo las escápulas retraídas.`,
      sugerencias_maquinas: alts.map((a) => ({
        numero: a.numero_maquina,
        nombre: a.nombre,
        grupo_muscular: a.grupo_muscular,
      })),
      fuente: 'local_fallback',
    };
  }

  if (
    [1, 2, 3, 4, 5, 6, 18, 19, 20, 25].includes(occupiedNum) ||
    /(pierna|cuadricep|femoral|isquio|sentadilla|prensa|hack|gluteo|gemelo|pantorrilla|talon|aductor|abductor)/.test(norm)
  ) {
    const isPosterior = [18, 19].includes(occupiedNum) || /(femoral|isquio|curl)/.test(norm);
    const candidates = isPosterior ? [18, 19, 24, 2] : [2, 3, 1, 4, 25];
    const alts = pickAlternatives(candidates);
    const ocupadoTxt = occupiedNum ? `Si la Máquina #${String(occupiedNum).padStart(2, '0')} está ocupada, ` : '';

    return {
      respuesta:
        `${ocupadoTxt}para entrenar el tren inferior sin perder intensidad te recomiendo usar ${alts.map((a) => a.nombre).join(' o ')}. ` +
        `En ejercicios compuestos pesados de pierna descansa entre 90s y 120s (4 series de 8-12 reps) procurando alinear rodillas con la punta de los pies.`,
      sugerencias_maquinas: alts.map((a) => ({
        numero: a.numero_maquina,
        nombre: a.nombre,
        grupo_muscular: a.grupo_muscular,
      })),
      fuente: 'local_fallback',
    };
  }

  if (
    [7, 12, 13, 24].includes(occupiedNum) ||
    /(espalda|dorsal|jalon|polea.*ancha|remo|t.?bar|lumbar)/.test(norm)
  ) {
    const alts = pickAlternatives([7, 12, 13]);
    const ocupadoTxt = occupiedNum ? `Si la Máquina #${String(occupiedNum).padStart(2, '0')} está ocupada, ` : '';

    return {
      respuesta:
        `${ocupadoTxt}puedes reemplazar el estímulo dorsal con ${alts.map((a) => a.nombre).join(' o ')}. ` +
        `Inicia cada repetición deprimiendo los hombros y llevando los codos hacia atrás sin balancear el lumbar (4 series x 10-12 reps, 90s de pausa).`,
      sugerencias_maquinas: alts.map((a) => ({
        numero: a.numero_maquina,
        nombre: a.nombre,
        grupo_muscular: a.grupo_muscular,
      })),
      fuente: 'local_fallback',
    };
  }

  if (
    [10, 11, 17, 21, 22].includes(occupiedNum) ||
    /(hombro|deltoide|lateral|pajaro|brazo|bicep|tricep|predicador|polea)/.test(norm)
  ) {
    const isArm = [11, 17].includes(occupiedNum) || /(bicep|tricep|brazo|predicador)/.test(norm);
    const alts = pickAlternatives(isArm ? [17, 11, 12, 16] : [10, 21, 22, 14]);
    return {
      respuesta:
        `Para este grupo muscular te sugiero trabajar en ${alts.map((a) => a.nombre).join(' o ')}. ` +
        `Al ser ejercicios de aislamiento o palanca media, usa cargas controladas de 3 a 4 series por 12-15 repeticiones con 60 segundos de descanso.`,
      sugerencias_maquinas: alts.map((a) => ({
        numero: a.numero_maquina,
        nombre: a.nombre,
        grupo_muscular: a.grupo_muscular,
      })),
      fuente: 'local_fallback',
    };
  }

  if (/(descans|pausa|tiempo|serie|repeticion|hipertrofia|fuerza|resistencia)/.test(norm)) {
    return {
      respuesta:
        'Guía práctica de descanso según tu objetivo en sala:\n' +
        '• Fuerza máxima (6-8 reps en máquinas compuestas como #08 o #25): 120s a 180s de descanso.\n' +
        '• Hipertrofia (8-12 reps): 90s en ejercicios multiarticulares y 60s en aislamiento.\n' +
        '• Resistencia / Bombeo (15-20 reps): 45s a 60s de pausa manteniendo buena técnica.',
      sugerencias_maquinas: [],
      fuente: 'local_fallback',
    };
  }

  if (/(tecnica|postura|dolor|molestia|calentamiento|spot|ayuda)/.test(norm)) {
    return {
      respuesta:
        'Mantén siempre la columna neutra, evita bloqueos bruscos de articulaciones y realiza 2 series de aproximación con poco peso antes de tus series efectivas. ' +
        'Si sientes molestia o necesitas corrección en vivo, presiona el botón "Llamar Coach" indicando tu número de máquina para que un entrenador te asista en persona.',
      sugerencias_maquinas: [],
      fuente: 'local_fallback',
    };
  }

  const featured = findMachinesByNumbers(maquinas, [8, 2]);
  return {
    respuesta:
      '¡Hola! Soy tu Coach Virtual de entrenamiento. Puedo ayudarte a:\n' +
      '1) Encontrar un reemplazo rápido si tu máquina (#01 a #25) está ocupada (ej. "¿Qué uso si la Máquina 8 está ocupada?").\n' +
      '2) Definir tus series, repeticiones y tiempos de descanso ideales.\n' +
      '3) Mejorar postura y ejecución en sala.',
    sugerencias_maquinas: featured.map((a) => ({
      numero: a.numero_maquina,
      nombre: a.nombre,
      grupo_muscular: a.grupo_muscular,
    })),
    fuente: 'local_fallback',
  };
}

/**
 * Formateo compacto de la rutina para reducir el número de tokens y acelerar la respuesta de Gemini.
 */
function formatearRutinaTexto(rutina, titulo) {
  if (!rutina) return '';

  const lines = [`[${titulo}] ${rutina.nombre}`];
  const dias = Array.isArray(rutina.dias) ? rutina.dias : [];

  for (const dia of dias) {
    const ejercicios = Array.isArray(dia.ejercicios) ? dia.ejercicios : [];
    if (ejercicios.length === 0) continue;

    const enfoque = dia.enfoque_muscular || 'GENERAL';
    const exList = ejercicios
      .map((ex) => {
        const cod = ex.codigo_etiqueta || `#${String(ex.numero_maquina || 0).padStart(2, '0')}`;
        return `${cod} ${ex.nombre} (${ex.series}x${ex.repeticiones}, desc ${ex.tiempo_descanso_segundos}s)`;
      })
      .join('; ');

    lines.push(`- ${dia.dia_semana} [${enfoque}]: ${exList}`);
  }

  return lines.join('\n');
}

/**
 * Optimización: envía únicamente la rutina actual activa del miembro (sin volcar listas redundantes).
 */
export function formatearContextoRutinaMiembro(usuarioId) {
  const { rutina_asignada, rutinas_privadas } = rutinaService.getMiRutina(usuarioId);
  const membresia = db
    .prepare('SELECT rutina_asignada, plan_tag FROM membresias WHERE usuario_id = ? ORDER BY id DESC LIMIT 1')
    .get(Number(usuarioId));

  if (rutina_asignada) {
    return formatearRutinaTexto(rutina_asignada, 'RUTINA OFICIAL ASIGNADA');
  }

  if (membresia?.rutina_asignada && membresia.rutina_asignada !== 'SIN RUTINA ASIGNADA') {
    return `[RUTINA ASIGNADA] ${membresia.rutina_asignada}`;
  }

  if (Array.isArray(rutinas_privadas) && rutinas_privadas.length > 0) {
    return formatearRutinaTexto(rutinas_privadas[0], 'RUTINA PERSONAL DEL MIEMBRO');
  }

  return 'El miembro no tiene una rutina asignada ni privada configurada aún.';
}

export function prioritizeModels(modelList = []) {
  const desired = String(process.env.GEMINI_MODEL || '').trim() || 'gemini-3.8-flash';
  const preferenceOrder = [
    'gemini-3.8-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ];

  return [...modelList].sort((a, b) => {
    if (a === desired) return -1;
    if (b === desired) return 1;

    const aIdx = preferenceOrder.findIndex((p) => a.includes(p));
    const bIdx = preferenceOrder.findIndex((p) => b.includes(p));
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;

    if (a.includes('flash') && !b.includes('flash')) return -1;
    if (!a.includes('flash') && b.includes('flash')) return 1;
    return a.localeCompare(b);
  });
}

export async function fetchAvailableModels(apiKey) {
  if (cachedDiscoveredModels && cachedDiscoveredModels.length > 0) {
    return cachedDiscoveredModels;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const rawList = Array.isArray(data.models) ? data.models : [];
    const usable = rawList
      .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map((m) => String(m.name || '').replace(/^models\//, ''))
      .filter(Boolean);

    const sorted = prioritizeModels(usable);
    if (sorted.length > 0) {
      cachedDiscoveredModels = sorted;
    }
    return sorted;
  } catch (err) {
    console.warn('[Asistente IA] Error consultando lista de modelos disponibles:', err.message);
    return [];
  }
}

export function buildGeminiPromptPayload(usuarioId, cleanMsg, historial = []) {
  const maquinas = db.prepare('SELECT * FROM maquinas_ejercicios ORDER BY numero_maquina ASC').all();
  const contextoRutina = formatearContextoRutinaMiembro(usuarioId);
  const hoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Lima',
  });

  const catalogoTexto = maquinas
    .map((m) => `${m.codigo_etiqueta || `#${String(m.numero_maquina).padStart(2, '0')}`}: ${m.nombre} (${m.grupo_muscular})`)
    .join('\n');

  const systemInstruction =
    `Eres el asistente de entrenamiento "Ayuda con IA" de GymAdminPro en Perú.\n` +
    `Hoy es: ${hoy}.\n\n` +
    `REGLA ESTRICTA DE DOMINIO (OBLIGATORIA):\n` +
    `Solo puedes responder preguntas relacionadas con rutinas de gimnasio, ejecución técnica de ejercicios, uso de máquinas, series, repeticiones, tiempos de descanso y recuperación muscular básica.\n` +
    `Ante CUALQUIER pregunta de otro tema (programación, tareas escolares o universitarias, política, matemáticas, finanzas, noticias, cultura general, etc.), debes rechazarla y responder ÚNICA Y EXACTAMENTE con esta frase:\n` +
    `"${RECHAZO_TEMATICO_EXACTO}"\n\n` +
    `REGLAS SOBRE EL DÍA ACTUAL Y RUTINA:\n` +
    `- Hoy es: ${hoy}.\n` +
    `- Cuando el miembro pregunte qué le toca entrenar "hoy" o pida ayuda con su rutina actual, responde estrictamente con los ejercicios correspondientes al día de la semana actual (${hoy}).\n` +
    `- Si hoy es domingo y su rutina solo cubre de lunes a sábado, indícale amablemente que hoy domingo corresponde descanso muscular y menciónale qué grupo muscular le toca mañana lunes.\n\n` +
    `CONTEXTO REAL DE LA RUTINA DEL MIEMBRO AUTENTICADO (DESDE SQLITE):\n` +
    `Hoy es: ${hoy}.\n` +
    `${contextoRutina}\n\n` +
    `CATÁLOGO DE MÁQUINAS NUMERADAS DEL GIMNASIO (#01 a #25):\n` +
    `${catalogoTexto}\n\n` +
    `INSTRUCCIONES:\n` +
    `- Responde en español de Perú, con claridad, precisión técnica y concisión.\n` +
    `- Cuando el socio pregunte por su rutina, máquinas, series, repeticiones o descansos, responde usando exactamente su rutina real descrita arriba.\n` +
    `- Si una máquina está ocupada, recomienda alternativas equivalentes del catálogo oficial indicando series, repeticiones y descanso.`;

  const recentHistory = (Array.isArray(historial) ? historial.slice(-6) : [])
    .filter((h) => h && h.text && String(h.text).trim())
    .map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(h.text).trim() }],
    }));

  while (recentHistory.length > 0 && recentHistory[0].role === 'model') {
    recentHistory.shift();
  }

  const lastHist = recentHistory[recentHistory.length - 1];
  const contents =
    lastHist && lastHist.role === 'user' && lastHist.parts?.[0]?.text === cleanMsg
      ? recentHistory
      : [...recentHistory, { role: 'user', parts: [{ text: cleanMsg }] }];

  return { systemInstruction, contents };
}

export const asistenteIaService = {
  async consultarAyudaIaMiembro(usuarioId, { mensaje, historial = [] }) {
    const cleanMsg = String(mensaje || '').trim();
    if (!cleanMsg) {
      const err = new Error('Por favor escribe una pregunta sobre tu rutina, ejercicios o máquinas.');
      err.status = 400;
      throw err;
    }

    const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey || apiKey === 'tu_api_key_de_gemini_aqui') {
      const err = new Error(
        'La clave GEMINI_API_KEY no está configurada en el archivo .env del backend.'
      );
      err.status = 503;
      throw err;
    }

    const { systemInstruction, contents } = buildGeminiPromptPayload(usuarioId, cleanMsg, historial);
    const configuredModel = String(process.env.GEMINI_MODEL || '').trim() || 'gemini-3.8-flash';

    let currentModel = cachedValidModel || configuredModel;
    let triedModels = new Set();
    let maxAttempts = 3; // Permite probar hasta 3 modelos de la lista (ej. 3.8-flash -> 2.5-flash-lite -> 2.0-flash)
    const retryDelay = process.env.NODE_ENV === 'test' ? 50 : 1500;

    while (maxAttempts > 0) {
      maxAttempts--;
      triedModels.add(currentModel);
      const cleanSlug = currentModel.replace(/^models\//, '');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cleanSlug)}:generateContent?key=${encodeURIComponent(apiKey)}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(30000), // 30 segundos
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1024,
            },
          }),
        });

        if (!response.ok) {
          let errData = null;
          let rawText = '';
          try {
            rawText = await response.text();
            errData = JSON.parse(rawText);
          } catch {
            errData = rawText || '';
          }

          // 1. Imprime en consola (console.error) el código de estado HTTP exacto y el cuerpo de error
          console.error(
            `[Asistente IA] Error de Google Gemini (HTTP ${response.status}) con modelo '${currentModel}':`,
            errData
          );

          // 3. Clave inválida (400 o 403 con API_KEY_INVALID): mensaje específico sin reintentar
          const errStr = (typeof errData === 'string' ? errData : JSON.stringify(errData || '')).toLowerCase();
          const isKeyInvalid =
            response.status === 400 || response.status === 403
              ? (
                  errStr.includes('api_key_invalid') ||
                  errStr.includes('api key not valid') ||
                  errStr.includes('api_key_expired') ||
                  errStr.includes('invalid api key') ||
                  errStr.includes('permission_denied') ||
                  errStr.includes('not have permission') ||
                  (errStr.includes('key') && (errStr.includes('invalid') || errStr.includes('not valid')))
                )
              : false;

          if (isKeyInvalid) {
            console.error('[Asistente IA] Clave GEMINI_API_KEY inválida o inactiva en Google AI Studio.');
            return {
              respuesta: MENSAJE_API_KEY_INVALIDA,
              error: MENSAJE_API_KEY_INVALIDA,
              fuente: 'gemini_api_key_invalida',
            };
          }

          // 2. Fallback automático ante 404 (NotFound), 429 (Too Many Requests / Cuota agotada) o 503 (ServiceUnavailable)
          if (response.status === 404 || response.status === 429 || response.status === 503) {
            cachedValidModel = null;
            const discovered = await fetchAvailableModels(apiKey);
            const candidatePool = [...new Set([...discovered, ...FALLBACK_MODELS])];
            const nextModel = candidatePool.find((m) => !triedModels.has(m));

            if (nextModel && maxAttempts > 0) {
              console.warn(
                `[Asistente IA] Respuesta HTTP ${response.status} en '${currentModel}'. Probando siguiente modelo de fallback: '${nextModel}'...`
              );
              if (response.status === 429 || response.status === 503) {
                await new Promise((r) => setTimeout(r, retryDelay));
              }
              currentModel = nextModel;
              cachedValidModel = nextModel;
              continue;
            }

            // Si se agotaron los modelos de fallback para probar
            return {
              respuesta: MENSAJE_ALTA_DEMANDA,
              fuente: `gemini_fallback_${response.status}`,
            };
          }

          return {
            respuesta: MENSAJE_ALTA_DEMANDA,
            fuente: `gemini_error_${response.status}`,
          };
        }

        const data = await response.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const textReply = parts
          .map((p) => p?.text || '')
          .join('')
          .trim();

        if (!textReply) {
          return {
            respuesta: MENSAJE_ALTA_DEMANDA,
            fuente: 'gemini_sin_respuesta',
          };
        }

        // Modelo confirmado y funcional
        cachedValidModel = currentModel;

        return {
          respuesta: textReply,
          fuente: currentModel,
        };
      } catch (fetchErr) {
        console.error(`[Asistente IA] Excepción en fetch a Gemini con modelo '${currentModel}':`, fetchErr.message);

        const isTimeout =
          fetchErr.name === 'TimeoutError' ||
          fetchErr.name === 'AbortError' ||
          fetchErr.message?.toLowerCase().includes('timeout') ||
          fetchErr.message?.toLowerCase().includes('aborted');

        if (isTimeout) {
          console.warn('[Asistente IA] La operación de Gemini excedió el tiempo límite (timeout 30s).');
          return {
            respuesta: MENSAJE_ALTA_DEMANDA,
            fuente: 'gemini_timeout',
          };
        }

        const candidatePool = [...new Set([...(cachedDiscoveredModels || []), ...FALLBACK_MODELS])];
        const nextModel = candidatePool.find((m) => !triedModels.has(m));
        if (nextModel && maxAttempts > 0) {
          console.warn(`[Asistente IA] Reintentando con siguiente modelo '${nextModel}' tras error de red...`);
          currentModel = nextModel;
          cachedValidModel = nextModel;
          await new Promise((r) => setTimeout(r, retryDelay));
          continue;
        }

        return {
          respuesta: MENSAJE_ALTA_DEMANDA,
          fuente: 'gemini_error_red',
        };
      }
    }

    return {
      respuesta: MENSAJE_ALTA_DEMANDA,
      fuente: 'gemini_agotado',
    };
  },

  async consultarAsistente(usuarioId, payload) {
    return this.consultarAyudaIaMiembro(usuarioId, payload);
  },
};
