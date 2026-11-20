import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, UserCheck, Dumbbell, CheckCircle } from 'lucide-react';

export default function RoutineAssigner({ refreshTrigger = 0 }) {
  const { authFetch } = useAuth();
  const [dniInput, setDniInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [atleta, setAtleta] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [selectedRutinaId, setSelectedRutinaId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchPlantillas = useCallback(async () => {
    try {
      const res = await authFetch('/api/rutinas/plantillas');
      if (res.ok) {
        const data = await res.json();
        const list = data.plantillas || [];
        setPlantillas(list);
        if (list.length > 0 && !selectedRutinaId) {
          setSelectedRutinaId(String(list[0].id));
        }
      }
    } catch (err) {
      console.error('Error cargando plantillas de rutinas:', err);
    }
  }, [authFetch, selectedRutinaId]);

  useEffect(() => {
    fetchPlantillas();
  }, [fetchPlantillas, refreshTrigger]);

  const handleSearchDni = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const clean = dniInput.trim();
    if (!/^\d{8}$/.test(clean)) {
      setError('Ingresa un DNI válido de 8 dígitos numéricos.');
      setAtleta(null);
      return;
    }

    setSearching(true);
    try {
      const res = await authFetch(`/api/rutinas/buscar-atleta/${clean}`);
      const data = await res.json();
      if (!res.ok) {
        setAtleta(null);
        setError(data.error || 'No se encontró ningún atleta con ese DNI.');
        return;
      }

      setAtleta(data.atleta);
      if (data.atleta?.rutina_id) {
        setSelectedRutinaId(String(data.atleta.rutina_id));
      } else if (plantillas.length > 0) {
        setSelectedRutinaId(String(plantillas[0].id));
      }
    } catch (err) {
      setError('Error de conexión al buscar atleta.');
    } finally {
      setSearching(false);
    }
  };

  const handleAssignRoutine = async () => {
    if (!atleta || !selectedRutinaId) return;
    setAssigning(true);
    setError(null);
    setMessage(null);

    try {
      const res = await authFetch('/api/rutinas/asignar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: atleta.id,
          rutina_id: Number(selectedRutinaId),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo asignar la rutina.');
      }

      setAtleta((prev) => ({
        ...prev,
        rutina_id: data.rutina_id,
        rutina_nombre: data.rutina_nombre,
        rutina_etiqueta: data.rutina_etiqueta,
      }));
      setMessage(`Rutina actualizada correctamente a "${data.rutina_nombre}".`);
      setTimeout(() => setMessage(null), 4500);
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <section className="flex flex-col gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-xl border border-outline-variant/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/20">
        <div>
          <span className="font-data-mono text-[11px] text-secondary uppercase font-bold tracking-widest block">
            ASIGNACIÓN DE RUTINAS A MIEMBROS
          </span>
          <h2 className="font-headline-lg text-2xl uppercase tracking-wide text-on-surface font-bold">
            Manejar Rutinas
          </h2>
        </div>
        <span className="font-data-mono text-xs text-on-surface-variant">
          {plantillas.length} rutinas preconfiguradas disponibles
        </span>
      </div>

      {/* Buscador por DNI */}
      <form onSubmit={handleSearchDni} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            maxLength={8}
            value={dniInput}
            onChange={(e) => setDniInput(e.target.value.replace(/\D/g, ''))}
            placeholder="Digita el DNI de 8 dígitos del miembro (ej: 72849102)..."
            className="w-full bg-surface-container-lowest text-on-surface font-data-mono text-base pl-11 pr-4 py-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-6 py-3 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-headline-md text-base uppercase font-bold tracking-wider transition-all cursor-pointer disabled:opacity-50"
        >
          {searching ? 'Buscando...' : 'Buscar DNI'}
        </button>
      </form>

      {error && (
        <div className="p-3 rounded-xl bg-error-container text-on-error-container font-data-mono text-xs border border-error/40">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3 rounded-xl bg-primary-container/20 text-primary font-data-mono text-xs border border-primary/40 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Resultado del socio buscado y selector de rutina */}
      {atleta && (
        <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Información del Miembro */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline-md text-xl uppercase text-on-surface font-bold leading-tight">
                {atleta.nombres} {atleta.apellidos}
              </h3>
              <p className="font-data-mono text-xs text-on-surface-variant mt-0.5">
                DNI: <span className="text-primary font-bold">{atleta.dni}</span>
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
                <Dumbbell className="w-4 h-4 text-tertiary" />
                <span className="font-data-mono text-xs font-bold text-on-surface">
                  rutina: {atleta.rutina_nombre}
                </span>
              </div>
            </div>
          </div>

          {/* Lista desplegable y Botón Modificar rutina */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 lg:min-w-[420px]">
            <select
              value={selectedRutinaId}
              onChange={(e) => setSelectedRutinaId(e.target.value)}
              disabled={plantillas.length === 0}
              className="flex-1 bg-surface-container-lowest text-on-surface font-body-md text-sm px-3 py-3 rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary cursor-pointer"
            >
              {plantillas.length === 0 ? (
                <option value="">No hay rutinas preconfiguradas</option>
              ) : (
                plantillas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.total_ejercicios} ejercicios)
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              disabled={assigning || plantillas.length === 0}
              onClick={handleAssignRoutine}
              className="px-5 py-3 rounded-xl bg-tertiary-container hover:bg-tertiary text-on-tertiary-container font-headline-md text-sm uppercase font-bold tracking-wider transition-all shrink-0 cursor-pointer disabled:opacity-40"
            >
              {assigning ? 'Guardando...' : 'Modificar rutina'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
