import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../server/server.js';
import db from '../../server/db.js';

describe('Rutinas Semanales, Asignación por DNI y Privacidad - Integration (US1, US2, US4)', () => {
  let server;
  let baseUrl;
  let adminUser;
  let recepUser;
  let memberUser;
  let memberDni;

  beforeAll(async () => {
    adminUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1").get();
    recepUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'RECEPCIONISTA' LIMIT 1").get();

    memberDni = String(Math.floor(70000000 + Math.random() * 20000000));
    const uniqueUsername = `@atleta_rutina_${Date.now()}`;
    const uRes = db.prepare(`
      INSERT INTO usuarios (rol, username, password_hash, password_plain, nombres, apellidos, dni, celular)
      VALUES ('MIEMBRO', ?, 'hash123', 'Atleta2026!', 'Carlos', 'Mendoza Test', ?, '999888777')
    `).run(uniqueUsername, memberDni);
    memberUser = { id: Number(uRes.lastInsertRowid), dni: memberDni };

    db.prepare(`
      INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago, plan_tag)
      VALUES (?, '2026-11-01', '2027-01-01', 0, 2, 'ACTIVO', 'EFECTIVO', 'PLAN TEST')
    `).run(memberUser.id);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('debe devolver las 25 máquinas numeradas del catálogo maestro', async () => {
    const res = await fetch(`${baseUrl}/api/rutinas/maquinas`, {
      headers: { Authorization: `Bearer uid_${adminUser.id}_123` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.maquinas)).toBe(true);
    expect(data.maquinas.length).toBe(25);
    expect(data.maquinas[0].numero_maquina).toBe(1);
    expect(data.maquinas[24].numero_maquina).toBe(25);
  });

  it('debe permitir al Admin crear plantilla, buscar por DNI, asignar desde Admin/Recepción y aislar ajustes y rutinas privadas del Miembro', async () => {
    const maqRes = await fetch(`${baseUrl}/api/rutinas/maquinas`, {
      headers: { Authorization: `Bearer uid_${adminUser.id}_123` },
    });
    const { maquinas } = await maqRes.json();
    const maq8 = maquinas.find((m) => m.numero_maquina === 8);

    // 1. Recepción no puede crear plantillas maestras (403)
    const forbidRes = await fetch(`${baseUrl}/api/rutinas/plantillas`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre: 'Intento Recepción', dias: [] }),
    });
    expect(forbidRes.status).toBe(403);

    // 2. Admin crea rutina plantilla
    const routineName = `Rutina Test ${Date.now()}`;
    const createRes = await fetch(`${baseUrl}/api/rutinas/plantillas`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: routineName,
        dias: [
          {
            dia_semana: 'LUNES',
            enfoque_muscular: 'PUSH',
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
      }),
    });
    expect(createRes.status).toBe(201);
    const createdData = await createRes.json();
    const plantillaId = createdData.plantilla.id;
    const lunesEx = createdData.plantilla.dias[0].ejercicios[0];
    expect(lunesEx.orden_secuencial).toBe(1);

    // 3. Recepción busca al atleta por DNI y le asigna la rutina
    const searchRes = await fetch(`${baseUrl}/api/rutinas/buscar-atleta/${memberDni}`, {
      headers: { Authorization: `Bearer uid_${recepUser.id}_123` },
    });
    expect(searchRes.status).toBe(200);
    const searchData = await searchRes.json();
    expect(searchData.atleta.dni).toBe(memberDni);
    expect(searchData.atleta.rutina_etiqueta).toMatch(/^rutina:/);

    const assignRes = await fetch(`${baseUrl}/api/rutinas/asignar`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usuario_id: memberUser.id,
        rutina_id: plantillaId,
      }),
    });
    expect(assignRes.status).toBe(200);
    const assignData = await assignRes.json();
    expect(assignData.rutina_etiqueta).toBe(`rutina: ${routineName}`);

    // 4. Miembro consulta su rutina y ajusta sus series (4->5) y descanso (90->120)
    const adjustRes = await fetch(`${baseUrl}/api/rutinas/mi-rutina/ajustar-ejercicio`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rutina_ejercicio_id: lunesEx.id,
        series_custom: 5,
        descanso_custom_segundos: 120,
      }),
    });
    expect(adjustRes.status).toBe(200);

    const myRutinaRes = await fetch(`${baseUrl}/api/rutinas/mi-rutina`, {
      headers: { Authorization: `Bearer uid_${memberUser.id}_123` },
    });
    expect(myRutinaRes.status).toBe(200);
    const myData = await myRutinaRes.json();
    const myEx = myData.rutina_asignada.dias[0].ejercicios[0];
    expect(myEx.series).toBe(5);
    expect(myEx.tiempo_descanso_segundos).toBe(120);

    // La plantilla maestra del Admin sigue intacta (4 series, 90s)
    const adminPlantillasRes = await fetch(`${baseUrl}/api/rutinas/plantillas`, {
      headers: { Authorization: `Bearer uid_${adminUser.id}_123` },
    });
    const adminPlantillasData = await adminPlantillasRes.json();
    const originalPlantilla = adminPlantillasData.plantillas.find((p) => p.id === plantillaId);
    expect(originalPlantilla.dias[0].ejercicios[0].series).toBe(4);
    expect(originalPlantilla.dias[0].ejercicios[0].tiempo_descanso_segundos).toBe(90);

    // 5. Miembro crea una rutina privada: no debe ser visible en GET /api/rutinas/plantillas
    const privateName = `Mi Rutina Secreta ${Date.now()}`;
    const privRes = await fetch(`${baseUrl}/api/rutinas/privadas`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: privateName,
        dias: [
          {
            dia_semana: 'LUNES',
            enfoque_muscular: 'PERSONAL',
            ejercicios: [{ ...maq8, maquina_id: maq8.id, series: 3, repeticiones: '12-15', tiempo_descanso_segundos: 60 }],
          },
        ],
      }),
    });
    expect(privRes.status).toBe(201);

    const checkGlobalRes = await fetch(`${baseUrl}/api/rutinas/plantillas`, {
      headers: { Authorization: `Bearer uid_${adminUser.id}_123` },
    });
    const checkGlobalData = await checkGlobalRes.json();
    const leaked = checkGlobalData.plantillas.find((p) => p.nombre === privateName);
    expect(leaked).toBeUndefined();
  });
});
