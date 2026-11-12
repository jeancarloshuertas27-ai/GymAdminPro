import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server/server.js';
import db from '../server/db.js';

describe('Admin Dashboard Metrics API (US3)', () => {
  let server;
  let baseUrl;
  let adminToken;
  let recepToken;

  beforeAll(async () => {
    const adminUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1").get();
    const recepUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'RECEPCIONISTA' LIMIT 1").get();

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

    const resRecep = await fetch(`${baseUrl}/api/auth/login/recepcion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: recepUser.username, password: 'Recep2026!' }),
    });
    const dataRecep = await resRecep.json();
    recepToken = dataRecep.token;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('debe rechazar acceso a /api/reportes/dashboard a usuarios no administradores', async () => {
    const res = await fetch(`${baseUrl}/api/reportes/dashboard`, {
      headers: { Authorization: `Bearer ${recepToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('debe devolver métricas consolidadas en tiempo real para el Administrador', async () => {
    const res = await fetch(`${baseUrl}/api/reportes/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();

    // Validar estructura de métricas
    expect(data.ingresos_hoy).toBeDefined();
    expect(typeof data.ingresos_hoy.total).toBe('number');
    expect(typeof data.ingresos_hoy.membresias).toBe('number');
    expect(typeof data.ingresos_hoy.productos).toBe('number');

    expect(data.atletas).toBeDefined();
    expect(typeof data.atletas.total_activos).toBe('number');
    expect(typeof data.atletas.por_vencer_10d).toBe('number');
    expect(typeof data.atletas.nuevos_este_mes).toBe('number');

    expect(data.stock_critico).toBeDefined();
    expect(typeof data.stock_critico.total_items).toBe('number');
    expect(Array.isArray(data.stock_critico.items)).toBe(true);

    expect(data.aprobaciones).toBeDefined();
    expect(typeof data.aprobaciones.total_pendientes).toBe('number');
    expect(Array.isArray(data.aprobaciones.recientes)).toBe(true);
  });
});
