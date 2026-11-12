import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../server/server.js';
import db from '../../server/db.js';

describe('Promociones API - Integration (US1)', () => {
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

  it('debe listar todas las promociones activas para Admin y Recepción', async () => {
    const res = await fetch(`${baseUrl}/api/promociones`, {
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].nombre).toBeDefined();
    expect(data[0].precio).toBeGreaterThan(0);
  });

  it('debe permitir crear una nueva promoción al Administrador', async () => {
    const formData = new FormData();
    formData.append('tipo', 'TARIFA_FIJA');
    formData.append('nombre', 'Pase Semestral Especial');
    formData.append('duracion_valor', '6');
    formData.append('duracion_unidad', 'MESES');
    formData.append('precio', '540.00');
    formData.append('publico_objetivo', 'TODOS');

    const res = await fetch(`${baseUrl}/api/promociones`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
      body: formData,
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.promocion).toBeDefined();
    expect(data.promocion.nombre).toBe('Pase Semestral Especial');
    expect(data.promocion.precio).toBe(540.0);
  });

  it('debe denegar la creación de promociones al Recepcionista (403 Forbidden)', async () => {
    const formData = new FormData();
    formData.append('tipo', 'TARIFA_FIJA');
    formData.append('nombre', 'Intento No Autorizado');
    formData.append('duracion_valor', '1');
    formData.append('duracion_unidad', 'MESES');
    formData.append('precio', '100.00');

    const res = await fetch(`${baseUrl}/api/promociones`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
      body: formData,
    });

    expect(res.status).toBe(403);
  });

  it('debe archivar una promoción existente al ser invocado por el Administrador', async () => {
    // Tomar una promo
    const promo = db.prepare('SELECT id FROM promociones WHERE activo = 1 LIMIT 1').get();

    const res = await fetch(`${baseUrl}/api/promociones/${promo.id}/archivar`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.activo).toBe(0);

    const check = db.prepare('SELECT activo FROM promociones WHERE id = ?').get(promo.id);
    expect(check.activo).toBe(0);
  });
});

