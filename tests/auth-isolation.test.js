import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../server/server.js';
import db from '../server/db.js';
import { getStorageKeyForPortal, getPortalFromPath } from '../src/context/AuthContext.jsx';

describe('Portal Authentication & Role Isolation (US1)', () => {
  let server;
  let baseUrl;
  let adminUser;
  let recepUser;
  let memberUser;

  beforeAll(async () => {
    adminUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1").get();
    recepUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'RECEPCIONISTA' LIMIT 1").get();
    memberUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'MIEMBRO' LIMIT 1").get();

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

  it('debe permitir login de Administrador en /api/auth/login/admin y rechazar otros roles', async () => {
    // 1. Admin login exitoso
    const resAdmin = await fetch(`${baseUrl}/api/auth/login/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser.username, password: 'Admin2026!' }),
    });
    expect(resAdmin.status).toBe(200);
    const dataAdmin = await resAdmin.json();
    expect(dataAdmin.user.rol).toBe('ADMINISTRADOR');
    expect(dataAdmin.token).toBeDefined();

    // 2. Recepcionista intentando entrar a portal admin -> 403
    const resRecep = await fetch(`${baseUrl}/api/auth/login/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: recepUser.username, password: 'Recep2026!' }),
    });
    expect(resRecep.status).toBe(403);
    const dataRecep = await resRecep.json();
    expect(dataRecep.error).toContain('exclusivo para Administradores');

    // 3. Miembro intentando entrar a portal admin -> 403
    const resMember = await fetch(`${baseUrl}/api/auth/login/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: memberUser.username, password: 'Atleta2026!' }),
    });
    expect(resMember.status).toBe(403);
    const dataMember = await resMember.json();
    expect(dataMember.error).toContain('exclusivo para Administradores');
  });

  it('debe permitir login de Recepción en /api/auth/login/recepcion y rechazar otros roles', async () => {
    // 1. Recepción login exitoso
    const resRecep = await fetch(`${baseUrl}/api/auth/login/recepcion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: recepUser.username, password: 'Recep2026!' }),
    });
    expect(resRecep.status).toBe(200);
    const dataRecep = await resRecep.json();
    expect(dataRecep.user.rol).toBe('RECEPCIONISTA');
    expect(dataRecep.token).toBeDefined();

    // 2. Administrador intentando entrar a portal recepcion -> 403
    const resAdmin = await fetch(`${baseUrl}/api/auth/login/recepcion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser.username, password: 'Admin2026!' }),
    });
    expect(resAdmin.status).toBe(403);
    const dataAdmin = await resAdmin.json();
    expect(dataAdmin.error).toContain('exclusivo para personal de Recepción');

    // 3. Miembro intentando entrar a portal recepcion -> 403
    const resMember = await fetch(`${baseUrl}/api/auth/login/recepcion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: memberUser.username, password: 'Atleta2026!' }),
    });
    expect(resMember.status).toBe(403);
    const dataMember = await resMember.json();
    expect(dataMember.error).toContain('exclusivo para personal de Recepción');
  });

  it('debe permitir login de Miembro en /api/auth/login/miembro y rechazar otros roles', async () => {
    // 1. Miembro login exitoso
    const resMember = await fetch(`${baseUrl}/api/auth/login/miembro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: memberUser.username, password: 'Atleta2026!' }),
    });
    expect(resMember.status).toBe(200);
    const dataMember = await resMember.json();
    expect(dataMember.user.rol).toBe('MIEMBRO');
    expect(dataMember.token).toBeDefined();

    // 2. Administrador intentando entrar a portal miembro -> 403
    const resAdmin = await fetch(`${baseUrl}/api/auth/login/miembro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser.username, password: 'Admin2026!' }),
    });
    expect(resAdmin.status).toBe(403);
    const dataAdmin = await resAdmin.json();
    expect(dataAdmin.error).toContain('exclusivo para Miembros');

    // 3. Recepcionista intentando entrar a portal miembro -> 403
    const resRecep = await fetch(`${baseUrl}/api/auth/login/miembro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: recepUser.username, password: 'Recep2026!' }),
    });
    expect(resRecep.status).toBe(403);
    const dataRecep = await resRecep.json();
    expect(dataRecep.error).toContain('exclusivo para Miembros');
  });

  it('debe mapear correctamente las claves de sesión segregadas y los portales según la ruta', () => {
    expect(getPortalFromPath('/admin')).toBe('admin');
    expect(getPortalFromPath('/admin/dashboard')).toBe('admin');
    expect(getPortalFromPath('/recepcion')).toBe('recepcion');
    expect(getPortalFromPath('/recepcion/checkin')).toBe('recepcion');
    expect(getPortalFromPath('/miembro')).toBe('miembro');
    expect(getPortalFromPath('/miembro/carnet')).toBe('miembro');
    expect(getPortalFromPath('/')).toBeNull();

    expect(getStorageKeyForPortal('admin')).toBe('gym_admin_session');
    expect(getStorageKeyForPortal('recepcion')).toBe('gym_recepcion_session');
    expect(getStorageKeyForPortal('miembro')).toBe('gym_miembro_session');
  });
});
