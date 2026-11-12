import { describe, it, expect } from 'vitest';
import { sanitizeProductForRole } from '../../server/services/productoService.js';

describe('Product Cost Privacy & Stock Filtering Unit Tests (US3)', () => {
  const sampleProduct = {
    id: 1,
    sku: 'SKU-PROT-01',
    nombre: 'Whey Isolate 2kg Gold',
    precio_venta: 249.00,
    precio_costo: 160.00,
    stock: 14,
    activo: 1
  };

  const outOfStockProduct = {
    id: 5,
    sku: 'SKU-SNK-04',
    nombre: 'Barra Proteica Quest Crunch',
    precio_venta: 14.00,
    precio_costo: 8.20,
    stock: 0,
    activo: 1
  };

  it('debe mantener precio_costo y calcular margen_porcentaje únicamente para ADMINISTRADOR', () => {
    const sanitized = sanitizeProductForRole(sampleProduct, 'ADMINISTRADOR');
    expect(sanitized.precio_costo).toBe(160.00);
    expect(sanitized.margen_porcentaje).toBeDefined();
    expect(typeof sanitized.margen_porcentaje).toBe('number');
  });

  it('debe omitir completamente precio_costo y margen_porcentaje para RECEPCIONISTA', () => {
    const sanitized = sanitizeProductForRole(sampleProduct, 'RECEPCIONISTA');
    expect(sanitized.precio_costo).toBeUndefined();
    expect(sanitized.margen_porcentaje).toBeUndefined();
    expect(sanitized.precio_venta).toBe(249.00);
    expect(sanitized.stock).toBe(14);
  });

  it('debe omitir completamente precio_costo para MIEMBRO', () => {
    const sanitized = sanitizeProductForRole(sampleProduct, 'MIEMBRO');
    expect(sanitized.precio_costo).toBeUndefined();
    expect(sanitized.margen_porcentaje).toBeUndefined();
  });

  it('debe retornar null para productos con stock = 0 cuando el rol es MIEMBRO (ocultamiento)', () => {
    const sanitized = sanitizeProductForRole(outOfStockProduct, 'MIEMBRO');
    expect(sanitized).toBeNull();
  });

  it('debe conservar productos con stock = 0 para RECEPCIONISTA y ADMINISTRADOR para visualización translúcida', () => {
    const adminView = sanitizeProductForRole(outOfStockProduct, 'ADMINISTRADOR');
    expect(adminView).not.toBeNull();
    expect(adminView.stock).toBe(0);

    const recepView = sanitizeProductForRole(outOfStockProduct, 'RECEPCIONISTA');
    expect(recepView).not.toBeNull();
    expect(recepView.stock).toBe(0);
    expect(recepView.precio_costo).toBeUndefined();
  });
});

