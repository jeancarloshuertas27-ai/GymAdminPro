import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../server/server.js';
import db from '../../server/db.js';

describe('Membresias Search & Assignment API - Integration (US2)', () => {
  let server;
  let baseUrl;
  let adminUser;
  let recepUser;
  let atletaUser;

  beforeAll(async () => {
    adminUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1").get();
    recepUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'RECEPCIONISTA' LIMIT 1").get();
    atletaUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'MIEMBRO' AND dni = '72849102' LIMIT 1").get();

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

  it('debe buscar a un atleta por su DNI de 8 dígitos y devolver su membresía actual', async () => {
    const res = await fetch(`${baseUrl}/api/membresias/buscar/72849102`, {
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.usuario).toBeDefined();
    expect(data.usuario.dni).toBe('72849102');
    expect(data.usuario.nombres).toBe('Mateo');
    expect(data.membresia_actual).toBeDefined();
    expect(data.membresia_actual.dias_restantes).toBeDefined();
  });

  it('debe devolver error 400 si el DNI buscado no tiene 8 dígitos', async () => {
    const res = await fetch(`${baseUrl}/api/membresias/buscar/123`, {
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
    });

    expect(res.status).toBe(400);
  });

  it('debe agregar tiempo de membresía con pago en efectivo y autoaprobarlo', async () => {
    const initialMemb = db.prepare('SELECT fecha_vencimiento FROM membresias WHERE usuario_id = ?').get(atletaUser.id);

    const formData = new FormData();
    formData.append('usuario_id', atletaUser.id.toString());
    formData.append('modo', 'MANUAL');
    formData.append('cantidad_tiempo', '30');
    formData.append('unidad_tiempo', 'DIAS');
    formData.append('monto', '120.00');
    formData.append('metodo_pago', 'EFECTIVO');

    const res = await fetch(`${baseUrl}/api/membresias/asignar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
      body: formData,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.transaccion.estado).toBe('PENDIENTE_APROBACION');

    const updatedMemb = db.prepare('SELECT fecha_vencimiento FROM membresias WHERE usuario_id = ?').get(atletaUser.id);
    expect(updatedMemb.fecha_vencimiento > initialMemb.fecha_vencimiento).toBe(true);
  });

  it('debe requerir comprobante si un recepcionista registra transferencia y dejarla pendiente', async () => {
    const formData = new FormData();
    formData.append('usuario_id', atletaUser.id.toString());
    formData.append('modo', 'MANUAL');
    formData.append('cantidad_tiempo', '30');
    formData.append('unidad_tiempo', 'DIAS');
    formData.append('monto', '120.00');
    formData.append('metodo_pago', 'TRANSFERENCIA');

    // Sin comprobante adjunto -> debe rechazar 400
    const resFail = await fetch(`${baseUrl}/api/membresias/asignar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
      body: formData,
    });
    expect(resFail.status).toBe(400);

    // Con comprobante adjunto -> debe quedar PENDIENTE_APROBACION
    const blob = new Blob(['simulated voucher content'], { type: 'image/png' });
    formData.append('comprobante', blob, 'voucher_test.png');

    const resSuccess = await fetch(`${baseUrl}/api/membresias/asignar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
      body: formData,
    });

    expect(resSuccess.status).toBe(200);
    const data = await resSuccess.json();
    expect(data.transaccion.estado).toBe('PENDIENTE_APROBACION');
  });
});

