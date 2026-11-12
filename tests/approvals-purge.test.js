import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server/server.js';
import db from '../server/db.js';
import fs from 'node:fs';
import path from 'node:path';

describe('Approvals & Physical Voucher Purge - Unit & Integration (US4)', () => {
  let server;
  let baseUrl;
  let adminUser;

  beforeAll(async () => {
    adminUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1").get();

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

  it('debe aprobar una membresía con transferencia, purgar físicamente el archivo del disco y actualizar el estado a APROBADO', async () => {
    // 1. Crear usuario de prueba
    const testDni = '88223344';
    db.prepare('DELETE FROM usuarios WHERE dni = ?').run(testDni);
    const userRes = db.prepare(`
      INSERT INTO usuarios (rol, username, password_hash, nombres, apellidos, dni, celular)
      VALUES ('MIEMBRO', '@atleta_purge_test', 'hash123', 'Atleta', 'Purge Test', ?, '987654321')
    `).run(testDni);
    const userId = Number(userRes.lastInsertRowid);

    // 2. Crear archivo de comprobante ficticio en uploads/vouchers/
    const vouchersDir = path.resolve(process.cwd(), 'uploads/vouchers');
    if (!fs.existsSync(vouchersDir)) {
      fs.mkdirSync(vouchersDir, { recursive: true });
    }
    const filename = `test-purge-voucher-${Date.now()}.png`;
    const absPath = path.join(vouchersDir, filename);
    fs.writeFileSync(absPath, 'dummy-voucher-image-content');
    expect(fs.existsSync(absPath)).toBe(true);

    const relativeUrl = `/uploads/vouchers/${filename}`;

    // 3. Crear solicitud pendiente de membresía
    const solRes = db.prepare(`
      INSERT INTO solicitudes_membresia (usuario_id, atleta_nombre_historico, atleta_dni_historico, dias_agregados, monto, metodo_pago, comprobante_url, operador_id, estado)
      VALUES (?, 'Atleta Purge Test', ?, 30, 150.0, 'TRANSFERENCIA', ?, ?, 'PENDIENTE_APROBACION')
    `).run(userId, testDni, relativeUrl, adminUser.id);
    const solicitudId = Number(solRes.lastInsertRowid);

    // 4. Iniciar sesión o autenticar como admin
    const loginRes = await fetch(`${baseUrl}/api/auth/login/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser.username, password: 'Admin2026!' }),
    });
    const { token } = await loginRes.json();

    // 5. Llamar endpoint de aprobación
    const approveRes = await fetch(`${baseUrl}/api/aprobaciones/membresia/${solicitudId}/aprobar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(approveRes.status).toBe(200);
    const approveData = await approveRes.json();
    expect(approveData.estado).toBe('APROBADO');

    // 6. Verificar purgado físico del archivo (Principio V)
    expect(fs.existsSync(absPath)).toBe(false);

    // 7. Verificar estado contable intacto en BD
    const updated = db.prepare('SELECT * FROM solicitudes_membresia WHERE id = ?').get(solicitudId);
    expect(updated.estado).toBe('APROBADO');
    expect(updated.comprobante_url).toBe('PURGADO_TRAS_APROBACION');
    expect(updated.monto).toBe(150.0);
    expect(updated.dias_agregados).toBe(30);
  });

  it('debe denegar una membresía en efectivo, revertir los días otorgados preventivamente y borrar el registro del sistema', async () => {
    // 1. Crear usuario y membresía inicial de prueba
    const testDni = '88223399';
    db.prepare('DELETE FROM usuarios WHERE dni = ?').run(testDni);
    const userRes = db.prepare(`
      INSERT INTO usuarios (rol, username, password_hash, password_plain, nombres, apellidos, dni, celular)
      VALUES ('MIEMBRO', '@atleta_revert_test', 'hash123', 'PassAtleta123', 'Atleta', 'Revert Test', ?, '987654321')
    `).run(testDni);
    const userId = Number(userRes.lastInsertRowid);

    const initialEnd = '2026-11-20';
    db.prepare(`
      INSERT INTO membresias (usuario_id, fecha_inicio, fecha_vencimiento, anios, meses, estado, tipo_pago, plan_tag)
      VALUES (?, '2026-10-20', ?, 0, 1, 'ACTIVO', 'EFECTIVO', 'Plan Mensual')
    `).run(userId, initialEnd);

    // 2. Simular pago preventivo en efectivo (+30 días -> 2026-12-20)
    const extendedEnd = '2026-12-20';
    db.prepare('UPDATE membresias SET fecha_vencimiento = ? WHERE usuario_id = ?').run(extendedEnd, userId);

    const solRes = db.prepare(`
      INSERT INTO solicitudes_membresia (usuario_id, atleta_nombre_historico, atleta_dni_historico, dias_agregados, monto, metodo_pago, operador_id, estado)
      VALUES (?, 'Atleta Revert Test', ?, 30, 100.0, 'EFECTIVO', ?, 'PENDIENTE_APROBACION')
    `).run(userId, testDni, adminUser.id);
    const solicitudId = Number(solRes.lastInsertRowid);

    // 3. Login admin
    const loginRes = await fetch(`${baseUrl}/api/auth/login/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser.username, password: 'Admin2026!' }),
    });
    const { token } = await loginRes.json();

    // 4. Denegar cambio
    const rejectRes = await fetch(`${baseUrl}/api/aprobaciones/membresia/${solicitudId}/rechazar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ motivo: 'Arqueo de efectivo no cuadra' }),
    });
    expect(rejectRes.status).toBe(200);
    const rejectData = await rejectRes.json();
    expect(rejectData.estado).toBe('RECHAZADO');
    expect(rejectData.eliminado).toBe(true);

    // 5. Verificar que la solicitud fue borrada para no aparecer en reportes
    const checkSolicitud = db.prepare('SELECT * FROM solicitudes_membresia WHERE id = ?').get(solicitudId);
    expect(checkSolicitud).toBeUndefined();

    // 6. Verificar que la fecha de membresía fue revertida a la fecha original
    const checkMemb = db.prepare('SELECT fecha_vencimiento FROM membresias WHERE usuario_id = ?').get(userId);
    expect(checkMemb.fecha_vencimiento).toBe(initialEnd);
  });
});
