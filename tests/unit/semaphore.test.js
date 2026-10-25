import { describe, it, expect } from 'vitest';
import { evaluateCheckIn } from '../../server/utils/fidelity.js';

describe('Semaphore & Check-in Evaluation (US1)', () => {
  const baseDate = new Date('2026-10-25T12:00:00Z');

  it('debe otorgar VERDE_AUTORIZADO y conceder paso cuando faltan más de 10 días', () => {
    const member = {
      id: 1,
      fecha_vencimiento: '2026-11-20', // ~26 días
    };
    const result = evaluateCheckIn(member, baseDate);

    expect(result.resultado).toBe('VERDE_AUTORIZADO');
    expect(result.grantAccess).toBe(true);
    expect(result.titulo).toBe('ACCESO AUTORIZADO');
  });

  it('debe otorgar NARANJA_AVISO concediendo paso físico automático con aviso cuando faltan entre 1 y 10 días', () => {
    const member = {
      id: 2,
      fecha_vencimiento: '2026-11-02', // 8 días
    };
    const result = evaluateCheckIn(member, baseDate);

    expect(result.resultado).toBe('NARANJA_AVISO');
    expect(result.grantAccess).toBe(true);
    expect(result.warningMessage).toContain('8 días');
    expect(result.kicker).toContain('PASO CONCEDIDO');
  });

  it('debe otorgar ROJO_DENEGADO y bloquear paso cuando la membresía está vencida (0 días o menos)', () => {
    const member = {
      id: 3,
      fecha_vencimiento: '2026-10-15', // Vencida hace 10 días
    };
    const result = evaluateCheckIn(member, baseDate);

    expect(result.resultado).toBe('ROJO_DENEGADO');
    expect(result.grantAccess).toBe(false);
    expect(result.titulo).toBe('ACCESO DENEGADO');
    expect(result.kicker).toContain('PASO BLOQUEADO');
  });

  it('debe otorgar ROJO_DENEGADO si el miembro no existe o no tiene membresía activa', () => {
    const result = evaluateCheckIn(null, baseDate);

    expect(result.resultado).toBe('ROJO_DENEGADO');
    expect(result.grantAccess).toBe(false);
    expect(result.motivo).toBe('DNI NO REGISTRADO EN EL PADRÓN');
  });
});

