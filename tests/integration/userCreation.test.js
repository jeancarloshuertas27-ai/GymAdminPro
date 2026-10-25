import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../server/server.js';
import db from '../../server/db.js';

describe('User Creation API - Integration (US3)', () => {
  let server;
  let baseUrl;
  let adminUser;
  let recepUser;

  beforeAll(async () => {
    adminUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1").get();
    recepUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'RECEPCIONISTA' LIMIT 1").get();

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('debe registrar un nuevo miembro con pago en efectivo y activarlo de inmediato', async () => {
    const testDni = '99112233';
    // Limpiar si ya existiera de una ejecución previa
    db.prepare('DELETE FROM usuarios WHERE dni = ?').run(testDni);

    const formData = new FormData();
    formData.append('tipo', 'member');
    formData.append('nombres', 'Atleta');
    formData.append('apellidos', 'Test Inmediato');
    formData.append('dni', testDni);
    formData.append('celular', '987654321');
    formData.append('username', '@atleta_test_inmediato');
    formData.append('password', 'Pass1234!');
    formData.append('rutina', 'Fullbody Principiante');
    formData.append('anios', '1');
    formData.append('meses', '0');
    formData.append('tipo_pago', 'EFECTIVO');

    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
      body: formData,
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.dni).toBe(testDni);

    // Verificar que pueda hacer checkin inmediatamente
    const checkinRes = await fetch(`${baseUrl}/api/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni: testDni }),
    });

    const checkinData = await checkinRes.json();
    expect(checkinData.resultado).toBe('VERDE_AUTORIZADO');
    expect(checkinData.grantAccess).toBe(true);
  });

  it('debe rechazar el registro de personal de recepción si el solicitante es RECEPCIONISTA', async () => {
    const formData = new FormData();
    formData.append('tipo', 'reception');
    formData.append('nombres', 'Intento');
    formData.append('apellidos', 'No Autorizado');
    formData.append('dni', '88887777');
    formData.append('celular', '999888777');
    formData.append('celular_respaldo', '999111222');
    formData.append('domicilio', 'Av. Test 123');
    formData.append('username', '@recep_hacker');
    formData.append('password', 'Pass123!');

    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
      body: formData,
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Solo un Administrador');
  });

  it('debe rechazar pago por transferencia si no se adjunta voucher', async () => {
    const testDni = '99887766';
    db.prepare('DELETE FROM usuarios WHERE dni = ?').run(testDni);

    const formData = new FormData();
    formData.append('tipo', 'member');
    formData.append('nombres', 'Atleta');
    formData.append('apellidos', 'Sin Voucher');
    formData.append('dni', testDni);
    formData.append('celular', '987000111');
    formData.append('username', '@sin_voucher_test');
    formData.append('password', 'Pass1234!');
    formData.append('tipo_pago', 'TRANSFERENCIA');

    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
      body: formData,
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('voucher');
  });
});
