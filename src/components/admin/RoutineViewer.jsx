import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, Dumbbell } from 'lucide-react';

const DIAS_LABELS = {
  LUNES: 'LUNES',
  MARTES: 'MARTES',
  MIERCOLES: 'MIÉRCOLES',
  JUEVES: 'JUEVES',
  VIERNES: 'VIERNES',
  SABADO: 'SÁBADO',
};

export default function RoutineViewer() {
  const { authFetch } = useAuth();
  const [plantillas, setPlantillas] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPlantillas = useCallback(async () => {
    try {
      const res = await authFetch('/api/rutinas/plantillas');
      if (res.ok) {
        const data = await res.json();
        const list = data.plantillas || [];
        setPlantillas(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(String(list[0].id));
        }
      }
    } catch (err) {
      console.error('Error cargando rutinas preconfiguradas:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch, selectedId]);

  useEffect(() => {
    fetchPlantillas();
  }, [fetchPlantillas]);

  const selectedPlantilla = plantillas.find((p) => String(p.id) === String(selectedId)) || plantillas[0];

  return (
    <section className="flex flex-col gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-xl border border-outline-variant/20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
        <div>
          <span className="font-data-mono text-[11px] text-primary uppercase font-bold tracking-widest block">
            CONSULTA DE RUTINAS PRECONFIGURADAS (SOLO LECTURA)
          </span>
          <h2 className="font-headline-lg text-2xl uppercase tracking-wide text-on-surface font-bold flex items-center gap-2">
            <Eye className="w-6 h-6 text-primary" />
            <span>Ver Rutinas del Gimnasio</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-xl border border-outline-variant/30 min-w-[280px]">
          <Dumbbell className="w-4 h-4 text-tertiary shrink-0" />
          <select
            aria-label="Seleccionar rutina para visualizar"
            value={selectedPlantilla ? String(selectedPlantilla.id) : ''}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={plantillas.length === 0}
            className="w-full bg-transparent text-on-surface font-body-sm text-sm focus:outline-none cursor-pointer"
          >
            {plantillas.length === 0 ? (
              <option value="" className="bg-surface-container text-on-surface">
                No hay rutinas preconfiguradas
              </option>
            ) : (
              plantillas.map((p) => (
                <option key={p.id} value={p.id} className="bg-surface-container text-on-surface">
                  {p.nombre} ({p.total_ejercicios} ejercicios)
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center font-data-mono text-xs text-on-surface-variant">
          Cargando rutinas preconfiguradas...
        </div>
      ) : !selectedPlantilla ? (
        <div className="py-12 text-center font-data-mono text-xs text-outline">
          El Administrador aún no ha configurado plantillas de rutinas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(selectedPlantilla.dias || []).map((dia) => {
            const ejercicios = dia.ejercicios || [];
            const isRest = ejercicios.length === 0 || dia.enfoque_muscular === 'REST';

            return (
              <div
                key={dia.dia_semana}
                className="flex flex-col bg-surface-container p-3 rounded-xl min-h-[220px] border border-outline-variant/20 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2 mb-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-lg text-xl uppercase font-extrabold text-primary tracking-wide">
                      {DIAS_LABELS[dia.dia_semana] || dia.dia_semana}
                    </span>
                    <span className="font-data-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                      {ejercicios.length}
                    </span>
                  </div>
                  <span className="bg-surface-container-lowest text-tertiary font-data-mono text-[10px] uppercase rounded px-2 py-0.5 border border-outline-variant/20 font-bold">
                    {isRest ? 'REST' : dia.enfoque_muscular}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-2 p-1.5 rounded-lg bg-surface-container-lowest/40">
                  {isRest ? (
                    <div className="flex-1 flex items-center justify-center text-center p-4 text-on-surface-variant/50 font-data-mono text-[11px] uppercase">
                      Día de descanso
                    </div>
                  ) : (
                    ejercicios.map((ex, idx) => (
                      <div
                        key={ex.id || idx}
                        className="flex flex-col bg-surface-container-high p-2.5 rounded-lg border border-outline-variant/15"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-data-mono text-[11px] bg-primary text-on-primary font-bold px-1.5 py-0.5 rounded shrink-0">
                            {idx + 1}.
                          </span>
                          <span className="font-label-badge text-xs text-on-surface uppercase truncate">
                            {ex.nombre}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-outline-variant/15 font-data-mono text-[10px] text-on-surface-variant">
                          <span>
                            {ex.series} series • {ex.repeticiones} reps • {ex.tiempo_descanso_segundos}s
                          </span>
                          <span className="text-tertiary truncate max-w-[90px]">{ex.grupo_muscular}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
