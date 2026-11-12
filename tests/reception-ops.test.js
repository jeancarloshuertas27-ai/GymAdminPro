import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server/server.js';
import db from '../server/db.js';

describe('Reception Workstation Operations API (US2)', () => {
  let server;
  let baseUrl;
  let recepToken;
  let adminToken;
  let recepUser;
  let adminUser;

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

    const resRecep = await fetch(`${baseUrl}/api/auth/login/recepcion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: recepUser.username, password: 'Recep2026!' }),
    });
    const dataRecep = await resRecep.json();
    recepToken = dataRecep.token;

    const resAdmin = await fetch(`${baseUrl}/api/auth/login/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser.username, password: 'Admin2026!' }),
    });
    const dataAdmin = await resAdmin.json();
    adminToken = dataAdmin.token;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('debe devolver redirección predeterminada a /recepcion/checkin al iniciar sesión en el portal Recepción', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login/recepcion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: recepUser.username, password: 'Recep2026!' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.redirectTo).toBe('/recepcion/checkin');
  });

  it('debe filtrar promociones según rango de fidelidad (ocultando rangos superiores a NOVATO)', async () => {
    // Insertar promoción exclusiva para MAMADO
    db.prepare(`
      INSERT INTO promociones (tipo, nombre, duracion_valor, duracion_unidad, precio, publico_objetivo, activo)
      VALUES ('PROMOCION_VOLATIL', 'PROMO VIP MAMADOS', 3, 'MESES', 200.0, 'MAMADO', 1)
    `).run();

    const res = await fetch(`${baseUrl}/api/promociones?nivel_miembro=NOVATO`, {
      headers: { Authorization: `Bearer ${recepToken}` },
    });
    expect(res.status).toBe(200);
    const promos = await res.json();
    const mamadoPromo = promos.find((p) => p.nombre === 'PROMO VIP MAMADOS');
    expect(mamadoPromo).toBeUndefined(); // Debe estar excluida para NOVATO
  });

  it('debe ocultar el precio de costo a personal de Recepción en el catálogo de productos', async () => {
    const resRecep = await fetch(`${baseUrl}/api/productos`, {
      headers: { Authorization: `Bearer ${recepToken}` },
    });
    expect(resRecep.status).toBe(200);
    const prodsRecep = await resRecep.json();
    expect(prodsRecep.length).toBeGreaterThan(0);
    for (const p of prodsRecep) {
      expect(p.precio_costo).toBeUndefined();
      expect(p.precio_venta).toBeDefined();
      expect(p.stock).toBeDefined();
    }

    // El Administrador sí ve el precio de costo
    const resAdmin = await fetch(`${baseUrl}/api/productos`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(resAdmin.status).toBe(200);
    const prodsAdmin = await resAdmin.json();
    expect(prodsAdmin.length).toBeGreaterThan(0);
    expect(prodsAdmin[0].precio_costo).toBeDefined();
  });

  it('debe bloquear la venta rápida cuando el stock del producto es 0', async () => {
    // Crear producto con stock 0
    const sku = `SKU-TEST-${Date.now()}`;
    const ins = db.prepare(`
      INSERT INTO productos (sku, nombre, precio_venta, precio_costo, stock, categoria, activo)
      VALUES (?, 'Producto Sin Stock', 50.0, 30.0, 0, 'SNACKS', 1)
    `).run(sku);
    const prodId = Number(ins.lastInsertRowid);

    const res = await fetch(`${baseUrl}/api/productos/vender`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recepToken}`,
      },
      body: JSON.stringify({
        producto_id: prodId,
        cantidad: 1,
        metodo_pago: 'EFECTIVO',
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Stock insuficiente');
  });
});
