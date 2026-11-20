import db from '../db.js';

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
 * Responde con precisión biomecánica usando el catálogo real de 25 máquinas en Perú
 */
export function generarRespuestaLocalFallback(mensaje, maquinas = []) {
  const norm = normalizeText(mensaje);

  // Detectar si preguntó por un número específico de máquina
  const numMatch = norm.match(/(?:maquina\s*#?|#)\s*(\d{1,2})\b/);
  const occupiedNum = numMatch ? Number(numMatch[1]) : null;

  const pickAlternatives = (candidateNums) => {
    const filtered = candidateNums.filter((n) => n !== occupiedNum);
    return findMachinesByNumbers(maquinas, filtered).slice(0, 2);
  };

  // 1. Pectoral / Press Banca
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

  // 2. Piernas / Cuádriceps / Femoral / Glúteo / Sentadilla / Prensa
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

  // 3. Espalda / Dorsales / Remo / Jalón
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

  // 4. Hombros y Brazos (Bíceps / Tríceps / Deltoides)
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

  // 5. Consultas de descansos, series o repeticiones
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

  // 6. Técnica, postura o dolor
  if (/(tecnica|postura|dolor|molestia|calentamiento|spot|ayuda)/.test(norm)) {
    return {
      respuesta:
        'Mantén siempre la columna neutra, evita bloqueos bruscos de articulaciones y realiza 2 series de aproximación con poco peso antes de tus series efectivas. ' +
        'Si sientes molestia o necesitas corrección en vivo, presiona el botón "Llamar Coach" indicando tu número de máquina para que un entrenador te asista en persona.',
      sugerencias_maquinas: [],
      fuente: 'local_fallback',
    };
  }

  // 7. Respuesta general orientadora
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

export const asistenteIaService = {
  async consultarAsistente(usuarioId, { mensaje, historial = [] }) {
    const cleanMsg = String(mensaje || '').trim();
    if (!cleanMsg) {
      const err = new Error('Por favor escribe una pregunta para el entrenador virtual.');
      err.status = 400;
      throw err;
    }

    const maquinas = db.prepare('SELECT * FROM maquinas_ejercicios ORDER BY numero_maquina ASC').all();
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const catalogoTexto = maquinas
          .map((m) => `${m.codigo_etiqueta}: ${m.nombre} (${m.grupo_muscular})`)
          .join('\n');

        const systemPrompt =
          'Eres el Coach Virtual de GymAdminPro en Perú. Responde en español de Perú de forma concisa, práctica y amigable. ' +
          'El gimnasio cuenta exactamente con estas 25 máquinas:\n' +
          catalogoTexto +
          '\nSi el socio pregunta por una máquina ocupada, recomienda 2 máquinas equivalentes de esa lista indicando series, repeticiones y segundos de descanso.';

        const contents = [
          ...(Array.isArray(historial) ? historial.slice(-6) : []).map((h) => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(h.text || '') }],
          })),
          {
            role: 'user',
            parts: [{ text: cleanMsg }],
          },
        ];

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000),
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents,
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 350,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const textReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textReply) {
            const localMeta = generarRespuestaLocalFallback(cleanMsg, maquinas);
            return {
              respuesta: textReply.trim(),
              sugerencias_maquinas: localMeta.sugerencias_maquinas,
              fuente: 'gemini',
            };
          }
        }
      } catch (err) {
        console.warn('[Asistente IA] Gemini no disponible, usando motor local de respaldo:', err.message);
      }
    }

    return generarRespuestaLocalFallback(cleanMsg, maquinas);
  },
};
