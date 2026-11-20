import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../server/server.js';
import db from '../../server/db.js';

describe('Alertas en Vivo "Llamar Coach" - Integration (US2, US3)', () => {
  let server;
  let baseUrl;
  let adminUser;
  let recepUser;
  let memberUser;

  beforeAll(async () => {
    adminUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1").get();
    recepUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'RECEPCIONISTA' LIMIT 1").get();

    const dni = String(Math.floor(71000000 + Math.random() * 20000000));
    const uRes = db.prepare(`
      INSERT INTO usuarios (rol, username, password_hash, password_plain, nombres, apellidos, dni, celular)
      VALUES ('MIEMBRO', ?, 'hash', 'Atleta2026!', 'Lucia', 'Fernandez', ?, '987111222')
    `).run(`@lucia_coach_${Date.now()}`, dni);
    memberUser = { id: Number(uRes.lastInsertRowid) };

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

  it('debe crear alerta desde Miembro, bloquear duplicados 409, reflejarse en Recepción/Admin y permitir cancelar o atender', async () => {
    // 1. Miembro solicita coach en Máquina 8
    const postRes = await fetch(`${baseUrl}/api/alertas-coach`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maquina_numero: 'Máquina #08 - Press Banca Smith',
        motivo: 'Spot / Cuidado',
      }),
    });
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    const alertaId1 = postData.alerta.id;

    // 2. Intento duplicado mientras está pendiente -> 409
    const dupRes = await fetch(`${baseUrl}/api/alertas-coach`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maquina_numero: 'Máquina #02' }),
    });
    expect(dupRes.status).toBe(409);

    // 3. Recepción y Admin consultan pendientes y ven la alerta con nombre y máquina
    const recepListRes = await fetch(`${baseUrl}/api/alertas-coach/pendientes`, {
      headers: { Authorization: `Bearer uid_${recepUser.id}_123` },
    });
    expect(recepListRes.status).toBe(200);
    const recepListData = await recepListRes.json();
    const foundRecep = recepListData.alertas.find((a) => a.id === alertaId1);
    expect(foundRecep).toBeDefined();
    expect(foundRecep.miembro_nombre).toContain('Lucia');
    expect(foundRecep.maquina_numero).toContain('Máquina #08');

    const adminListRes = await fetch(`${baseUrl}/api/alertas-coach/pendientes`, {
      headers: { Authorization: `Bearer uid_${adminUser.id}_123` },
    });
    expect(adminListRes.status).toBe(200);
    const adminListData = await adminListRes.json();
    expect(adminListData.alertas.some((a) => a.id === alertaId1)).toBe(true);

    // 4. Miembro cancela su solicitud
    const cancelRes = await fetch(`${baseUrl}/api/alertas-coach/${alertaId1}/cancelar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer uid_${memberUser.id}_123` },
    });
    expect(cancelRes.status).toBe(200);
    const cancelData = await cancelRes.json();
    expect(cancelData.estado).toBe('CANCELADA');

    // Ya no aparece en pendientes
    const listAfterCancel = await fetch(`${baseUrl}/api/alertas-coach/pendientes`, {
      headers: { Authorization: `Bearer uid_${recepUser.id}_123` },
    }).then((r) => r.json());
    expect(listAfterCancel.alertas.some((a) => a.id === alertaId1)).toBe(false);

    // 5. Miembro envía una nueva alerta y Recepción la marca como atendida
    const postRes2 = await fetch(`${baseUrl}/api/alertas-coach`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maquina_numero: 'Máquina #04' }),
    });
    const { alerta: alerta2 } = await postRes2.json();

    const attendRes = await fetch(`${baseUrl}/api/alertas-coach/${alerta2.id}/atender`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer uid_${recepUser.id}_123` },
    });
    expect(attendRes.status).toBe(200);
    const attendData = await attendRes.json();
    expect(attendData.estado).toBe('ATENDIDA');

    // Tampoco aparece en pendientes del Miembro
    const miAlertaRes = await fetch(`${baseUrl}/api/alertas-coach/mi-alerta`, {
      headers: { Authorization: `Bearer uid_${memberUser.id}_123` },
    }).then((r) => r.json());
    expect(miAlertaRes.alerta).toBeNull();
  });
});
