import { describe, it, expect } from 'vitest';
import { calculateNewExpirationDate } from '../../server/services/membresiaService.js';

describe('Membership Duration & Renewal Math Unit Tests (US2)', () => {
  it('debe sumar los días consecutivamente a partir de la fecha de caducidad futura si la membresía está activa', () => {
    // Si vence en 2026-12-12 y se agregan 30 días, la nueva fecha debe ser 2027-01-11
    const currentExpiration = '2026-12-12';
    const referenceDate = '2026-10-25'; // Hoy
    const daysToAdd = 30;

    const result = calculateNewExpirationDate(currentExpiration, daysToAdd, referenceDate);
    expect(result.newExpirationDate).toBe('2027-01-11');
    expect(result.wasActive).toBe(true);
  });

  it('debe sumar los días a partir de la fecha de hoy si la membresía está vencida', () => {
    // Si venció en 2026-08-01 (hace meses) y hoy es 2026-10-25, al sumar 30 días debe vencer en 2026-11-24
    const currentExpiration = '2026-08-01';
    const referenceDate = '2026-10-25'; // Hoy
    const daysToAdd = 30;

    const result = calculateNewExpirationDate(currentExpiration, daysToAdd, referenceDate);
    expect(result.newExpirationDate).toBe('2026-11-24');
    expect(result.wasActive).toBe(false);
  });

  it('debe calcular correctamente cuando se agregan 365 días a una membresía activa', () => {
    const currentExpiration = '2026-12-12';
    const referenceDate = '2026-10-25';
    const daysToAdd = 365;

    const result = calculateNewExpirationDate(currentExpiration, daysToAdd, referenceDate);
    expect(result.newExpirationDate).toBe('2027-12-12');
  });
});

