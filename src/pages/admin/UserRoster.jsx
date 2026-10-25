import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TacIdModal from '../../components/modals/TacIdModal';
import EditUserModal from '../../components/modals/EditUserModal';

export default function UserRoster() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    activos: 0,
    porVencer: 0,
    vencidosPurgables: 0,
    tasaActivos: '0%',
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);
  const [editingAthlete, setEditingAthlete] = useState(null);
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
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, status, page]);

  const togglePasswordReveal = (id) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExportCsv = () => {
    const headers = 'ID,Apellidos,Nombres,DNI,Usuario,Membresia,Dias_Restantes,Fidelidad\n';
    const rows = users
      .map(
        (u) =>
          `"${u.id}","${u.apellidos}","${u.nombres}","${u.dni}","${u.username || ''}","${u.estadoMembresia}","${u.diasRestantes}","${u.nivelFidelidad}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `padron_atletas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`¿Está seguro de eliminar permanentemente a ${name} de la base de datos SQLite? Esta acción purgará físicamente el registro del sistema.`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar usuario.');
      }
      alert('Atleta eliminado permanentemente de la base de datos.');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Command HUD */}
      <div className="relative overflow-hidden bg-surface-container-low p-space-lg rounded-xl mb-space-md shadow-xl border border-surface-container">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-space-sm mb-space-xs">
              <span className="font-data-mono text-[11px] tracking-widest text-primary uppercase">
                REGISTRO MILITAR // ATHLETE ROSTER
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
            </div>
            <h1 className="font-headline-lg text-headline-lg tracking-tight uppercase text-on-surface">
              USUARIOS & FIDELIDAD
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-0.5">
              Control maestro de identidades, credenciales cifradas y progresión táctica según índice de permanencia de membresía.
            </p>
          </div>

          {/* Quick Metrics HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
            <div className="bg-surface-container-high p-space-sm rounded-lg flex flex-col justify-between min-w-[120px] border border-surface-container">
              <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">TOTAL PADRÓN</span>
              <span className="font-headline-md text-headline-md text-on-surface">{metrics.total}</span>
              <span className="font-data-mono text-[10px] text-primary">+14 esta sem</span>
            </div>
            <div className="bg-surface-container-high p-space-sm rounded-lg flex flex-col justify-between min-w-[120px] border border-surface-container">
              <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">ACTIVOS</span>
              <span className="font-headline-md text-headline-md text-[#3bf589]">{metrics.activos}</span>
              <span className="font-data-mono text-[10px] text-[#3bf589]">{metrics.tasaActivos} TASA</span>
            </div>
            <div className="bg-surface-container-high p-space-sm rounded-lg flex flex-col justify-between min-w-[120px] border border-surface-container">
              <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">POR VENCER</span>
              <span className="font-headline-md text-headline-md text-tertiary-fixed-dim">{metrics.porVencer}</span>
              <span className="font-data-mono text-[10px] text-tertiary">&lt; 10 DÍAS</span>
            </div>
            <div className="bg-surface-container-high p-space-sm rounded-lg flex flex-col justify-between min-w-[120px] border border-surface-container">
              <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">VENCIDOS (&gt;30D)</span>
              <span className="font-headline-md text-headline-md text-error">{metrics.vencidosPurgables}</span>
              <span className="font-data-mono text-[10px] text-error">PURGABLES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Tactical Search Controls */}
      <div className="bg-surface-container-low p-space-md rounded-xl mb-space-md shadow-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md border border-surface-container">
        {/* Search Bar */}
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
            placeholder="BUSCAR POR APELLIDO, NOMBRE, IDENTIFICACIÓN O @USERNAME..."
            className="w-full h-12 bg-surface-container-lowest text-on-surface pl-12 pr-space-md rounded font-body-md text-body-md placeholder:text-outline-variant placeholder:font-data-mono placeholder:text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container border border-surface-container"
          />
        </div>

        {/* Filters & Sorters */}
        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Status Tabs */}
          <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-surface-container">
            {['all', 'active', 'warning', 'expired'].map((s) => {
              const labels = {
                all: 'TODOS',
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
                  className={`px-space-md py-2 rounded font-label-badge text-label-badge tracking-wider uppercase transition-all cursor-pointer ${
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

          {/* Sorting Pill */}
          <div className="h-12 px-space-md bg-surface-container-high rounded flex items-center gap-space-sm text-on-surface border border-surface-container">
            <span className="material-symbols-outlined text-primary text-[18px]">sort_by_alpha</span>
            <span className="font-data-mono text-[11px] text-on-surface-variant uppercase">ORDEN:</span>
            <span className="font-label-badge text-label-badge text-primary tracking-wider uppercase">
              APELLIDOS (A → Z) ESTRICTO
            </span>
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-12 px-space-md bg-surface-container-lowest hover:bg-surface-container-high rounded text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-space-xs font-label-badge text-label-badge tracking-wider uppercase border border-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span className="hidden sm:inline">EXPORTAR CSV</span>
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden border border-surface-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high font-data-mono text-[11px] tracking-widest text-on-surface-variant uppercase select-none border-b border-surface-container">
                <th className="py-space-md px-space-lg">
                  APELLIDOS <span className="text-primary">↓</span>
                </th>
                <th className="py-space-md px-space-md">NOMBRES</th>
                <th className="py-space-md px-space-md">ESTADO DE MEMBRESÍA</th>
                <th className="py-space-md px-space-md">USUARIO TÁCTICO</th>
                <th className="py-space-md px-space-md">CONTRASEÑA</th>
                <th className="py-space-md px-space-lg text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-body-md text-on-surface text-body-md">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-space-xl text-center font-data-mono text-on-surface-variant">
                    {loading ? 'Cargando padrón de atletas...' : 'No se encontraron atletas registrados.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const initial = u.apellidos ? u.apellidos[0].toUpperCase() : 'A';
                  const isRevealed = revealedPasswords[u.id];

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-surface-container-low transition-colors ${
                        u.estadoMembresia === 'VENCIDO' ? 'bg-error-container/5' : ''
                      }`}
                    >
                      <td className="py-4 px-space-lg">
                        <div className="flex items-center gap-space-sm">
                          <div
                            className={`w-8 h-8 rounded flex items-center justify-center font-headline-md ${
                              u.estadoMembresia === 'VENCIDO'
                                ? 'bg-error-container/40 text-error'
                                : 'bg-primary-container/20 text-primary'
                            }`}
                          >
                            {initial}
                          </div>
                          <div
                            className={`font-headline-md text-headline-md uppercase tracking-wider ${
                              u.estadoMembresia === 'VENCIDO' ? 'text-error' : 'text-on-surface'
                            }`}
                          >
                            {u.apellidos}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-space-md font-body-lg text-body-lg text-on-surface-variant font-medium">
                        {u.nombres}
                      </td>
                      <td className="py-4 px-space-md">
                        <div
                          className={`inline-flex items-center gap-space-xs px-space-sm py-1 rounded ${
                            u.estadoMembresia === 'ACTIVO'
                              ? 'bg-surface-container'
                              : u.estadoMembresia === 'POR_VENCER'
                              ? 'bg-surface-container'
                              : 'bg-error-container/20'
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              u.trafficColor === 'VERDE'
                                ? 'bg-[#3bf589] shadow-[0_0_8px_#3bf589]'
                                : u.trafficColor === 'NARANJA'
                                ? 'bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]'
                                : 'bg-error shadow-[0_0_8px_#ff5449]'
                            }`}
                          ></span>
                          <span
                            className={`font-data-mono text-[12px] uppercase font-semibold ${
                              u.trafficColor === 'VERDE'
                                ? 'text-[#3bf589]'
                                : u.trafficColor === 'NARANJA'
                                ? 'text-[#f59e0b]'
                                : 'text-error'
                            }`}
                          >
                            {u.tiempoRestante}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-space-md font-data-mono text-primary font-medium">
                        {u.username || '••••••••'}
                      </td>
                      <td className="py-4 px-space-md">
                        <div className="inline-flex items-center gap-2 bg-surface-container-high px-space-sm py-1 rounded">
                          <span className="font-data-mono text-xs">
                            {isRevealed ? 'Pass2026!#' : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(u.id)}
                            className="text-on-surface-variant hover:text-primary transition-colors flex items-center cursor-pointer"
                            title="Alternar visibilidad"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isRevealed ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-space-lg text-right">
                        <div className="inline-flex items-center gap-space-xs">
                          {u.canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, `${u.apellidos}, ${u.nombres}`)}
                              className="px-space-sm py-1.5 rounded bg-error-container hover:bg-error text-on-error font-label-badge text-label-badge tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                              title="Atleta con >30 días de vencimiento (Purgable de SQLite)"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span> ELIMINAR
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingAthlete(u)}
                            className="px-space-sm py-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-badge text-label-badge tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span> EDITAR
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedAthleteId(u.id)}
                            className={`px-space-sm py-1.5 rounded font-label-badge text-label-badge tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer ${
                              u.estadoMembresia === 'VENCIDO'
                                ? 'bg-[#c75302] hover:bg-[#a64502] text-white shadow-[0_0_12px_rgba(199,83,2,0.3)]'
                                : 'bg-primary text-on-primary hover:bg-primary-fixed hover:shadow-[0_0_12px_rgba(31,113,239,0.3)]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">id_card</span> VER MÁS
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

        {/* Table Footer / Telemetry Bar */}
        <div className="bg-surface-container-low px-space-lg py-3 flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-surface-container">
          <div className="flex items-center gap-space-sm font-data-mono text-xs text-on-surface-variant">
            <span>
              MOSTRANDO {users.length} DE {metrics.total} ATLETAS REGISTRADOS
            </span>
            <span>•</span>
            <span className="text-primary">ORDENAMIENTO ESTRICTO A-Z ACTIVO</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-data-mono text-xs disabled:opacity-30 cursor-pointer"
            >
              &lt;&lt;
            </button>
            <span className="px-3 py-1 rounded bg-primary-container text-on-primary-container font-data-mono text-xs">
              PÁG {String(page).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-data-mono text-xs disabled:opacity-30 cursor-pointer"
            >
              &gt;&gt;
            </button>
          </div>
        </div>
      </div>

      {/* Gamification Level Reference Infobar (8 Tier boxes) */}
      <div className="mt-space-lg bg-surface-container-low p-space-md rounded-xl border border-surface-container">
        <div className="flex items-center justify-between mb-space-sm">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[18px]">workspace_premium</span>
            <span className="font-data-mono text-[11px] tracking-widest uppercase text-on-surface">
              ESCALAFÓN DE FIDELIDAD TÁCTICA // SDD STANDARD
            </span>
          </div>
          <span className="font-data-mono text-[10px] text-error uppercase font-semibold">
            PENALIZACIÓN: REINICIO A 'NOVATO' SI HAY 2 SEMANAS DE IMPAGO
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-space-xs text-center font-data-mono">
          <div className="p-2 rounded bg-surface-container-high border border-surface-container">
            <p className="text-[10px] text-outline">NIVEL 01</p>
            <p className="font-label-badge text-xs uppercase text-on-surface font-bold">NOVATO</p>
            <p className="text-[9px] text-on-surface-variant">&lt; 1 MES</p>
          </div>
          <div className="p-2 rounded bg-surface-container-high border border-surface-container">
            <p className="text-[10px] text-outline">NIVEL 02</p>
            <p className="font-label-badge text-xs uppercase text-on-surface font-bold">PRINCIPIANTE</p>
            <p className="text-[9px] text-on-surface-variant">1 - 3 MESES</p>
          </div>
          <div className="p-2 rounded bg-surface-container-high border border-surface-container">
            <p className="text-[10px] text-outline">NIVEL 03</p>
            <p className="font-label-badge text-xs uppercase text-on-surface font-bold">PROMEDIO</p>
            <p className="text-[9px] text-on-surface-variant">3 - 5 MESES</p>
          </div>
          <div className="p-2 rounded bg-surface-container-high border border-surface-container">
            <p className="text-[10px] text-outline">NIVEL 04</p>
            <p className="font-label-badge text-xs uppercase text-on-surface font-bold">EN PROGRESO</p>
            <p className="text-[9px] text-on-surface-variant">5 - 8 MESES</p>
          </div>
          <div className="p-2 rounded bg-surface-container-high ring-1 ring-primary/40 border border-surface-container">
            <p className="text-[10px] text-primary">NIVEL 05</p>
            <p className="font-label-badge text-xs uppercase text-primary font-bold">MUTANDO</p>
            <p className="text-[9px] text-on-surface-variant">8 - 12 MESES</p>
          </div>
          <div className="p-2 rounded bg-surface-container-high border border-surface-container">
            <p className="text-[10px] text-outline">NIVEL 06</p>
            <p className="font-label-badge text-xs uppercase text-on-surface font-bold">MAMADO/A</p>
            <p className="text-[9px] text-on-surface-variant">1 - 2 AÑOS</p>
          </div>
          <div className="p-2 rounded bg-surface-container-high border border-surface-container">
            <p className="text-[10px] text-outline">NIVEL 07</p>
            <p className="font-label-badge text-xs uppercase text-on-surface font-bold">DIOS/A GRIEGO</p>
            <p className="text-[9px] text-on-surface-variant">2 - 4 AÑOS</p>
          </div>
          <div className="p-2 rounded bg-surface-container-high bg-gradient-to-t from-primary/20 to-surface-container-high border border-surface-container">
            <p className="text-[10px] text-[#3bf589]">NIVEL APEX</p>
            <p className="font-label-badge text-xs uppercase text-[#3bf589] font-bold">ANIMAL</p>
            <p className="text-[9px] text-on-surface-variant">&gt; 4 AÑOS</p>
          </div>
        </div>
      </div>

      {/* MODAL: VER MÁS (PASAPORTE TÁCTICO) */}
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

      {/* MODAL: EDITAR ATLETA */}
      {editingAthlete && (
        <EditUserModal
          athlete={editingAthlete}
          onClose={() => setEditingAthlete(null)}
          onSaveSuccess={() => {
            setEditingAthlete(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

