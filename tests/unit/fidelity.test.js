import { describe, it, expect } from 'vitest';
import { calculateFidelity, FIDELITY_LEVELS } from '../../server/utils/fidelity.js';

describe('Gamified Fidelity Ladder & Unpaid Penalty (US4)', () => {
  const currentDate = new Date('2026-10-25T12:00:00Z');

  it('debe tener exactamente los 8 niveles estipulados en la escala táctica', () => {
    expect(FIDELITY_LEVELS.length).toBe(8);
    const names = FIDELITY_LEVELS.map(f => f.name);
    expect(names).toEqual([
      'NOVATO',
      'PRINCIPIANTE',
      'PROMEDIO',
      'EN PROGRESO',
      'MUTANDO',
      'MAMADO/A',
      'DIOS/A GRIEGO/A',
      'ANIMAL',
    ]);
  });

  it('debe clasificar como NOVATO si tiene menos de 1 mes de antigüedad', () => {
    const regDate = new Date('2026-10-05T12:00:00Z'); // 20 días
    const expDate = new Date('2026-11-05T12:00:00Z');
    const result = calculateFidelity(regDate, expDate, currentDate);

    expect(result.level).toBe(1);
    expect(result.name).toBe('NOVATO');
    expect(result.penalized).toBe(false);
  });

  it('debe clasificar como MUTANDO a los 10 meses de constancia', () => {
    // 10 meses atrás ~ 304 días
    const regDate = new Date('2025-12-25T12:00:00Z');
    const expDate = new Date('2026-11-25T12:00:00Z');
    const result = calculateFidelity(regDate, expDate, currentDate);

    expect(result.level).toBe(5);
    expect(result.name).toBe('MUTANDO');
  });

  it('debe clasificar como ANIMAL (Apex) si supera los 4 años de constancia', () => {
    const regDate = new Date('2021-01-01T12:00:00Z'); // ~5.8 años
    const expDate = new Date('2026-12-01T12:00:00Z');
    const result = calculateFidelity(regDate, expDate, currentDate);

    expect(result.level).toBe(8);
    expect(result.name).toBe('ANIMAL');
    expect(result.nextLevel).toBeNull();
  });

  it('debe reiniciar automáticamente a NOVATO si lleva más de 14 días impago tras vencer', () => {
    // Atleta veterano (3 años) cuya membresía caducó hace 20 días sin renovar
    const regDate = new Date('2023-01-01T12:00:00Z');
    const expDate = new Date('2026-10-05T12:00:00Z'); // Vencida hace 20 días (>14)
    const result = calculateFidelity(regDate, expDate, currentDate);

    expect(result.level).toBe(1);
    expect(result.name).toBe('NOVATO');
    expect(result.penalized).toBe(true);
    expect(result.penalizationReason).toContain('2 semanas de impago');
  });

  it('no debe penalizar si la membresía caducó hace 10 días (<= 14 días período de gracia)', () => {
    const regDate = new Date('2025-01-25T12:00:00Z'); // ~21 meses (MAMADO/A: 1-2 años)
    const expDate = new Date('2026-10-15T12:00:00Z'); // Vencida hace 10 días
    const result = calculateFidelity(regDate, expDate, currentDate);

    expect(result.penalized).toBe(false);
    expect(result.name).toBe('MAMADO/A');
  });
});
