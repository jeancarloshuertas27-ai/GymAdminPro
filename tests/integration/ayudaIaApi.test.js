import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import app from '../../server/server.js';
import db from '../../server/db.js';
import { rutinaService } from '../../server/services/rutinaService.js';
import { resetModelCache, MENSAJE_ALTA_DEMANDA, MENSAJE_API_KEY_INVALIDA } from '../../server/services/asistenteIaService.js';

describe('Ayuda con IA (Gemini Auto-Detección y Resiliencia) - Integration (/api/miembro/ayuda-ia)', () => {
  let server;
  let baseUrl;
  let adminUser;
  let recepUser;
  let memberUser;
  let plantillaId;
  const originalFetch = globalThis.fetch;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalGeminiModel = process.env.GEMINI_MODEL;

  beforeAll(async () => {
    adminUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1").get();
    recepUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'RECEPCIONISTA' LIMIT 1").get();

    const dni = String(Math.floor(70000000 + Math.random() * 20000000));
    const username = `@atleta_ia_${Date.now()}`;
    const uRes = db.prepare(`
      INSERT INTO usuarios (rol, username, password_hash, password_plain, nombres, apellidos, dni, celular)
      VALUES ('MIEMBRO', ?, 'hash123', 'Atleta2026!', 'Lucia', 'Vargas IA', ?, '999111222')
    `).run(username, dni);
    memberUser = { id: Number(uRes.lastInsertRowid), dni };

    db.prepare(`
      INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago, plan_tag)
      VALUES (?, '2026-11-01', '2027-03-01', 0, 4, 'ACTIVO', 'EFECTIVO', 'PLAN IA TEST')
    `).run(memberUser.id);

    const maq8 = db.prepare('SELECT * FROM maquinas_ejercicios WHERE numero_maquina = 8').get();
    const maq2 = db.prepare('SELECT * FROM maquinas_ejercicios WHERE numero_maquina = 2').get();

    const plantilla = rutinaService.createPlantilla(
      {
        nombre: 'Hipertrofia Fuerza IA Test',
        descripcion: 'Rutina de prueba para contexto IA',
        dias: [
          {
            dia_semana: 'LUNES',
            enfoque_muscular: 'PECHO Y EMPUJE',
            ejercicios: [
              {
                maquina_id: maq8.id,
                series: 4,
                repeticiones: '8-12',
                tiempo_descanso_segundos: 90,
              },
            ],
          },
        ],
      },
      adminUser.id
    );
    plantillaId = plantilla.id;
    rutinaService.asignarRutinaAtleta(memberUser.id, plantillaId, adminUser.id);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetModelCache();
    globalThis.fetch = originalFetch;

    if (originalGeminiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    }

    if (originalGeminiModel === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = originalGeminiModel;
    }
  });

  afterAll(async () => {
    if (memberUser?.id) {
      db.prepare('DELETE FROM usuarios WHERE id = ?').run(memberUser.id);
    }
    if (plantillaId) {
      db.prepare('DELETE FROM rutinas_plantillas WHERE id = ?').run(plantillaId);
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('debe rechazar roles que no sean MIEMBRO con 403', async () => {
    const res = await originalFetch(`${baseUrl}/api/miembro/ayuda-ia`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mensaje: 'Hola' }),
    });
    expect(res.status).toBe(403);

    const resRecep = await originalFetch(`${baseUrl}/api/miembro/ayuda-ia`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mensaje: 'Hola' }),
    });
    expect(resRecep.status).toBe(403);
  });

  it('debe retornar 503 si GEMINI_API_KEY no está configurada', async () => {
    delete process.env.GEMINI_API_KEY;

    const res = await originalFetch(`${baseUrl}/api/miembro/ayuda-ia`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mensaje: '¿Qué ejercicios me tocan hoy?' }),
    });
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain('GEMINI_API_KEY');
  });

  it('debe consultar modelo configurado en GEMINI_MODEL inyectando contexto conciso de rutina', async () => {
    process.env.GEMINI_API_KEY = 'fake-test-gemini-key';
    process.env.GEMINI_MODEL = 'gemini-3.8-flash';

    let capturedUrl = '';
    let capturedBody = null;

    globalThis.fetch = async (url, options) => {
      const target = String(url);
      if (target.includes(':generateContent')) {
        capturedUrl = target;
        capturedBody = JSON.parse(options.body);
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: 'En tu rutina te toca la Máquina #08 Press Banca Plano con 4 series de 8-12 reps y 90s de descanso.',
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return originalFetch(url, options);
    };

    const res = await fetch(`${baseUrl}/api/miembro/ayuda-ia`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mensaje: '¿Qué me toca los lunes en mi rutina?',
        historial: [{ role: 'assistant', text: 'Saludo inicial' }],
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fuente).toBe('gemini-3.8-flash');
    expect(data.respuesta).toContain('Press Banca Plano');

    expect(capturedUrl).toContain('models/gemini-3.8-flash:generateContent');
    expect(capturedUrl).toContain('key=fake-test-gemini-key');

    const sysText = capturedBody.systemInstruction.parts[0].text;
    expect(sysText).toContain('Solo puedo ayudarte con dudas sobre tu rutina de entrenamiento, ejercicios y máquinas del gimnasio.');
    expect(sysText).toContain('Hoy es:');
    expect(sysText).toContain('domingo');
    expect(sysText).toContain('Hipertrofia Fuerza IA Test');
    expect(sysText).toContain('PECHO Y EMPUJE');
    expect(sysText).toContain('desc 90s');
  });

  it('debe auto-detectar modelo disponible vía GET /models ante HTTP 404 y reintentar con éxito', async () => {
    process.env.GEMINI_API_KEY = 'fake-test-gemini-key';
    process.env.GEMINI_MODEL = 'modelo-inexistente-404';

    let attempts = 0;
    let modelsQueried = false;

    globalThis.fetch = async (url, options) => {
      const target = String(url);

      if (target.includes('/v1beta/models?') && options.method === 'GET') {
        modelsQueried = true;
        return new Response(
          JSON.stringify({
            models: [
              {
                name: 'models/gemini-2.5-flash-lite',
                supportedGenerationMethods: ['generateContent'],
              },
              {
                name: 'models/gemini-2.0-flash',
                supportedGenerationMethods: ['generateContent'],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (target.includes(':generateContent')) {
        attempts++;
        if (target.includes('modelo-inexistente-404')) {
          return new Response(
            JSON.stringify({ error: { message: 'models/modelo-inexistente-404 is not found.' } }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (target.includes('gemini-2.5-flash-lite')) {
          return new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [{ text: 'Respuesta usando modelo descubierto automáticamente.' }],
                  },
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      return originalFetch(url, options);
    };

    const res = await fetch(`${baseUrl}/api/miembro/ayuda-ia`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mensaje: '¿Qué máquina me recomiendas?' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(modelsQueried).toBe(true);
    expect(attempts).toBe(2);
    expect(data.fuente).toBe('gemini-2.5-flash-lite');
    expect(data.respuesta).toContain('Respuesta usando modelo descubierto');
  });

  it('debe cambiar al siguiente modelo si recibe HTTP 429 (cuota de capa gratuita) y responder con éxito', async () => {
    process.env.GEMINI_API_KEY = 'fake-test-gemini-key';
    process.env.GEMINI_MODEL = 'gemini-3.8-flash';

    let attempts429 = 0;

    globalThis.fetch = async (url, options) => {
      const target = String(url);
      if (target.includes(':generateContent')) {
        attempts429++;
        if (target.includes('gemini-3.8-flash')) {
          return new Response(
            JSON.stringify({
              error: { code: 429, message: 'Resource has been exhausted (e.g. check quota).' },
            }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (target.includes('gemini-2.5-flash-lite')) {
          return new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [{ text: 'Respuesta recuperada con modelo gemini-2.5-flash-lite.' }],
                  },
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      return originalFetch(url, options);
    };

    const res = await fetch(`${baseUrl}/api/miembro/ayuda-ia`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mensaje: '¿Cuánto descanso tomar?' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(attempts429).toBe(2);
    expect(data.fuente).toBe('gemini-2.5-flash-lite');
    expect(data.respuesta).toContain('Respuesta recuperada con modelo gemini-2.5-flash-lite');
  });

  it('debe detectar HTTP 400 por clave inválida (API_KEY_INVALID) y retornar mensaje específico sin reintentar', async () => {
    process.env.GEMINI_API_KEY = 'fake-invalid-key';
    process.env.GEMINI_MODEL = 'gemini-3.8-flash';

    let attempts = 0;

    globalThis.fetch = async (url, options) => {
      const target = String(url);
      if (target.includes(':generateContent')) {
        attempts++;
        return new Response(
          JSON.stringify({
            error: {
              code: 400,
              message: 'API key not valid. Please pass a valid API key.',
              status: 'INVALID_ARGUMENT',
              details: [{ reason: 'API_KEY_INVALID' }],
            },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return originalFetch(url, options);
    };

    const res = await fetch(`${baseUrl}/api/miembro/ayuda-ia`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mensaje: 'Hola coach' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(attempts).toBe(1); // Exactamente 1 intento, no reintenta innecesariamente
    expect(data.fuente).toBe('gemini_api_key_invalida');
    expect(data.respuesta).toBe(MENSAJE_API_KEY_INVALIDA);
    expect(data.respuesta).toContain('GEMINI_API_KEY');
  });

  it('debe reintentar ante HTTP 503 probando modelos y retornar mensaje amigable en caso de saturación persistente', async () => {
    process.env.GEMINI_API_KEY = 'fake-test-gemini-key';
    process.env.GEMINI_MODEL = 'gemini-3.8-flash';

    let attempts503 = 0;

    globalThis.fetch = async (url, options) => {
      const target = String(url);
      if (target.includes(':generateContent')) {
        attempts503++;
        return new Response(
          JSON.stringify({ error: { message: 'The model is overloaded. Please try again later.' } }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return originalFetch(url, options);
    };

    const res = await fetch(`${baseUrl}/api/miembro/ayuda-ia`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mensaje: '¿Cómo hago press banca?' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(attempts503).toBeGreaterThanOrEqual(3);
    expect(data.respuesta).toBe(MENSAJE_ALTA_DEMANDA);
  });

  it('debe retornar mensaje amigable ante timeout sin arrojar error técnico', async () => {
    process.env.GEMINI_API_KEY = 'fake-test-gemini-key';
    process.env.GEMINI_MODEL = 'gemini-3.8-flash';

    globalThis.fetch = async (url, options) => {
      const target = String(url);
      if (target.includes(':generateContent')) {
        const timeoutErr = new Error('The operation was aborted due to timeout');
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      }
      return originalFetch(url, options);
    };

    const res = await fetch(`${baseUrl}/api/miembro/ayuda-ia`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mensaje: '¿Cuánto descanso en sentadilla?' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.respuesta).toBe(MENSAJE_ALTA_DEMANDA);
  });
});
