import { describe, it, expect } from 'vitest';
import { canMemberAccessPromo } from '../../server/services/promocionService.js';

describe('Promocion Fidelity Filtering Unit Tests (US1)', () => {
  it('debe permitir acceso a cualquier nivel si el público objetivo es TODOS', () => {
    expect(canMemberAccessPromo('NOVATO', 'TODOS')).toBe(true);
    expect(canMemberAccessPromo('MUTANDO', 'TODOS')).toBe(true);
    expect(canMemberAccessPromo('ANIMAL', 'TODOS')).toBe(true);
  });

  it('debe restringir la promoción si el miembro tiene menor nivel que el requerido', () => {
    // Requerido: MUTANDO (nivel 5)
    expect(canMemberAccessPromo('NOVATO', 'MUTANDO')).toBe(false);
    expect(canMemberAccessPromo('PRINCIPIANTE', 'MUTANDO')).toBe(false);
    expect(canMemberAccessPromo('PROMEDIO', 'MUTANDO')).toBe(false);
    expect(canMemberAccessPromo('EN_PROGRESO', 'MUTANDO')).toBe(false);
  });

  it('debe conceder acceso si el miembro tiene nivel igual o superior al requerido', () => {
    // Requerido: MUTANDO (nivel 5)
    expect(canMemberAccessPromo('MUTANDO', 'MUTANDO')).toBe(true);
    expect(canMemberAccessPromo('MAMADO', 'MUTANDO')).toBe(true);
    expect(canMemberAccessPromo('DIOS_GRIEGO', 'MUTANDO')).toBe(true);
    expect(canMemberAccessPromo('ANIMAL', 'MUTANDO')).toBe(true);
  });
});

