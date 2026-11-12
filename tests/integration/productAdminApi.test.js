import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../server/server.js';
import db from '../../server/db.js';

describe('Product Admin Management API - Integration (US4)', () => {
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

  it('debe permitir crear un nuevo producto con costo privado y stock al Administrador', async () => {
    const dynamicSku = `SKU-TEST-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const formData = new FormData();
    formData.append('sku', dynamicSku);
    formData.append('nombre', 'Pre-Entreno Test Pump');
    formData.append('descripcion', 'Fórmula de prueba');
    formData.append('precio_venta', '180.00');
    formData.append('precio_costo', '100.00');
    formData.append('stock', '15');
    formData.append('categoria', 'SUPLEMENTOS');

    const res = await fetch(`${baseUrl}/api/productos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
      body: formData,
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.producto).toBeDefined();
    expect(data.producto.nombre).toBe('Pre-Entreno Test Pump');
    expect(data.producto.precio_costo).toBe(100.0);
    expect(data.producto.stock).toBe(15);
  });

  it('debe denegar la creación de productos al Recepcionista (403 Forbidden)', async () => {
    const formData = new FormData();
    formData.append('nombre', 'Intento Prohibido');
    formData.append('precio_venta', '50.00');
    formData.append('stock', '5');

    const res = await fetch(`${baseUrl}/api/productos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
      body: formData,
    });

    expect(res.status).toBe(403);
  });

  it('debe permitir editar un producto existente al Administrador', async () => {
    const prod = db.prepare('SELECT id FROM productos WHERE activo = 1 LIMIT 1').get();

    const formData = new FormData();
    formData.append('nombre', 'Nombre Actualizado');
    formData.append('precio_venta', '299.00');

    const res = await fetch(`${baseUrl}/api/productos/${prod.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
      body: formData,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.producto.nombre).toBe('Nombre Actualizado');
    expect(data.producto.precio_venta).toBe(299.00);
  });

  it('debe dar de baja lógica al producto (activo = 0) al eliminarlo', async () => {
    const prod = db.prepare('SELECT id FROM productos WHERE activo = 1 LIMIT 1').get();

    const res = await fetch(`${baseUrl}/api/productos/${prod.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.activo).toBe(0);

    const check = db.prepare('SELECT activo FROM productos WHERE id = ?').get(prod.id);
    expect(check.activo).toBe(0);
  });
});
