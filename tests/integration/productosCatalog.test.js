import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../server/server.js';
import db from '../../server/db.js';

describe('Products Catalog API - Integration (US3)', () => {
  let server;
  let baseUrl;
  let adminUser;
  let recepUser;
  let memberUser;

  beforeAll(async () => {
    adminUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1").get();
    recepUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'RECEPCIONISTA' LIMIT 1").get();
    memberUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'MIEMBRO' LIMIT 1").get();

    // Asegurar que existe al menos un producto con stock 0 y activo = 1 para el test
    const zeroStock = db.prepare('SELECT id FROM productos WHERE stock = 0 AND activo = 1 LIMIT 1').get();
    if (!zeroStock) {
      const dynamicZeroSku = `SKU-ZERO-${Date.now()}`;
      db.prepare(`
        INSERT INTO productos (sku, nombre, precio_venta, precio_costo, stock, activo)
        VALUES (?, 'Producto Agotado Catálogo', 50.0, 30.0, 0, 1)
      `).run(dynamicZeroSku);
    }

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

  it('debe devolver precio_costo y margen_porcentaje únicamente en la respuesta del Administrador', async () => {
    const res = await fetch(`${baseUrl}/api/productos`, {
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].precio_costo).toBeDefined();
    expect(data[0].margen_porcentaje).toBeDefined();
  });

  it('debe omitir completamente precio_costo en la respuesta del Recepcionista', async () => {
    const res = await fetch(`${baseUrl}/api/productos`, {
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].precio_costo).toBeUndefined();
    expect(data[0].margen_porcentaje).toBeUndefined();
  });

  it('debe excluir los productos con stock 0 en la respuesta para Miembros', async () => {
    const res = await fetch(`${baseUrl}/api/productos`, {
      headers: {
        Authorization: `Bearer uid_${memberUser.id}_123`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    for (const prod of data) {
      expect(prod.stock).toBeGreaterThan(0);
      expect(prod.precio_costo).toBeUndefined();
    }
  });

  it('debe incluir productos con stock 0 para Recepción y Admin para permitir render translúcido', async () => {
    const res = await fetch(`${baseUrl}/api/productos`, {
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
    });

    const data = await res.json();
    const outOfStock = data.find((p) => p.stock === 0);
    expect(outOfStock).toBeDefined();
    expect(outOfStock.stock).toBe(0);
  });
});
