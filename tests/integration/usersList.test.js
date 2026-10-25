import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../server/server.js';
import db from '../../server/db.js';

describe('User Roster API - Integration (US2)', () => {
  let server;
  let baseUrl;
  let adminUser;
  let recepUser;

  beforeAll(async () => {
    // Buscar usuarios de prueba sembrados
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

  it('debe devolver la lista de usuarios ordenada estrictamente por apellidos A-Z', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.users).toBeDefined();
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.users.length).toBeGreaterThan(0);

    // Verificar orden alfabético estricto A-Z por apellidos
    for (let i = 0; i < data.users.length - 1; i++) {
      const current = data.users[i].apellidos.toLowerCase();
      const next = data.users[i + 1].apellidos.toLowerCase();
      expect(current.localeCompare(next)).toBeLessThanOrEqual(0);
    }
  });

  it('debe revelar usuario y contraseña únicamente para el rol ADMINISTRADOR', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
    });

    const data = await res.json();
    expect(data.users[0].username).toBeTruthy();
    expect(data.users[0].passwordRaw).toBeTruthy();
  });

  it('debe enmascarar (null) usuario y contraseña para el rol RECEPCIONISTA', async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
    });

    const data = await res.json();
    expect(data.users[0].username).toBeNull();
    expect(data.users[0].passwordRaw).toBeNull();
  });

  it('debe filtrar adecuadamente por status: active, warning o expired', async () => {
    const resActive = await fetch(`${baseUrl}/api/users?status=active`, {
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
    });
    const dataActive = await resActive.json();
    expect(dataActive.users.every((u) => u.estadoMembresia === 'ACTIVO')).toBe(true);
  });
});

