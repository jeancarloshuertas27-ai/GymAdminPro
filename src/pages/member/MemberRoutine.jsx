import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell, SlidersHorizontal, Lock, Plus, Trash2, CheckCircle, X } from 'lucide-react';

const DAY_LABELS = {
  LUNES: 'LUN',
  MARTES: 'MAR',
  MIERCOLES: 'MIÉ',
  JUEVES: 'JUE',
  VIERNES: 'VIE',
  SABADO: 'SÁB',
};

export default function MemberRoutine({ onGoToCreate }) {
  const { authFetch } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('asignada'); // 'asignada' | 'privada'
  const [data, setData] = useState({ rutina_asignada: null, rutinas_privadas: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('LUNES');
  const [selectedPrivateDay, setSelectedPrivateDay] = useState('LUNES');

  // Modal de ajuste rápido de series y descanso por serie
  const [adjustModal, setAdjustModal] = useState(null); // { id, nombre, series, tiempo_descanso_segundos }
  const [savingAdjust, setSavingAdjust] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchRoutine = useCallback(async () => {
    try {
      const res = await authFetch('/api/rutinas/mi-rutina');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error al cargar rutina del miembro:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchRoutine();
  }, [fetchRoutine]);

  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    if (!adjustModal) return;
    setSavingAdjust(true);

    try {
      const res = await authFetch('/api/rutinas/mi-rutina/ajustar-ejercicio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rutina_ejercicio_id: adjustModal.id,
          series_custom: Number(adjustModal.series),
          descanso_custom_segundos: Number(adjustModal.tiempo_descanso_segundos),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al guardar ajustes');

      setAdjustModal(null);
      setToast('Series y descanso actualizados para tu sesión.');
      setTimeout(() => setToast(null), 3500);
      fetchRoutine();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingAdjust(false);
    }
  };

  const handleDeletePrivate = async (id) => {
    if (!window.confirm('¿Deseas eliminar esta rutina privada?')) return;
    try {
      const res = await authFetch(`/api/rutinas/privadas/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchRoutine();
      }
    } catch (err) {
      console.error('Error eliminando rutina privada:', err);
    }
  };

  if (loading) {
    return (
      <div className="px-gutter-mobile py-16 text-center font-data-mono text-xs text-on-surface-variant">
        Cargando tu rutina de entrenamiento...
      </div>
    );
  }

  const oficial = data.rutina_asignada;
  const diaActual = oficial?.dias?.find((d) => d.dia_semana === selectedDay);

  return (
    <div className="px-gutter-mobile space-y-4 pb-10">
      {/* Pestañas superiores: Rutina Asignada / Mi Rutina Privada */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
        <button
          type="button"
          onClick={() => setActiveSubTab('asignada')}
          className={`py-2.5 rounded-lg font-headline-md text-sm uppercase font-bold tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'asignada'
              ? 'bg-primary-container text-on-primary-container shadow'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Rutina Asignada
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('privada')}
          className={`py-2.5 rounded-lg font-headline-md text-sm uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'privada'
              ? 'bg-primary-container text-on-primary-container shadow'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Mi Rutina Privada</span>
        </button>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-primary-container/20 text-primary font-data-mono text-xs border border-primary/40 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* PESTAÑA 1: RUTINA ASIGNADA */}
      {activeSubTab === 'asignada' && (
        <>
          {!oficial ? (
            <div className="bg-surface-container rounded-2xl p-6 text-center space-y-3 border border-outline-variant/20">
              <Dumbbell className="w-10 h-10 text-primary mx-auto opacity-80" />
              <h3 className="font-headline-md text-lg uppercase text-on-surface font-bold">
                Sin rutina asignada aún
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Aún no tienes una rutina asignada por tu coach. Puedes solicitar una en recepción o crear tu propia rutina personal aquí.
              </p>
              <button
                type="button"
                onClick={onGoToCreate}
                className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-headline-md text-sm uppercase font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Rutina Personal</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Nombre del protocolo asignado */}
              <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/20">
                <span className="font-data-mono text-[10px] text-primary uppercase font-bold tracking-wider block">
                  RUTINA ASIGNADA
                </span>
                <h2 className="font-headline-lg text-2xl uppercase text-on-surface font-extrabold leading-tight mt-0.5">
                  {oficial.nombre}
                </h2>
              </div>

              {/* Carrusel selector de días (LUN - SÁB) */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                {oficial.dias.map((d) => {
                  const isSel = selectedDay === d.dia_semana;
                  const isRest = d.enfoque_muscular === 'REST' || d.ejercicios.length === 0;
                  return (
                    <button
                      key={d.dia_semana}
                      type="button"
                      onClick={() => setSelectedDay(d.dia_semana)}
                      className={`flex-shrink-0 min-w-[62px] h-[68px] px-2 py-1.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSel
                          ? 'bg-primary-container text-on-primary-container shadow-lg'
                          : isRest
                          ? 'bg-surface-container-lowest text-outline opacity-65'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="font-headline-md text-base font-bold leading-none">
                        {DAY_LABELS[d.dia_semana] || d.dia_semana.slice(0, 3)}
                      </span>
                      <span className="font-data-mono text-[10px] mt-1 font-bold uppercase truncate max-w-[54px]">
                        {isRest ? 'REST' : d.enfoque_muscular}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Ejercicios del día seleccionado */}
              {!diaActual || diaActual.ejercicios.length === 0 ? (
                <div className="bg-surface-container-low rounded-xl p-8 text-center border border-outline-variant/20">
                  <span className="font-headline-md text-lg uppercase text-on-surface-variant font-bold block">
                    DÍA DE DESCANSO / REST
                  </span>
                  <p className="font-body-sm text-xs text-outline mt-1">
                    Recuperación muscular activa. Hidrátate bien para tu siguiente sesión.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-headline-md text-base uppercase text-primary font-bold">
                      {diaActual.dia_semana}: {diaActual.enfoque_muscular}
                    </span>
                    <span className="font-data-mono text-xs text-on-surface-variant">
                      {diaActual.ejercicios.length} ejercicios
                    </span>
                  </div>

                  {diaActual.ejercicios.map((ex, idx) => (
                    <article
                      key={ex.id}
                      className="bg-surface-container rounded-xl p-4 shadow-md border border-outline-variant/20 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-primary-container text-on-primary-container font-data-mono text-xs font-bold px-2 py-0.5 rounded">
                              {idx + 1}.
                            </span>
                            <span className="font-data-mono text-[11px] text-tertiary uppercase font-bold">
                              {ex.grupo_muscular}
                            </span>
                          </div>
                          <h3 className="font-headline-md text-lg text-on-surface uppercase font-bold leading-snug">
                            {ex.nombre}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setAdjustModal({
                              id: ex.id,
                              nombre: ex.nombre,
                              series: ex.series,
                              tiempo_descanso_segundos: ex.tiempo_descanso_segundos,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary font-data-mono text-[11px] uppercase font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Ajustar</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-2.5 rounded-lg text-center">
                        <div>
                          <span className="font-data-mono text-[10px] text-outline block uppercase">Series</span>
                          <span className="font-headline-md text-lg text-on-surface font-bold">{ex.series}</span>
                        </div>
                        <div>
                          <span className="font-data-mono text-[10px] text-outline block uppercase">Reps</span>
                          <span className="font-headline-md text-lg text-on-surface font-bold">{ex.repeticiones}</span>
                        </div>
                        <div>
                          <span className="font-data-mono text-[10px] text-outline block uppercase">Descanso</span>
                          <span className="font-headline-md text-lg text-primary font-bold">
                            {ex.tiempo_descanso_segundos}s
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* PESTAÑA 2: MI RUTINA PRIVADA */}
      {activeSubTab === 'privada' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 bg-surface-container-high p-3.5 rounded-xl border border-primary/25">
            <div>
              <span className="font-label-badge text-xs uppercase text-primary font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Rutinas Personales Privadas
              </span>
              <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                Visibles únicamente en tu perfil móvil.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoToCreate}
              className="px-3.5 py-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-headline-md text-xs uppercase font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Rutina</span>
            </button>
          </div>

          {data.rutinas_privadas.length === 0 ? (
            <div className="bg-surface-container rounded-xl p-6 text-center space-y-2 border border-outline-variant/20">
              <p className="font-body-sm text-sm text-on-surface-variant">
                Aún no has creado ninguna rutina personal privada.
              </p>
              <button
                type="button"
                onClick={onGoToCreate}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary font-label-badge text-xs uppercase cursor-pointer"
              >
                + Crear mi primera rutina
              </button>
            </div>
          ) : (
            data.rutinas_privadas.map((rp) => {
              const pDia = rp.dias?.find((d) => d.dia_semana === selectedPrivateDay);
              return (
                <div
                  key={rp.id}
                  className="bg-surface-container rounded-2xl p-4 border border-outline-variant/25 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-outline-variant/15">
                    <div>
                      <span className="font-data-mono text-[10px] text-tertiary uppercase font-bold">
                        PRIVADA // SOLO TÚ
                      </span>
                      <h3 className="font-headline-md text-lg uppercase text-on-surface font-bold">
                        {rp.nombre}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePrivate(rp.id)}
                      className="p-2 rounded-lg bg-surface-container-high hover:bg-error-container text-error cursor-pointer"
                      title="Eliminar rutina privada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Selector días dentro de rutina privada */}
                  <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
                    {Object.entries(DAY_LABELS).map(([dayKey, shortLabel]) => {
                      const dInfo = rp.dias?.find((d) => d.dia_semana === dayKey);
                      const count = dInfo?.ejercicios?.length || 0;
                      const isSel = selectedPrivateDay === dayKey;
                      return (
                        <button
                          key={dayKey}
                          type="button"
                          onClick={() => setSelectedPrivateDay(dayKey)}
                          className={`flex-1 min-w-[46px] py-1.5 rounded-lg flex flex-col items-center cursor-pointer ${
                            isSel
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-surface-container-low text-on-surface-variant'
                          }`}
                        >
                          <span className="font-headline-md text-xs font-bold">{shortLabel}</span>
                          <span className="font-data-mono text-[9px] opacity-80">{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {!pDia || pDia.ejercicios.length === 0 ? (
                    <p className="font-data-mono text-xs text-center text-outline py-3">
                      DÍA DE DESCANSO / REST
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pDia.ejercicios.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-data-mono text-xs font-bold text-primary shrink-0">
                              {idx + 1}.
                            </span>
                            <span className="font-body-sm text-xs text-on-surface font-semibold truncate">
                              {ex.nombre}
                            </span>
                          </div>
                          <span className="font-data-mono text-[10px] text-on-surface-variant shrink-0">
                            {ex.series}x{ex.repeticiones} ({ex.tiempo_descanso_segundos}s)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal para ajustar series y descanso de ejercicio oficial */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAdjust}
            className="w-full max-w-[360px] bg-surface-container border-2 border-primary/60 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline-md text-base uppercase text-on-surface font-bold truncate pr-2">
                Ajustar: {adjustModal.nombre}
              </h3>
              <button
                type="button"
                onClick={() => setAdjustModal(null)}
                className="p-1 rounded bg-surface-container-high text-on-surface-variant cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-data-mono text-[11px] uppercase text-on-surface-variant block mb-1">
                  Número de Series
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={adjustModal.series}
                  onChange={(e) => setAdjustModal((prev) => ({ ...prev, series: e.target.value }))}
                  className="w-full bg-surface-container-lowest text-on-surface font-data-mono text-base px-3 py-2 rounded-lg border border-outline-variant/40"
                />
              </div>
              <div>
                <label className="font-data-mono text-[11px] uppercase text-on-surface-variant block mb-1">
                  Descanso por Serie (s)
                </label>
                <input
                  type="number"
                  min={0}
                  max={600}
                  value={adjustModal.tiempo_descanso_segundos}
                  onChange={(e) =>
                    setAdjustModal((prev) => ({ ...prev, tiempo_descanso_segundos: e.target.value }))
                  }
                  className="w-full bg-surface-container-lowest text-on-surface font-data-mono text-base px-3 py-2 rounded-lg border border-outline-variant/40"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustModal(null)}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-xs uppercase font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingAdjust}
                className="px-5 py-2 rounded-lg bg-primary-container text-on-primary-container text-xs uppercase font-bold cursor-pointer"
              >
                {savingAdjust ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
