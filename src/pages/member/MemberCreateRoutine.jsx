import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Plus, ArrowUp, ArrowDown, X, SlidersHorizontal, Save, ArrowLeft, Search } from 'lucide-react';

const DIAS_MOVIL = [
  { key: 'LUNES', short: 'LUN', label: 'Lunes' },
  { key: 'MARTES', short: 'MAR', label: 'Martes' },
  { key: 'MIERCOLES', short: 'MIÉ', label: 'Miércoles' },
  { key: 'JUEVES', short: 'JUE', label: 'Jueves' },
  { key: 'VIERNES', short: 'VIE', label: 'Viernes' },
  { key: 'SABADO', short: 'SÁB', label: 'Sábado' },
];

const ENFOQUE_OPCIONES = ['PERSONAL', 'PUSH', 'PULL', 'LEGS', 'UPPER', 'CORE', 'FULL BODY'];

const emptyWeek = () => ({
  LUNES: { enfoque_muscular: 'PUSH', ejercicios: [] },
  MARTES: { enfoque_muscular: 'PULL', ejercicios: [] },
  MIERCOLES: { enfoque_muscular: 'LEGS', ejercicios: [] },
  JUEVES: { enfoque_muscular: 'PERSONAL', ejercicios: [] },
  VIERNES: { enfoque_muscular: 'UPPER', ejercicios: [] },
  SABADO: { enfoque_muscular: 'CORE', ejercicios: [] },
});

export default function MemberCreateRoutine({ onBack, onCreated }) {
  const { authFetch } = useAuth();
  const [maquinas, setMaquinas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDay, setActiveDay] = useState('LUNES');
  const [schedule, setSchedule] = useState(emptyWeek);
  const [dragOver, setDragOver] = useState(false);

  const [exerciseModal, setExerciseModal] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaquinas = async () => {
      try {
        const res = await authFetch('/api/rutinas/maquinas');
        if (res.ok) {
          const data = await res.json();
          setMaquinas(data.maquinas || []);
        }
      } catch (err) {
        console.error('Error cargando máquinas:', err);
      }
    };
    fetchMaquinas();
  }, [authFetch]);

  const currentDayData = schedule[activeDay];
  const totalExercises = Object.values(schedule).reduce((acc, d) => acc + d.ejercicios.length, 0);

  const openConfig = (maquina) => {
    setExerciseModal({
      maquina,
      editIndex: null,
      series: 4,
      repeticiones: '10-12',
      tiempo_descanso_segundos: 90,
    });
  };

  const handleConfirmExercise = (e) => {
    e.preventDefault();
    if (!exerciseModal) return;

    const { maquina, editIndex, series, repeticiones, tiempo_descanso_segundos } = exerciseModal;
    const item = {
      maquina_id: maquina.id,
      numero_maquina: maquina.numero_maquina,
      codigo_etiqueta: maquina.codigo_etiqueta,
      nombre: maquina.nombre,
      grupo_muscular: maquina.grupo_muscular,
      series: Math.max(1, parseInt(series, 10) || 4),
      repeticiones: String(repeticiones || '10-12').trim(),
      tiempo_descanso_segundos: Math.max(0, parseInt(tiempo_descanso_segundos, 10) || 90),
    };

    setSchedule((prev) => {
      const list = [...prev[activeDay].ejercicios];
      if (editIndex !== null && editIndex >= 0) {
        list[editIndex] = item;
      } else {
        list.push(item);
      }
      return {
        ...prev,
        [activeDay]: { ...prev[activeDay], ejercicios: list },
      };
    });
    setExerciseModal(null);
  };

  const handleMove = (idx, delta) => {
    setSchedule((prev) => {
      const list = [...prev[activeDay].ejercicios];
      const target = idx + delta;
      if (target < 0 || target >= list.length) return prev;
      [list[idx], list[target]] = [list[target], list[idx]];
      return {
        ...prev,
        [activeDay]: { ...prev[activeDay], ejercicios: list },
      };
    });
  };

  const handleRemove = (idx) => {
    setSchedule((prev) => ({
      ...prev,
      [activeDay]: {
        ...prev[activeDay],
        ejercicios: prev[activeDay].ejercicios.filter((_, i) => i !== idx),
      },
    }));
  };

  const handleSavePrivateRoutine = async (e) => {
    e.preventDefault();
    if (!routineName.trim()) return;
    setSaving(true);
    setError(null);

    const diasPayload = DIAS_MOVIL.map((d) => ({
      dia_semana: d.key,
      enfoque_muscular: schedule[d.key].enfoque_muscular,
      ejercicios: schedule[d.key].ejercicios.map((ex, i) => ({
        ...ex,
        orden_secuencial: i + 1,
      })),
    }));

    try {
      const res = await authFetch('/api/rutinas/privadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: routineName.trim(),
          dias: diasPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar tu rutina privada.');
      }

      setSaveModalOpen(false);
      if (onCreated) onCreated(data.rutina);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredMaquinas = maquinas.filter((m) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      m.nombre.toLowerCase().includes(q) ||
      m.grupo_muscular.toLowerCase().includes(q) ||
      m.codigo_etiqueta.toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-gutter-mobile space-y-4 pb-10">
      {/* Cabecera de privacidad */}
      <div className="bg-surface-container-high rounded-xl p-4 border border-primary/30 space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 font-data-mono text-xs text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Mi Rutina
          </button>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-lowest text-primary font-data-mono text-[10px] uppercase font-bold">
            <Lock className="w-3 h-3" /> Solo Privada
          </span>
        </div>
        <h2 className="font-headline-lg text-xl uppercase text-on-surface font-bold">
          Crear Rutina Personal
        </h2>
        <p className="font-body-sm text-xs text-on-surface-variant">
          Esta rutina es privada y solo tú puedes verla o modificarla. No aparece en el sistema del Administrador ni de Recepción.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-error-container text-on-error-container font-data-mono text-xs border border-error/40">
          {error}
        </div>
      )}

      {/* Selector de días Lunes a Sábado */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
        {DIAS_MOVIL.map((d) => {
          const isSelected = activeDay === d.key;
          const count = schedule[d.key].ejercicios.length;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setActiveDay(d.key)}
              className={`flex-1 min-w-[54px] py-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="font-headline-md text-sm font-bold leading-none">{d.short}</span>
              <span className="font-data-mono text-[10px] mt-1 opacity-80">{count} ex</span>
            </button>
          );
        })}
      </div>

      {/* Zona de día activo (soporta drop o agregado rápido) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          try {
            const raw = e.dataTransfer.getData('application/json');
            if (raw) openConfig(JSON.parse(raw));
          } catch {
            // ignorar
          }
        }}
        className={`rounded-xl p-3 border-2 transition-all space-y-2.5 ${
          dragOver
            ? 'border-primary bg-primary-container/10'
            : 'border-outline-variant/25 bg-surface-container-lowest'
        }`}
      >
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-outline-variant/20">
          <span className="font-headline-md text-base uppercase text-primary font-bold">
            {DIAS_MOVIL.find((d) => d.key === activeDay)?.label}
          </span>
          <select
            value={currentDayData.enfoque_muscular}
            onChange={(e) =>
              setSchedule((prev) => ({
                ...prev,
                [activeDay]: { ...prev[activeDay], enfoque_muscular: e.target.value },
              }))
            }
            className="bg-surface-container text-tertiary font-data-mono text-[11px] uppercase px-2 py-1 rounded border border-outline-variant/30"
          >
            {ENFOQUE_OPCIONES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {currentDayData.ejercicios.length === 0 ? (
          <div className="py-6 text-center text-on-surface-variant/60 font-data-mono text-xs border border-dashed border-outline-variant/30 rounded-lg">
            Arrastra o toca "+" en una máquina abajo para agregarla a este día
          </div>
        ) : (
          <div className="space-y-2">
            {currentDayData.ejercicios.map((ex, idx) => (
              <div
                key={`${ex.maquina_id}-${idx}`}
                className="flex items-center justify-between p-2.5 bg-surface-container rounded-lg border border-outline-variant/20 gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-data-mono text-xs bg-primary text-on-primary font-bold px-1.5 py-0.5 rounded shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="min-w-0">
                    <p className="font-headline-md text-sm text-on-surface uppercase truncate leading-tight">
                      {ex.nombre}
                    </p>
                    <p className="font-data-mono text-[11px] text-on-surface-variant">
                      {ex.series} series • {ex.repeticiones} reps • {ex.tiempo_descanso_segundos}s
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, -1)}
                    className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center text-on-surface disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === currentDayData.ejercicios.length - 1}
                    onClick={() => handleMove(idx, 1)}
                    className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center text-on-surface disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setExerciseModal({
                        maquina: {
                          id: ex.maquina_id,
                          numero_maquina: ex.numero_maquina,
                          codigo_etiqueta: ex.codigo_etiqueta,
                          nombre: ex.nombre,
                          grupo_muscular: ex.grupo_muscular,
                        },
                        editIndex: idx,
                        series: ex.series,
                        repeticiones: ex.repeticiones,
                        tiempo_descanso_segundos: ex.tiempo_descanso_segundos,
                      })
                    }
                    className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center text-primary cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center text-error cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catálogo de máquinas para agregar */}
      <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/20 space-y-2.5">
        <span className="font-label-badge text-xs uppercase text-on-surface block">
          Agregar Máquina a {DIAS_MOVIL.find((d) => d.key === activeDay)?.label}
        </span>

        <div className="relative">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar máquina o músculo..."
            className="w-full bg-surface-container-lowest text-on-surface text-xs pl-9 pr-3 py-2 rounded-lg border border-outline-variant/30 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
          {filteredMaquinas.map((m) => (
            <div
              key={m.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(m));
              }}
              className="flex items-center justify-between p-2 rounded-lg bg-surface-container-high border border-outline-variant/15"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-data-mono text-[11px] font-bold text-primary bg-surface-container-lowest px-1.5 py-0.5 rounded shrink-0">
                  {m.codigo_etiqueta}
                </span>
                <div className="min-w-0">
                  <p className="font-label-badge text-xs text-on-surface uppercase truncate">{m.nombre}</p>
                  <p className="font-data-mono text-[10px] text-on-surface-variant truncate">{m.grupo_muscular}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openConfig(m)}
                className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Botón Guardar Rutina */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={totalExercises === 0}
          onClick={() => {
            setRoutineName('');
            setSaveModalOpen(true);
          }}
          className="w-full py-3.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-headline-md text-base uppercase font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-40"
        >
          <Save className="w-5 h-5" />
          <span>Guardar rutina</span>
        </button>
      </div>

      {/* Modal Series / Reps / Descanso */}
      {exerciseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmExercise}
            className="w-full max-w-[380px] bg-surface-container border-2 border-primary/60 rounded-2xl p-4 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline-md text-base uppercase text-on-surface font-bold truncate pr-2">
                {exerciseModal.maquina.nombre}
              </h3>
              <button
                type="button"
                onClick={() => setExerciseModal(null)}
                className="p-1 rounded bg-surface-container-high text-on-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-data-mono text-[10px] uppercase text-on-surface-variant block mb-1">
                  Series
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={exerciseModal.series}
                  onChange={(e) => setExerciseModal((prev) => ({ ...prev, series: e.target.value }))}
                  className="w-full bg-surface-container-lowest text-on-surface font-data-mono text-sm px-2.5 py-2 rounded-lg border border-outline-variant/30"
                />
              </div>
              <div>
                <label className="font-data-mono text-[10px] uppercase text-on-surface-variant block mb-1">
                  Repeticiones
                </label>
                <input
                  type="text"
                  value={exerciseModal.repeticiones}
                  onChange={(e) => setExerciseModal((prev) => ({ ...prev, repeticiones: e.target.value }))}
                  className="w-full bg-surface-container-lowest text-on-surface font-data-mono text-sm px-2.5 py-2 rounded-lg border border-outline-variant/30"
                />
              </div>
              <div>
                <label className="font-data-mono text-[10px] uppercase text-on-surface-variant block mb-1">
                  Descanso (s)
                </label>
                <input
                  type="number"
                  min={0}
                  max={600}
                  value={exerciseModal.tiempo_descanso_segundos}
                  onChange={(e) =>
                    setExerciseModal((prev) => ({ ...prev, tiempo_descanso_segundos: e.target.value }))
                  }
                  className="w-full bg-surface-container-lowest text-on-surface font-data-mono text-sm px-2.5 py-2 rounded-lg border border-outline-variant/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setExerciseModal(null)}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-xs uppercase font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-primary-container text-on-primary-container text-xs uppercase font-bold"
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Nombre de Rutina Privada */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePrivateRoutine}
            className="w-full max-w-[380px] bg-surface-container border-2 border-primary/60 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <h3 className="font-headline-md text-lg uppercase text-on-surface font-bold">
              Nombre de tu Rutina Privada
            </h3>
            <input
              type="text"
              autoFocus
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="Ej: Mi Rutina Brazos y Hombros"
              className="w-full bg-surface-container-lowest text-on-surface px-3 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-xs uppercase font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!routineName.trim() || saving}
                className="px-5 py-2 rounded-lg bg-primary-container text-on-primary-container text-xs uppercase font-bold disabled:opacity-40"
              >
                {saving ? 'Guardando...' : 'Aceptar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
