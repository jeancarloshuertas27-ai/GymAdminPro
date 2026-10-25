import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TacIdModal from '../../components/modals/TacIdModal';

export default function AthletesList({ onNavigate }) {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    activos: 0,
    porVencer: 0,
    vencidosPurgables: 0,
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        status,
        page: String(page),
        limit: '10',
      });
      const res = await authFetch(`/api/users?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.metrics) setMetrics(data.metrics);
        if (data.pagination) setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching athletes list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, status, page]);

  return (
    <div className="p-space-lg flex flex-col gap-space-lg w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-primary mb-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <span className="font-data-mono text-[11px] tracking-widest uppercase">
              SISTEMA DE ASIGNACIÓN TÁCTICA // MOD-REC-04
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg uppercase tracking-wide text-on-surface">
            PADRÓN DE ATLETAS Y ASIGNACIÓN // RECEPCIÓN
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-0.5">
            Control de membresías activas, emisión de carnet biométrico y sincronización directa de rutinas operativas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/recepcion/agregar-miembro')}
          className="h-12 px-space-lg bg-primary-container hover:bg-tertiary-container text-on-primary-container font-headline-md text-headline-md uppercase tracking-wider rounded-DEFAULT flex items-center gap-space-xs transition-all shadow-[0_0_16px_rgba(31,113,239,0.4)] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span>AGREGAR NUEVO MIEMBRO</span>
        </button>
      </div>

      {/* Quick Metrics HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-low p-space-md rounded-DEFAULT shadow-md flex flex-col justify-between border border-surface-container">
          <div className="flex justify-between items-center">
            <span className="font-data-mono text-[11px] uppercase text-on-surface-variant">MEMBRESÍAS VIGENTES</span>
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
          </div>
          <div className="flex items-baseline gap-space-xs my-space-xs">
            <span className="font-metric-huge text-[40px] text-on-surface leading-none">{metrics.activos}</span>
            <span className="font-data-mono text-[11px] text-primary">+14 HOY</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-DEFAULT shadow-md flex flex-col justify-between border border-surface-container">
          <div className="flex justify-between items-center">
            <span className="font-data-mono text-[11px] uppercase text-on-surface-variant">POR VENCER (10-30D)</span>
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
          </div>
          <div className="flex items-baseline gap-space-xs my-space-xs">
            <span className="font-metric-huge text-[40px] text-[#f59e0b] leading-none">{metrics.porVencer}</span>
            <span className="font-data-mono text-[11px] text-[#f59e0b]">NOTIFICADOS</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-DEFAULT shadow-md flex flex-col justify-between border border-surface-container">
          <div className="flex justify-between items-center">
            <span className="font-data-mono text-[11px] uppercase text-on-surface-variant">CRÍTICO (&lt;10D / IMPAGO)</span>
            <span className="w-2 h-2 rounded-full bg-error"></span>
          </div>
          <div className="flex items-baseline gap-space-xs my-space-xs">
            <span className="font-metric-huge text-[40px] text-error leading-none">{metrics.vencidosPurgables}</span>
            <span className="font-data-mono text-[11px] text-error">RESTRICTOS</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-DEFAULT shadow-md flex flex-col justify-between border border-surface-container">
          <div className="flex justify-between items-center">
            <span className="font-data-mono text-[11px] uppercase text-on-surface-variant">SIN RUTINA ACTIVA</span>
            <span className="material-symbols-outlined text-secondary text-[16px]">fitness_center</span>
          </div>
          <div className="flex items-baseline gap-space-xs my-space-xs">
            <span className="font-metric-huge text-[40px] text-secondary leading-none">12</span>
            <span className="font-data-mono text-[11px] text-secondary">REQUIERE ASIGNAR</span>
          </div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-surface-container-low p-space-md rounded-DEFAULT shadow-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md border border-surface-container">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="BUSCAR POR APELLIDO, NOMBRE, DNI O @USUARIO..."
            className="w-full h-12 bg-surface-container-lowest text-on-surface pl-12 pr-space-md rounded font-body-md text-body-md placeholder:text-outline-variant placeholder:font-data-mono placeholder:text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container border border-surface-container"
          />
        </div>

        <div className="flex items-center bg-surface-container-lowest p-1 rounded-DEFAULT border border-surface-container">
          {['all', 'active', 'warning', 'expired'].map((s) => {
            const labels = {
              all: 'TODOS (ALF)',
              active: 'ACTIVOS',
              warning: 'POR VENCER',
              expired: 'VENCIDOS',
            };
            const isActive = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`px-space-md py-2 rounded-DEFAULT font-label-badge text-label-badge tracking-wider uppercase transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Athletes Table */}
      <div className="bg-surface-container-lowest rounded-DEFAULT shadow-xl overflow-hidden border border-surface-container">
        <div className="px-space-md py-2.5 bg-surface-container-high flex items-center justify-between border-b border-surface-container text-[11px] font-data-mono text-on-surface-variant uppercase">
          <span>ORDEN: APELLIDOS (A - Z) [ESTRICTO REGISTRO OFICIAL]</span>
          <span className="flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            MODO RECEPCIÓN: PRIVILEGIOS DE ELIMINACIÓN Y CLAVES RESTRINGIDOS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low font-data-mono text-[11px] tracking-widest text-on-surface-variant uppercase border-b border-surface-container">
                <th className="py-space-md px-space-md">ATLETA // APELLIDOS, NOMBRES</th>
                <th className="py-space-md px-space-md">DNI / REGISTRO</th>
                <th className="py-space-md px-space-md">ESTADO MEMBRESÍA</th>
                <th className="py-space-md px-space-md">TIEMPO RESTANTE</th>
                <th className="py-space-md px-space-md">CELULAR</th>
                <th className="py-space-md px-space-md">RUTINA ASIGNADA</th>
                <th className="py-space-md px-space-md text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-body-md text-on-surface text-body-md">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-space-xl text-center font-data-mono text-on-surface-variant">
                    {loading ? 'Cargando nómina de recepción...' : 'No hay registros coincidentes.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const initial = u.apellidos ? u.apellidos.slice(0, 2).toUpperCase() : 'AT';

                  return (
                    <tr key={u.id} className="hover:bg-surface-container-high/60 transition-colors">
                      <td className="py-space-sm px-space-md">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface font-headline-md text-[16px] shrink-0">
                            {initial}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide leading-tight">
                              {u.apellidos}, {u.nombres}
                            </span>
                            <div className="flex items-center gap-space-xs mt-0.5">
                              <span className="px-1.5 py-0.5 rounded-DEFAULT bg-surface-container text-primary font-data-mono text-[10px] tracking-wider uppercase font-bold">
                                {u.nivelFidelidad}
                              </span>
                              <span className="text-on-surface-variant font-data-mono text-[10px]">
                                #AT-{u.dni.slice(-4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-space-sm px-space-md font-data-mono text-data-mono text-on-surface">
                        {u.dni}
                      </td>

                      <td className="py-space-sm px-space-md">
                        <div className="flex items-center gap-space-sm">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              u.trafficColor === 'VERDE'
                                ? 'bg-[#3bf589]'
                                : u.trafficColor === 'NARANJA'
                                ? 'bg-[#f59e0b]'
                                : 'bg-error'
                            }`}
                          ></span>
                          <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface">
                            {u.planTag || 'PLAN ESTÁNDAR'}
                          </span>
                        </div>
                      </td>

                      <td className="py-space-sm px-space-md">
                        <span
                          className={`px-space-sm py-0.5 rounded-DEFAULT font-data-mono text-[12px] font-bold ${
                            u.trafficColor === 'VERDE'
                              ? 'bg-surface-container text-primary'
                              : u.trafficColor === 'NARANJA'
                              ? 'bg-tertiary-container/20 text-tertiary'
                              : 'bg-error-container/20 text-error'
                          }`}
                        >
                          {u.tiempoRestanteCorto || u.tiempoRestante}
                        </span>
                      </td>

                      <td className="py-space-sm px-space-md font-data-mono text-data-mono text-on-surface-variant">
                        {u.celular}
                      </td>

                      <td className="py-space-sm px-space-md">
                        <div className="flex items-center gap-space-xs">
                          <span className="material-symbols-outlined text-primary text-[16px]">fitness_center</span>
                          <span className="font-headline-md text-[14px] uppercase tracking-wide text-on-surface truncate max-w-[180px]">
                            {u.rutinaAsignada || 'PPL Clásico (6 días)'}
                          </span>
                        </div>
                      </td>

                      <td className="py-space-sm px-space-md text-right">
                        <div className="flex items-center justify-end gap-space-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedAthleteId(u.id)}
                            className="h-9 px-space-sm bg-surface-container-high hover:bg-surface-bright text-on-surface rounded-DEFAULT font-label-badge text-label-badge uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">badge</span>
                            <span>VER FICHA</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-surface-container-low px-space-lg py-3 flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-surface-container">
          <div className="font-data-mono text-xs text-on-surface-variant">
            MOSTRANDO {users.length} DE {metrics.total} REGISTROS
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-data-mono text-xs disabled:opacity-30 cursor-pointer"
            >
              ANTERIOR
            </button>
            <span className="px-3 py-1 rounded bg-primary-container text-on-primary-container font-data-mono text-xs">
              {page}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-data-mono text-xs disabled:opacity-30 cursor-pointer"
            >
              SIGUIENTE
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: VER FICHA */}
      {selectedAthleteId && (
        <TacIdModal
          athleteId={selectedAthleteId}
          onClose={() => setSelectedAthleteId(null)}
          onDeleteSuccess={() => {
            setSelectedAthleteId(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

