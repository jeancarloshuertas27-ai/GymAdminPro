import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function MembershipLookup({ onOpenAddTimeModal }) {
  const { authFetch } = useAuth();
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [athleteData, setAthleteData] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!dni || dni.length !== 8) {
      setErrorMsg('Por favor ingrese un DNI válido de 8 dígitos.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await authFetch(`/api/membresias/buscar/${dni}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Atleta no encontrado');
      }
      setAthleteData(data);
    } catch (err) {
      setErrorMsg(err.message);
      setAthleteData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-surface-container-low rounded-xl p-space-lg shadow-xl relative flex flex-col gap-space-md border border-outline-variant/30">
      {/* Header Sección */}
      <div className="flex items-center gap-space-sm">
        <span className="material-symbols-outlined text-primary text-[26px]">badge</span>
        <div className="flex flex-col">
          <span className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide">
            MANEJAR MEMBRESÍAS
          </span>
          <span className="font-data-mono text-[11px] text-on-surface-variant uppercase">
            LOCALIZACIÓN Y RENOVACIÓN DE ATLETA
          </span>
        </div>
      </div>

      {/* Buscador por DNI */}
      <form onSubmit={handleSearch} className="flex flex-col gap-space-xs">
        <label htmlFor="dniInput" className="font-label-badge text-label-badge text-on-surface-variant uppercase flex justify-between items-center">
          <span>DNI del Atleta</span>
          <span className="font-data-mono text-[10px] text-outline">8 DÍGITOS PERÚ</span>
        </label>
        <div className="flex gap-space-xs">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-outline-variant text-[20px] pointer-events-none">
              search
            </span>
            <input
              id="dniInput"
              type="text"
              maxLength={8}
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 72849102"
              className="w-full h-12 bg-surface-container pl-11 pr-space-md rounded text-on-surface font-data-mono text-[16px] tracking-wider placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-high transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-space-lg h-12 bg-primary-container text-on-primary-container hover:bg-tertiary-container hover:text-on-tertiary-container rounded font-label-badge text-label-badge uppercase tracking-wider flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">travel_explore</span>
            <span>{loading ? 'Buscando...' : 'Buscar'}</span>
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="p-3 bg-error-container text-on-error-container rounded-lg font-data-mono text-[12px] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Ficha Táctica del Atleta si se encuentra */}
      {athleteData && (
        <div className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-md border border-primary/30 shadow-lg">
          <div className="flex items-start justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center border-2 border-primary">
                {athleteData.usuario.foto_url ? (
                  <img
                    src={athleteData.usuario.foto_url}
                    alt={athleteData.usuario.nombres}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-primary text-[28px]">person</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-headline-md text-[18px] text-on-surface uppercase leading-tight">
                  {athleteData.usuario.nombres} {athleteData.usuario.apellidos}
                </span>
                <span className="font-data-mono text-[12px] text-on-surface-variant">
                  DNI: <strong className="text-on-surface">{athleteData.usuario.dni}</strong> • NIVEL:{' '}
                  <span className="text-primary font-bold">{athleteData.usuario.nivel_fidelidad || 'NOVATO'}</span>
                </span>
              </div>
            </div>

            <span
              className={`px-space-xs py-0.5 rounded font-data-mono text-[11px] uppercase font-bold ${
                athleteData.membresia_actual.estado === 'ACTIVO'
                  ? 'bg-primary-container text-on-primary-container'
                  : athleteData.membresia_actual.estado === 'POR_VENCER'
                  ? 'bg-tertiary-container text-on-tertiary-container'
                  : 'bg-error-container text-on-error-container'
              }`}
            >
              {athleteData.membresia_actual.estado}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-space-sm bg-surface-container-lowest/50 p-space-sm rounded-lg">
            <div className="flex flex-col">
              <span className="font-data-mono text-[10px] text-outline uppercase">TIEMPO RESTANTE</span>
              <span className="font-headline-md text-headline-md text-primary leading-tight">
                {athleteData.membresia_actual.dias_restantes > 0
                  ? `${athleteData.membresia_actual.dias_restantes} DÍAS`
                  : 'VENCIDA'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-data-mono text-[10px] text-outline uppercase">VENCE EL</span>
              <span className="font-data-mono text-[13px] text-on-surface mt-1 font-semibold">
                {athleteData.membresia_actual.fecha_vencimiento || 'Sin membresía'}
              </span>
            </div>
          </div>

          {/* Botón Destacado: Agregar Tiempo de Membresía */}
          <button
            type="button"
            onClick={() => onOpenAddTimeModal(athleteData)}
            className="w-full h-12 bg-primary-container hover:bg-tertiary-container text-on-primary-container hover:text-on-tertiary-container rounded-lg font-headline-md text-headline-md uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(31,113,239,0.3)] active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]">more_time</span>
            <span>AGREGAR TIEMPO DE MEMBRESÍA</span>
          </button>
        </div>
      )}
    </section>
  );
}

