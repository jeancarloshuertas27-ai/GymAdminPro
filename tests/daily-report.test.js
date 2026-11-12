import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server/server.js';
import db from '../server/db.js';

describe('Daily Consolidated Report API (US5)', () => {
  let server;
  let baseUrl;
  let adminToken;

  beforeAll(async () => {
    const adminUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1").get();

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

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

  it('debe devolver el reporte consolidado diario con los 4 bloques obligatorios', async () => {
    const res = await fetch(`${baseUrl}/api/reportes/diario`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.fecha).toBeDefined();

    // Bloque A: Ganancias por pagos de membresías
    expect(data.bloque_a_membresias).toBeDefined();
    expect(typeof data.bloque_a_membresias.total_recaudado).toBe('number');
    expect(Array.isArray(data.bloque_a_membresias.transacciones)).toBe(true);

    // Bloque B: Nuevos usuarios inscritos
    expect(data.bloque_b_nuevos_usuarios).toBeDefined();
    expect(typeof data.bloque_b_nuevos_usuarios.total_nuevos).toBe('number');
    expect(Array.isArray(data.bloque_b_nuevos_usuarios.usuarios)).toBe(true);

    // Bloque C: Ganancias por venta de productos
    expect(data.bloque_c_productos_ganancias).toBeDefined();
    expect(typeof data.bloque_c_productos_ganancias.total_ingresos).toBe('number');
    expect(typeof data.bloque_c_productos_ganancias.costo_total).toBe('number');
    expect(typeof data.bloque_c_productos_ganancias.ganancia_neta).toBe('number');

    // Bloque D: Lista de productos vendidos
    expect(data.bloque_d_productos_detalle).toBeDefined();
    expect(Array.isArray(data.bloque_d_productos_detalle)).toBe(true);

    // Resumen total
    expect(data.resumen_total).toBeDefined();
    expect(typeof data.resumen_total.total_ingresos_dia).toBe('number');
  });
});
