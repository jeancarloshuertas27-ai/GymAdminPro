import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server/server.js';
import db from '../server/db.js';

describe('Inactive User Hard Delete API (US6)', () => {
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

  it('debe denegar la eliminación si la realiza un rol de Recepción (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/users/999/inactivo`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${recepToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('debe rechazar la eliminación si el miembro está activo o tiene menos de 30 días de vencido', async () => {
    // Crear miembro activo
    const dniActivo = '77112233';
    db.prepare('DELETE FROM usuarios WHERE dni = ?').run(dniActivo);
    const uRes = db.prepare(`
      INSERT INTO usuarios (rol, username, password_hash, nombres, apellidos, dni, celular)
      VALUES ('MIEMBRO', '@atleta_activo_nodelete', 'hash', 'Atleta', 'Activo', ?, '987654321')
    `).run(dniActivo);
    const userId = Number(uRes.lastInsertRowid);

    const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago)
      VALUES (?, '2026-01-01', ?, 0, 2, 'ACTIVO', 'EFECTIVO')
    `).run(userId, futureDate);

    const res = await fetch(`${baseUrl}/api/users/${userId}/inactivo`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('No se puede eliminar el usuario');
  });

  it('debe permitir Hard Delete si el miembro tiene más de 30 días de vencido (inactivo > 1 mes)', async () => {
    // Crear miembro vencido hace 45 días
    const dniInactivo = '77445566';
    db.prepare('DELETE FROM usuarios WHERE dni = ?').run(dniInactivo);
    const uRes = db.prepare(`
      INSERT INTO usuarios (rol, username, password_hash, nombres, apellidos, dni, celular)
      VALUES ('MIEMBRO', '@atleta_inactivo_delete', 'hash', 'Atleta', 'Inactivo', ?, '987654321')
    `).run(dniInactivo);
    const userId = Number(uRes.lastInsertRowid);

    const pastDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago)
      VALUES (?, '2025-01-01', ?, 0, 1, 'VENCIDO', 'EFECTIVO')
    `).run(userId, pastDate);

    // Registrar una solicitud de membresía histórica con snapshot textual
    db.prepare(`
      INSERT INTO solicitudes_membresia (usuario_id, atleta_nombre_historico, atleta_dni_historico, dias_agregados, monto, metodo_pago, operador_id, estado)
      VALUES (?, 'Atleta Inactivo', ?, 30, 100.0, 'EFECTIVO', 1, 'APROBADO')
    `).run(userId, dniInactivo);

    const res = await fetch(`${baseUrl}/api/users/${userId}/inactivo`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.usuario_id).toBe(userId);

    // Verificar borrado físico del usuario en la base de datos
    const deletedUser = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(userId);
    expect(deletedUser).toBeUndefined();

    // Verificar que el registro histórico de la solicitud se preservó (ON DELETE SET NULL)
    const histSol = db.prepare('SELECT * FROM solicitudes_membresia WHERE atleta_dni_historico = ?').get(dniInactivo);
    expect(histSol).toBeDefined();
    expect(histSol.usuario_id).toBeNull();
    expect(histSol.atleta_nombre_historico).toBe('Atleta Inactivo');
  });
});
