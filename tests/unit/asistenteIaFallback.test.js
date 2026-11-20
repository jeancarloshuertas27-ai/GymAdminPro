import { describe, it, expect } from 'vitest';
import { generarRespuestaLocalFallback } from '../../server/services/asistenteIaService.js';
import db from '../../server/db.js';

describe('Asistente IA Fallback Deportivo - Unit (US5)', () => {
  const maquinas = db.prepare('SELECT * FROM maquinas_ejercicios ORDER BY numero_maquina ASC').all();

  it('debe sugerir reemplazos equivalentes cuando la Máquina 8 (Press Banca) está ocupada', () => {
    const result = generarRespuestaLocalFallback(
      '¿Qué máquina puedo usar si la Máquina 8 de Press Banca está ocupada?',
      maquinas
    );

    expect(result.fuente).toBe('local_fallback');
    expect(result.respuesta).toContain('Máquina #08');
    expect(result.sugerencias_maquinas.length).toBeGreaterThan(0);
    // No debe sugerir la misma Máquina 8 ocupada
    expect(result.sugerencias_maquinas.some((m) => m.numero === 8)).toBe(false);
    // Debe sugerir máquinas de pectoral
    expect(result.sugerencias_maquinas.some((m) => [9, 14, 15, 16].includes(m.numero))).toBe(true);
  });

  it('debe responder con tiempos de descanso estructurados en español de Perú', () => {
    const result = generarRespuestaLocalFallback('¿Cuánto descanso debo tomar para hipertrofia?', maquinas);

    expect(result.fuente).toBe('local_fallback');
    expect(result.respuesta.toLowerCase()).toContain('hipertrofia');
    expect(result.respuesta).toContain('90s');
  });

  it('debe orientar hacia el botón Llamar Coach en consultas de postura o molestia', () => {
    const result = generarRespuestaLocalFallback('¿Cómo cuido mi postura y técnica en sala?', maquinas);

    expect(result.fuente).toBe('local_fallback');
    expect(result.respuesta).toContain('Llamar Coach');
  });
});
