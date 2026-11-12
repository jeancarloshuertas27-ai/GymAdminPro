import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../server/db.js';
import { productoService } from '../../server/services/productoService.js';
import { aprobacionService } from '../../server/services/aprobacionService.js';

describe('Stock Reservation & Overselling Prevention Unit Tests (US5)', () => {
  let testProductId;

  beforeEach(() => {
    const uniqueSku = `SKU-RES-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const res = db.prepare(`
      INSERT INTO productos (sku, nombre, descripcion, precio_venta, precio_costo, stock, categoria, imagen_url, activo)
      VALUES (?, 'Producto Test Reserva', 'Desc', 50.00, 25.00, 10, 'TEST', null, 1)
    `).run(uniqueSku);
    testProductId = Number(res.lastInsertRowid);
  });

  it('debe impedir sobreventas si la cantidad solicitada supera el stock disponible', () => {
    const operator = { id: 1, rol: 'RECEPCIONISTA' };
    expect(() => {
      productoService.sellProduct(
        { producto_id: testProductId, cantidad: 15, metodo_pago: 'EFECTIVO' },
        null,
        operator
      );
    }).toThrow(/Stock insuficiente/);

    const check = db.prepare('SELECT stock FROM productos WHERE id = ?').get(testProductId);
    expect(check.stock).toBe(10);
  });

  it('debe reservar preventivamente el stock al registrar venta por transferencia', () => {
    const operator = { id: 1, rol: 'RECEPCIONISTA' };
    const fakeVoucher = { filename: 'test_voucher.png' };

    const sellRes = productoService.sellProduct(
      { producto_id: testProductId, cantidad: 4, metodo_pago: 'TRANSFERENCIA' },
      fakeVoucher,
      operator
    );

    expect(sellRes.venta.estado).toBe('PENDIENTE_APROBACION');
    expect(sellRes.venta.despacho_autorizado).toBe(false);

    // El stock debe haber bajado de 10 a 6 preventivamente
    const check = db.prepare('SELECT stock FROM productos WHERE id = ?').get(testProductId);
    expect(check.stock).toBe(6);
  });

  it('debe reintegrar atómicamente el stock si el Administrador rechaza la venta', () => {
    const operator = { id: 1, rol: 'RECEPCIONISTA' };
    const fakeVoucher = { filename: 'test_voucher.png' };

    const sellRes = productoService.sellProduct(
      { producto_id: testProductId, cantidad: 3, metodo_pago: 'TRANSFERENCIA' },
      fakeVoucher,
      operator
    );

    // Stock quedó en 7
    let check = db.prepare('SELECT stock FROM productos WHERE id = ?').get(testProductId);
    expect(check.stock).toBe(7);

    // Admin rechaza
    aprobacionService.rejectProductSale(sellRes.venta.id, 1, 'Comprobante falso');

    // Stock debe restaurarse a 10
    check = db.prepare('SELECT stock FROM productos WHERE id = ?').get(testProductId);
    expect(check.stock).toBe(10);
  });
});

