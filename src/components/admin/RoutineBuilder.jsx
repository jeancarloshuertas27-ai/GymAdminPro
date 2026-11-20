import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, Search, Plus, SlidersHorizontal, X, ArrowUp, ArrowDown, Trash2, CheckCircle, GripVertical, FolderEdit, FilePlus2 } from 'lucide-react';

const DIAS_CONFIG = [
  { key: 'LUNES', label: 'LUNES' },
  { key: 'MARTES', label: 'MARTES' },
  { key: 'MIERCOLES', label: 'MIÉRCOLES' },
  { key: 'JUEVES', label: 'JUEVES' },
  { key: 'VIERNES', label: 'VIERNES' },
  { key: 'SABADO', label: 'SÁBADO' },
];

const ENFOQUE_OPCIONES = ['GENERAL', 'PUSH', 'PULL', 'LEGS', 'UPPER', 'LOWER', 'CORE', 'FULL BODY'];

const createEmptySchedule = () => ({
  LUNES: { enfoque_muscular: 'PUSH', ejercicios: [] },
  MARTES: { enfoque_muscular: 'PULL', ejercicios: [] },
  MIERCOLES: { enfoque_muscular: 'LEGS', ejercicios: [] },
  JUEVES: { enfoque_muscular: 'GENERAL', ejercicios: [] },
  VIERNES: { enfoque_muscular: 'UPPER', ejercicios: [] },
  SABADO: { enfoque_muscular: 'CORE', ejercicios: [] },
});

export default function RoutineBuilder({ onRoutineSaved }) {
  const { authFetch } = useAuth();
  const [maquinas, setMaquinas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [selectedPlantillaId, setSelectedPlantillaId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [schedule, setSchedule] = useState(createEmptySchedule);
  const [activeDay, setActiveDay] = useState('LUNES');
  const [dragOverDay, setDragOverDay] = useState(null);

  // Modal al soltar o editar un ejercicio
  const [exerciseModal, setExerciseModal] = useState(null); // { dayKey, maquina, editIndex, series, repeticiones, tiempo_descanso_segundos }

  // Modal de Guardar Rutina (esquina inferior derecha)
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchCatalogAndPlantillas = useCallback(async () => {
    try {
      const [resMaq, resPlan] = await Promise.all([
        authFetch('/api/rutinas/maquinas'),
        authFetch('/api/rutinas/plantillas'),
      ]);
      if (resMaq.ok) {
        const data = await resMaq.json();
        setMaquinas(data.maquinas || []);
      }
      if (resPlan.ok) {
        const dataP = await resPlan.json();
        setPlantillas(dataP.plantillas || []);
      }
    } catch (err) {
      console.error('Error al cargar catálogo y plantillas:', err);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchCatalogAndPlantillas();
  }, [fetchCatalogAndPlantillas]);

  const handleSelectPlantillaForEdit = (idStr) => {
    setSelectedPlantillaId(idStr);
    if (!idStr) {
      setSchedule(createEmptySchedule());
      setRoutineName('');
      return;
    }

    const found = plantillas.find((p) => String(p.id) === String(idStr));
    if (!found) return;

    const loaded = createEmptySchedule();
    for (const d of found.dias || []) {
      if (loaded[d.dia_semana]) {
        loaded[d.dia_semana] = {
          enfoque_muscular: d.enfoque_muscular === 'REST' ? 'GENERAL' : (d.enfoque_muscular || 'GENERAL'),
          ejercicios: (d.ejercicios || []).map((ex) => ({
            maquina_id: ex.maquina_id,
            numero_maquina: ex.numero_maquina,
            codigo_etiqueta: ex.codigo_etiqueta,
            nombre: ex.nombre,
            grupo_muscular: ex.grupo_muscular,
            series: ex.series,
            repeticiones: ex.repeticiones,
            tiempo_descanso_segundos: ex.tiempo_descanso_segundos,
          })),
        };
      }
    }

    setSchedule(loaded);
    setRoutineName(found.nombre);
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

  const totalExercises = Object.values(schedule).reduce((acc, d) => acc + d.ejercicios.length, 0);

  // Drag & Drop handlers
  const handleDragStart = (e, maquina) => {
    e.dataTransfer.setData('application/json', JSON.stringify(maquina));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e, dayKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverDay !== dayKey) setDragOverDay(dayKey);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const openConfigForMachine = (dayKey, maquina) => {
    setActiveDay(dayKey);
    setExerciseModal({
      dayKey,
      maquina,
      editIndex: null,
      series: 4,
      repeticiones: '8-12',
      tiempo_descanso_segundos: 90,
    });
  };

  const handleDrop = (e, dayKey) => {
    e.preventDefault();
    setDragOverDay(null);
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const maquina = JSON.parse(raw);
      openConfigForMachine(dayKey, maquina);
    } catch (err) {
      console.error('Error al soltar máquina:', err);
    }
  };

  const handleConfirmExerciseModal = (e) => {
    e.preventDefault();
    if (!exerciseModal) return;

    const { dayKey, maquina, editIndex, series, repeticiones, tiempo_descanso_segundos } = exerciseModal;
    const item = {
      maquina_id: maquina.id,
      numero_maquina: maquina.numero_maquina,
      codigo_etiqueta: maquina.codigo_etiqueta,
      nombre: maquina.nombre,
      grupo_muscular: maquina.grupo_muscular,
      series: Math.max(1, parseInt(series, 10) || 4),
      repeticiones: String(repeticiones || '8-12').trim(),
      tiempo_descanso_segundos: Math.max(0, parseInt(tiempo_descanso_segundos, 10) || 90),
    };

    setSchedule((prev) => {
      const currentDay = prev[dayKey];
      const nextEjercicios = [...currentDay.ejercicios];
      if (editIndex !== null && editIndex >= 0) {
        nextEjercicios[editIndex] = item;
      } else {
        nextEjercicios.push(item);
      }
      return {
        ...prev,
        [dayKey]: {
          ...currentDay,
          ejercicios: nextEjercicios,
        },
      };
    });

    setExerciseModal(null);
  };

  const handleRemoveExercise = (dayKey, idx) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        ejercicios: prev[dayKey].ejercicios.filter((_, i) => i !== idx),
      },
    }));
  };

  const handleMoveExercise = (dayKey, idx, delta) => {
    setSchedule((prev) => {
      const list = [...prev[dayKey].ejercicios];
      const targetIdx = idx + delta;
      if (targetIdx < 0 || targetIdx >= list.length) return prev;
      [list[idx], list[targetIdx]] = [list[targetIdx], list[idx]];
      return {
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          ejercicios: list,
        },
      };
    });
  };

  const handleClearDay = (dayKey) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        ejercicios: [],
      },
    }));
  };

  const handleSaveRoutineSubmit = async (e) => {
    e.preventDefault();
    if (!routineName.trim()) return;
    setSaving(true);
    setFeedback(null);

    const diasPayload = DIAS_CONFIG.map((d) => ({
      dia_semana: d.key,
      enfoque_muscular: schedule[d.key].enfoque_muscular,
      ejercicios: schedule[d.key].ejercicios.map((ex, idx) => ({
        maquina_id: ex.maquina_id,
        orden_secuencial: idx + 1,
        series: ex.series,
        repeticiones: ex.repeticiones,
        tiempo_descanso_segundos: ex.tiempo_descanso_segundos,
      })),
    }));

    try {
      const isEditing = Boolean(selectedPlantillaId);
      const endpoint = isEditing
        ? `/api/rutinas/plantillas/${selectedPlantillaId}`
        : '/api/rutinas/plantillas';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: routineName.trim(),
          dias: diasPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar rutina');
      }

      setSaveModalOpen(false);
      setFeedback({
        type: 'success',
        text: isEditing
          ? `Rutina "${data.plantilla.nombre}" actualizada correctamente.`
          : `Rutina "${data.plantilla.nombre}" guardada en la base de datos.`,
      });
      setTimeout(() => setFeedback(null), 5000);

      await fetchCatalogAndPlantillas();
      if (!isEditing) {
        setSelectedPlantillaId('');
        setRoutineName('');
        setSchedule(createEmptySchedule());
      } else {
        setRoutineName(data.plantilla.nombre);
      }

      if (onRoutineSaved) onRoutineSaved(data.plantilla);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-xl border border-outline-variant/20">
      {/* Cabecera limpia y Selector de Rutina Existente para Modificar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
        <div>
          <span className="font-data-mono text-[11px] text-primary uppercase font-bold tracking-widest block">
            CONFIGURACIÓN DE ENTRENAMIENTO SEMANAL
          </span>
          <h2 className="font-headline-lg text-2xl uppercase tracking-wide text-on-surface font-bold">
            Configurar Rutinas (Drag &amp; Drop)
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/30">
            <FolderEdit className="w-4 h-4 text-primary shrink-0" />
            <select
              aria-label="Seleccionar rutina para editar o crear nueva"
              value={selectedPlantillaId}
              onChange={(e) => handleSelectPlantillaForEdit(e.target.value)}
              className="bg-transparent text-on-surface font-body-sm text-sm focus:outline-none cursor-pointer min-w-[240px]"
            >
              <option value="" className="bg-surface-container text-on-surface">
                + Crear nueva rutina en blanco
              </option>
              {plantillas.map((p) => (
                <option key={p.id} value={p.id} className="bg-surface-container text-on-surface">
                  Editar: {p.nombre} ({p.total_ejercicios} ej.)
                </option>
              ))}
            </select>
          </div>

          {selectedPlantillaId && (
            <button
              type="button"
              onClick={() => handleSelectPlantillaForEdit('')}
              className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface-variant font-label-badge text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Nueva rutina</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg font-data-mono text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-primary-container/20 text-primary border-primary/40'
              : 'bg-error-container text-on-error-container border-error/40'
          }`}
        >
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {feedback.text}
          </span>
          <button type="button" onClick={() => setFeedback(null)} className="hover:underline font-bold">
            CERRAR
          </button>
        </div>
      )}

      {/* Grid dividido 12 cols: 4 cols catálogo máquinas | 8 cols días de la semana */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        {/* COLUMNA IZQUIERDA: MÁQUINAS Y EJERCICIOS NUMERADOS */}
        <div className="xl:col-span-4 bg-surface-container rounded-xl p-space-md border border-outline-variant/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface">
              Máquinas &amp; Ejercicios ({maquinas.length})
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar máquina o músculo..."
              className="w-full bg-surface-container-lowest text-on-surface font-body-sm text-sm pl-9 pr-3 py-2 rounded-lg border border-outline-variant/30 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[540px] overflow-y-auto pr-1">
            {filteredMaquinas.map((m) => (
              <div
                key={m.id}
                draggable
                onDragStart={(e) => handleDragStart(e, m)}
                className="group flex items-center justify-between p-2.5 bg-surface-container-high hover:bg-surface-container-highest cursor-grab active:cursor-grabbing rounded-lg border border-outline-variant/15 hover:border-primary/50 transition-all shadow-sm select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GripVertical className="w-4 h-4 text-on-surface-variant/60 shrink-0" />
                  <span className="font-data-mono text-xs text-primary font-bold px-2 py-1 rounded bg-surface-container-lowest shrink-0">
                    {m.codigo_etiqueta}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-badge text-xs uppercase text-on-surface group-hover:text-primary transition-colors truncate">
                      {m.nombre}
                    </span>
                    <span className="font-data-mono text-[11px] text-on-surface-variant truncate">
                      {m.grupo_muscular}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openConfigForMachine(activeDay, m)}
                  title={`Agregar a ${activeDay}`}
                  className="w-7 h-7 rounded bg-surface-container hover:bg-primary hover:text-on-primary flex items-center justify-center text-on-surface transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: DÍAS DE LA SEMANA LUNES A SÁBADO */}
        <div className="xl:col-span-8 flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DIAS_CONFIG.map((dia) => {
              const dayState = schedule[dia.key];
              const isOver = dragOverDay === dia.key;
              const isActive = activeDay === dia.key;

              return (
                <div
                  key={dia.key}
                  onClick={() => setActiveDay(dia.key)}
                  onDragOver={(e) => handleDragOver(e, dia.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dia.key)}
                  className={`flex flex-col bg-surface-container p-3 rounded-xl min-h-[255px] transition-all border-2 ${
                    isOver
                      ? 'border-primary bg-primary-container/10 shadow-[0_0_20px_rgba(31,113,239,0.3)]'
                      : isActive
                      ? 'border-primary/40 shadow-md'
                      : 'border-outline-variant/20'
                  }`}
                >
                  {/* Encabezado grande del día */}
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2 mb-2 gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-headline-lg text-xl uppercase font-extrabold text-primary tracking-wide">
                        {dia.label}
                      </span>
                      <span className="font-data-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant shrink-0">
                        {dayState.ejercicios.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <select
                        value={dayState.enfoque_muscular}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            [dia.key]: { ...prev[dia.key], enfoque_muscular: e.target.value },
                          }))
                        }
                        className="bg-surface-container-lowest text-tertiary font-data-mono text-[10px] uppercase rounded px-1.5 py-0.5 border border-outline-variant/30 focus:outline-none cursor-pointer"
                      >
                        {ENFOQUE_OPCIONES.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>

                      {dayState.ejercicios.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearDay(dia.key);
                          }}
                          title="Vaciar día"
                          className="text-on-surface-variant hover:text-error p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cuadro de ejercicios arrastrados */}
                  <div className="flex-1 flex flex-col gap-2 p-1.5 rounded-lg bg-surface-container-lowest/50 min-h-[165px]">
                    {dayState.ejercicios.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-on-surface-variant/50 border border-dashed border-outline-variant/30 rounded-lg">
                        <span className="font-data-mono text-[11px] uppercase">
                          Arrastra máquinas aquí
                        </span>
                      </div>
                    ) : (
                      dayState.ejercicios.map((ex, idx) => (
                        <div
                          key={`${dia.key}-${ex.maquina_id}-${idx}`}
                          className="flex flex-col bg-surface-container-high p-2 rounded-lg border border-outline-variant/20 hover:border-primary/40 transition-all shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-data-mono text-[11px] bg-primary text-on-primary font-bold px-1.5 py-0.5 rounded shrink-0">
                                {idx + 1}.
                              </span>
                              <span className="font-label-badge text-xs text-on-surface truncate uppercase">
                                {ex.nombre}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveExercise(dia.key, idx, -1);
                                }}
                                disabled={idx === 0}
                                className="w-5 h-5 rounded hover:bg-surface-container flex items-center justify-center text-on-surface-variant disabled:opacity-30 cursor-pointer"
                                title="Subir"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveExercise(dia.key, idx, 1);
                                }}
                                disabled={idx === dayState.ejercicios.length - 1}
                                className="w-5 h-5 rounded hover:bg-surface-container flex items-center justify-center text-on-surface-variant disabled:opacity-30 cursor-pointer"
                                title="Bajar"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExerciseModal({
                                    dayKey: dia.key,
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
                                  });
                                }}
                                className="w-5 h-5 rounded hover:bg-primary hover:text-on-primary flex items-center justify-center text-on-surface-variant cursor-pointer"
                                title="Editar series/reps/descanso"
                              >
                                <SlidersHorizontal className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveExercise(dia.key, idx);
                                }}
                                className="w-5 h-5 rounded hover:bg-error hover:text-on-error flex items-center justify-center text-on-surface-variant cursor-pointer"
                                title="Quitar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-outline-variant/15 font-data-mono text-[10px] text-on-surface-variant">
                            <span>
                              {ex.series} series • {ex.repeticiones} reps • {ex.tiempo_descanso_segundos}s
                            </span>
                            <span className="text-tertiary truncate max-w-[85px]">{ex.grupo_muscular}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Esquina inferior derecha: Botón 'Guardar rutina' */}
          <div className="mt-2 pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-4">
            <span className="font-data-mono text-xs text-on-surface-variant">
              Total ejercicios configurados: <strong className="text-primary">{totalExercises}</strong>
            </span>
            <button
              type="button"
              disabled={totalExercises === 0}
              onClick={() => {
                if (!selectedPlantillaId) {
                  setRoutineName('');
                }
                setSaveModalOpen(true);
              }}
              className="px-6 py-3 rounded-xl bg-primary-container hover:bg-tertiary-container text-on-primary-container hover:text-on-tertiary-container font-headline-md text-lg uppercase tracking-wider font-bold shadow-[0_0_18px_rgba(31,113,239,0.35)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{selectedPlantillaId ? 'Guardar cambios' : 'Guardar rutina'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* VENTANA EMERGENTE: CONFIGURAR SERIES, REPETICIONES Y DESCANSO AL SOLTAR */}
      {exerciseModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmExerciseModal}
            className="w-full max-w-lg bg-surface-container border-2 border-primary/60 rounded-2xl p-space-md shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <span className="font-data-mono text-[11px] text-primary font-bold uppercase block">
                  {exerciseModal.dayKey} // POSICIÓN {exerciseModal.editIndex !== null ? exerciseModal.editIndex + 1 : schedule[exerciseModal.dayKey].ejercicios.length + 1}.
                </span>
                <h3 className="font-headline-md text-xl uppercase text-on-surface font-bold">
                  {exerciseModal.maquina.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExerciseModal(null)}
                className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Cantidad de series */}
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 space-y-2">
                <label className="font-label-badge text-xs uppercase text-on-surface block">
                  Cantidad de series
                </label>
                <div className="flex gap-1">
                  {[3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setExerciseModal((prev) => ({ ...prev, series: n }))}
                      className={`flex-1 py-1.5 rounded font-headline-md text-base font-bold cursor-pointer ${
                        Number(exerciseModal.series) === n
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={exerciseModal.series}
                  onChange={(e) => setExerciseModal((prev) => ({ ...prev, series: e.target.value }))}
                  className="w-full bg-surface-container-lowest text-on-surface font-data-mono text-sm px-2.5 py-1.5 rounded border border-outline-variant/30 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Repeticiones */}
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 space-y-2">
                <label className="font-label-badge text-xs uppercase text-on-surface block">
                  Repeticiones
                </label>
                <select
                  value={exerciseModal.repeticiones}
                  onChange={(e) => setExerciseModal((prev) => ({ ...prev, repeticiones: e.target.value }))}
                  className="w-full bg-surface-container-lowest text-on-surface font-data-mono text-sm px-2.5 py-2 rounded border border-outline-variant/30 focus:outline-none focus:border-primary"
                >
                  <option value="6-8">6-8 reps</option>
                  <option value="8-12">8-12 reps</option>
                  <option value="10-12">10-12 reps</option>
                  <option value="12-15">12-15 reps</option>
                  <option value="15-20">15-20 reps</option>
                </select>
                <input
                  type="text"
                  value={exerciseModal.repeticiones}
                  onChange={(e) => setExerciseModal((prev) => ({ ...prev, repeticiones: e.target.value }))}
                  placeholder="Ej: 10-12"
                  className="w-full bg-surface-container-lowest text-on-surface font-data-mono text-sm px-2.5 py-1.5 rounded border border-outline-variant/30 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Tiempo de descanso */}
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 space-y-2">
                <label className="font-label-badge text-xs uppercase text-on-surface block">
                  Descanso (seg)
                </label>
                <div className="flex gap-1">
                  {[60, 90, 120].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setExerciseModal((prev) => ({ ...prev, tiempo_descanso_segundos: s }))}
                      className={`flex-1 py-1.5 rounded font-data-mono text-xs font-bold cursor-pointer ${
                        Number(exerciseModal.tiempo_descanso_segundos) === s
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                      }`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={0}
                  max={600}
                  value={exerciseModal.tiempo_descanso_segundos}
                  onChange={(e) =>
                    setExerciseModal((prev) => ({ ...prev, tiempo_descanso_segundos: e.target.value }))
                  }
                  className="w-full bg-surface-container-lowest text-on-surface font-data-mono text-sm px-2.5 py-1.5 rounded border border-outline-variant/30 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setExerciseModal(null)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-badge text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container font-label-badge text-xs uppercase font-bold cursor-pointer"
              >
                Confirmar Ejercicio
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VENTANA EMERGENTE: PONER NOMBRE A LA RUTINA Y BOTÓN ACEPTAR */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRoutineSubmit}
            className="w-full max-w-md bg-surface-container border-2 border-primary/60 rounded-2xl p-space-lg shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-headline-md text-xl uppercase text-on-surface font-bold">
                Guardar Rutina
              </h3>
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="p-1 rounded-lg bg-surface-container-high text-on-surface-variant cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="modal-routine-name"
                className="font-label-badge text-xs uppercase tracking-wider text-on-surface-variant block"
              >
                Nombre de la rutina
              </label>
              <input
                id="modal-routine-name"
                type="text"
                autoFocus
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="Ej: Protocolo Hipertrofia 5 Días"
                className="w-full bg-surface-container-lowest text-on-surface font-body-md text-base px-4 py-3 rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-badge text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!routineName.trim() || saving}
                className="px-6 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container font-headline-md text-sm uppercase font-bold tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Aceptar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
