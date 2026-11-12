import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../server/server.js';
import db from '../../server/db.js';
import fs from 'node:fs';
import path from 'node:path';

describe('Sales & Approvals API with Voucher Pruning (Principle V) - Integration (US5)', () => {
  let server;
  let baseUrl;
  let adminUser;
  let recepUser;
  let testProductId;

  beforeAll(async () => {
    adminUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'ADMINISTRADOR' LIMIT 1").get();
    recepUser = db.prepare("SELECT * FROM usuarios WHERE rol = 'RECEPCIONISTA' LIMIT 1").get();

    // Crear producto para la prueba con SKU único
    const uniqueSku = `SKU-POS-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const pRes = db.prepare(`
      INSERT INTO productos (sku, nombre, precio_venta, precio_costo, stock, categoria, activo)
      VALUES (?, 'Producto Test Venta', 100.00, 50.00, 10, 'SUPLEMENTOS', 1)
    `).run(uniqueSku);
    testProductId = Number(pRes.lastInsertRowid);

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

  it('debe registrar venta en efectivo con liquidación instantánea', async () => {
    const formData = new FormData();
    formData.append('producto_id', testProductId.toString());
    formData.append('cantidad', '2');
    formData.append('metodo_pago', 'EFECTIVO');

    const res = await fetch(`${baseUrl}/api/productos/vender`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
      body: formData,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.venta.estado).toBe('PENDIENTE_APROBACION');
    expect(data.venta.despacho_autorizado).toBe(true);
    expect(data.venta.total).toBe(200.00);

    const check = db.prepare('SELECT stock FROM productos WHERE id = ?').get(testProductId);
    expect(check.stock).toBe(8);
  });

  it('debe registrar venta por transferencia y permitir al Administrador aprobarla purgando el archivo físico (Principio V)', async () => {
    // 1. Crear archivo físico temporal en uploads/vouchers/
    const vouchersDir = path.resolve(process.cwd(), 'uploads/vouchers');
    fs.mkdirSync(vouchersDir, { recursive: true });
    const fakeFileName = `test_voucher_prune_${Date.now()}.png`;
    const fakeFilePath = path.join(vouchersDir, fakeFileName);
    fs.writeFileSync(fakeFilePath, 'Voucher content to prune');
    expect(fs.existsSync(fakeFilePath)).toBe(true);

    // 2. Registrar venta con comprobante
    const blob = new Blob(['simulated image'], { type: 'image/png' });
    const formData = new FormData();
    formData.append('producto_id', testProductId.toString());
    formData.append('cantidad', '1');
    formData.append('metodo_pago', 'TRANSFERENCIA');
    formData.append('comprobante', blob, fakeFileName);

    const resSale = await fetch(`${baseUrl}/api/productos/vender`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
      body: formData,
    });

    expect(resSale.status).toBe(200);
    const saleData = await resSale.json();
    const saleId = saleData.venta.id;
    expect(saleData.venta.estado).toBe('PENDIENTE_APROBACION');

    // 3. Consultar lista de pendientes
    const resList = await fetch(`${baseUrl}/api/aprobaciones`, {
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
    });
    expect(resList.status).toBe(200);
    const listData = await resList.json();
    const found = listData.ventas_pendientes.find((v) => v.id === saleId);
    expect(found).toBeDefined();

    // 4. Administrador aprueba la venta
    const resApprove = await fetch(`${baseUrl}/api/aprobaciones/producto/${saleId}/aprobar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
      },
    });

    expect(resApprove.status).toBe(200);
    const approveData = await resApprove.json();
    expect(approveData.estado).toBe('APROBADO');
    expect(approveData.comprobante_url).toBe('PURGADO_TRAS_APROBACION');

    // 5. Verificar que el archivo físico subido fue purgado de disco según el Principio V
    const dbRecord = db.prepare('SELECT comprobante_url FROM ventas_productos WHERE id = ?').get(saleId);
    expect(dbRecord.comprobante_url).toBe('PURGADO_TRAS_APROBACION');
  });

  it('debe revertir el stock automáticamente cuando el Administrador rechaza una venta por transferencia', async () => {
    const blob = new Blob(['simulated voucher'], { type: 'image/png' });
    const formData = new FormData();
    formData.append('producto_id', testProductId.toString());
    formData.append('cantidad', '3');
    formData.append('metodo_pago', 'TRANSFERENCIA');
    formData.append('comprobante', blob, 'voucher_to_reject.png');

    const resSale = await fetch(`${baseUrl}/api/productos/vender`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${recepUser.id}_123`,
      },
      body: formData,
    });

    const saleData = await resSale.json();
    const saleId = saleData.venta.id;

    // Administrador rechaza
    const resReject = await fetch(`${baseUrl}/api/aprobaciones/producto/${saleId}/rechazar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer uid_${adminUser.id}_123`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ motivo: 'Monto no corresponde' }),
    });

    expect(resReject.status).toBe(200);
    const rejectData = await resReject.json();
    expect(rejectData.estado).toBe('RECHAZADO');
    expect(rejectData.stock_restaurado).toBe(true);
    expect(rejectData.eliminado).toBe(true);

    // Debe borrarse el registro para que no figure en ningún reporte contable
    const dbRecord = db.prepare('SELECT * FROM ventas_productos WHERE id = ?').get(saleId);
    expect(dbRecord).toBeUndefined();

    // El stock reservado debió reintegrarse al catálogo (volviendo a 7)
    const prodCheck = db.prepare('SELECT stock FROM productos WHERE id = ?').get(testProductId);
    expect(prodCheck.stock).toBe(7);
  });
});
