import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../server/server.js';
import db from '../../server/db.js';

describe('Promociones Vigentes para Miembro con Fecha Límite y Fidelidad - Integration (US3)', () => {
  let server;
  let baseUrl;
  let memberUser;
  let promoVigenteId;
  let promoExpiradaId;
  let promoSuperiorId;

  beforeAll(async () => {
    const dni = String(Math.floor(72000000 + Math.random() * 20000000));
    const uRes = db.prepare(`
      INSERT INTO usuarios (rol, username, password_hash, password_plain, nombres, apellidos, dni, celular)
      VALUES ('MIEMBRO', ?, 'hash', 'Atleta2026!', 'Marco', 'Promo Test', ?, '999123456')
    `).run(`@marco_promo_${Date.now()}`, dni);
    memberUser = { id: Number(uRes.lastInsertRowid) };

    db.prepare(`
      INSERT INTO fidelidad (usuario_id, fecha_inscripcion_original, meses_continuos, nivel_actual)
      VALUES (?, '2026-08-01', 3, 'PRINCIPIANTE')
    `).run(memberUser.id);

    const tomorrow = new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    const yesterday = new Date(Date.now() - 2 * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    const r1 = db.prepare(`
      INSERT INTO promociones (tipo, nombre, duracion_valor, duracion_unidad, precio, fecha_limite, publico_objetivo, activo)
      VALUES ('PROMOCION_VOLATIL', 'Promo Vigente Principiante', 2, 'MESES', 180, ?, 'PRINCIPIANTE', 1)
    `).run(tomorrow);
    promoVigenteId = Number(r1.lastInsertRowid);

    const r2 = db.prepare(`
      INSERT INTO promociones (tipo, nombre, duracion_valor, duracion_unidad, precio, fecha_limite, publico_objetivo, activo)
      VALUES ('PROMOCION_VOLATIL', 'Promo Vencida Ayer', 1, 'MESES', 90, ?, 'TODOS', 1)
    `).run(yesterday);
    promoExpiradaId = Number(r2.lastInsertRowid);

    const r3 = db.prepare(`
      INSERT INTO promociones (tipo, nombre, duracion_valor, duracion_unidad, precio, fecha_limite, publico_objetivo, activo)
      VALUES ('PROMOCION_VOLATIL', 'Promo Exclusiva Animal', 6, 'MESES', 499, ?, 'ANIMAL', 1)
    `).run(tomorrow);
    promoSuperiorId = Number(r3.lastInsertRowid);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('debe retornar promociones activas dentro de fecha_limite y excluir vencidas o de niveles superiores', async () => {
    const res = await fetch(`${baseUrl}/api/promociones/para-miembro`, {
      headers: { Authorization: `Bearer uid_${memberUser.id}_123` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.nivel_actual).toBe('PRINCIPIANTE');
    const ids = data.promociones.map((p) => p.id);

    expect(ids).toContain(promoVigenteId);
    expect(ids).not.toContain(promoExpiradaId);
    expect(ids).not.toContain(promoSuperiorId);
  });
});
