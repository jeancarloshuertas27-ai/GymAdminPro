import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function TacIdModal({ athleteId, onClose, onDeleteSuccess }) {
  const { authFetch, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`/api/users/${athleteId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'No se pudo cargar la información del atleta.');
        }
        const result = await res.json();
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Error al conectar con el servidor.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (athleteId) {
      fetchDetail();
    }
    return () => {
      isMounted = false;
    };
  }, [athleteId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await authFetch(`/api/users/${athleteId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Error al eliminar el usuario.');
      }
      alert('Atleta eliminado permanentemente de la base de datos.');
      if (onDeleteSuccess) onDeleteSuccess();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!athleteId) return null;

  // Extracción defensiva y resiliente de datos
  const userObj = data?.user || data || {};
  const remainingObj = data?.remaining || data?.membresia || {};
  const fidelityObj = data?.fidelity || data?.fidelidad || {};
  const membershipObj = data?.membership || data?.membresia || {};

  const trafficColor = remainingObj.trafficColor || (
    remainingObj.totalDays > 10 ? 'VERDE' : remainingObj.totalDays > 0 ? 'NARANJA' : 'ROJO'
  );

  const badgeClass = remainingObj.badgeClass || (
    trafficColor === 'VERDE'
      ? 'bg-[#3bf589]/20 text-[#3bf589]'
      : trafficColor === 'NARANJA'
      ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
      : 'bg-error-container text-on-error'
  );

  const remainingText = remainingObj.text || remainingObj.cardText || userObj.tiempoRestante || 'SIN MEMBRESÍA';

  const photoRaw = userObj.foto_url || userObj.fotoUrl;
  const photoUrl = photoRaw
    ? (photoRaw.startsWith('http') || photoRaw.startsWith('/') ? photoRaw : `/${photoRaw}`)
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

  const fullName = userObj.apellidos && userObj.nombres
    ? `${userObj.apellidos}, ${userObj.nombres}`
    : userObj.nombreCompleto || 'ATLETA GYMCORE';

  const fidelityName = fidelityObj.name || fidelityObj.nivel || 'NOVATO';
  const fidelityRange = fidelityObj.rangeLabel || fidelityObj.rango || '< 1 MES';
  const fidelitySummary = fidelityObj.summaryText || `NIVEL: ${fidelityName} (${fidelityObj.months || 0} MESES DE CONSTANCIA)`;
  const nextLevel = fidelityObj.nextLevel || fidelityObj.siguienteNivel || null;
  const progressPercent = fidelityObj.progressPercent ?? fidelityObj.progresoSiguientePorcentaje ?? 0;

  const routine = membershipObj.rutina_asignada || membershipObj.rutinaAsignada || data?.rutinaActual || 'PPL Clásico // Fuerza & Hipertrofia';
  const planTag = membershipObj.plan_tag || membershipObj.planTag || 'Membresía Activa';
  const expDate = membershipObj.fecha_vencimiento || membershipObj.fechaVencimiento || 'N/A';

  const canDelete = Boolean(
    data?.canDelete ||
    data?.puedeEliminar ||
    remainingObj?.canDelete ||
    (remainingObj?.daysExpired > 30)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-surface-container">
        {/* Top Hologram Banner */}
        <div className="bg-gradient-to-r from-surface-container-highest via-surface-container-high to-surface-container-highest px-space-lg py-3 flex items-center justify-between border-b border-surface-container">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
            <div>
              <span className="font-data-mono text-[10px] tracking-widest text-primary uppercase block">
                GYMCORE TACTICAL NETWORK // IDENTIFICACIÓN OFICIAL
              </span>
              <span className="font-headline-md text-sm uppercase tracking-wider text-on-surface font-bold">
                PASAPORTE TÁCTICO DE ATLETA
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded bg-surface-container hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Card Body Content */}
        {loading ? (
          <div className="p-space-xl flex flex-col items-center justify-center text-on-surface-variant gap-2">
            <span className="material-symbols-outlined text-[32px] animate-spin text-primary">progress_activity</span>
            <span className="font-data-mono text-xs uppercase">Cargando credencial táctica...</span>
          </div>
        ) : error || !data ? (
          <div className="p-space-xl text-center text-error font-body-md">
            {error || 'Error al cargar expediente.'}
          </div>
        ) : (
          <div className="p-space-lg space-y-space-md max-h-[80vh] overflow-y-auto">
            {/* Identity Header */}
            <div className="flex flex-col sm:flex-row gap-space-md items-start sm:items-center bg-surface-container-low p-space-md rounded-xl border border-surface-container">
              {/* Tactical Avatar with Frame */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-surface-container-high">
                  <img
                    src={photoUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-surface-container-lowest ${
                    trafficColor === 'VERDE'
                      ? 'bg-[#3bf589]'
                      : trafficColor === 'NARANJA'
                      ? 'bg-[#f59e0b]'
                      : 'bg-error'
                  }`}
                ></div>
              </div>

              {/* Bio Strings */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-space-xs mb-1">
                  {userObj.username && (
                    <>
                      <span className="font-data-mono text-sm text-primary font-semibold">{userObj.username}</span>
                      <span className="text-outline-variant font-data-mono text-xs">•</span>
                    </>
                  )}
                  <span className="font-data-mono text-[11px] text-on-surface-variant uppercase">ID OPERATIVO:</span>
                  <span className="font-data-mono text-[11px] text-on-surface font-bold tracking-wider">
                    {userObj.dni || 'SIN DNI'}
                  </span>
                </div>

                <h2 className="font-headline-lg text-headline-lg uppercase tracking-tight text-on-surface leading-none truncate">
                  {fullName}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-space-md text-xs font-data-mono text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">smartphone</span>
                    <span>{userObj.celular || 'No registrado'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">pin_drop</span>
                    <span>SEDE SURCO CENTRAL</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Metric: Remaining Time & Routine */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              {/* Time Remaining Card */}
              <div className="bg-surface-container-high p-space-md rounded-lg flex flex-col justify-between border border-surface-container">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">
                    VIGENCIA RESTANTE DE MEMBRESÍA
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">hourglass_bottom</span>
                </div>
                <div className="my-1">
                  <span
                    className={`inline-block px-2.5 py-1 rounded font-data-mono text-sm font-bold tracking-wider ${badgeClass}`}
                  >
                    {remainingText}
                  </span>
                </div>
                <span className="font-data-mono text-[10px] text-on-surface-variant mt-1">
                  {planTag} • Vence: {expDate}
                </span>
              </div>

              {/* Routine Assigned */}
              <div className="bg-surface-container-high p-space-md rounded-lg flex flex-col justify-between border border-surface-container">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">
                    RUTINA ACTUAL ASIGNADA
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-primary">fitness_center</span>
                </div>
                <p className="font-headline-md text-base text-on-surface uppercase tracking-wide my-1">
                  {routine}
                </p>
                <div className="flex items-center gap-1 text-[11px] font-data-mono text-primary">
                  <span className="material-symbols-outlined text-[14px]">sports</span>
                  <span>Coach Central M. Navarro</span>
                </div>
              </div>
            </div>

            {/* Gamification Fidelity Ladder */}
            <div className="bg-surface-container-high p-space-md rounded-lg space-y-space-sm border border-surface-container">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">military_tech</span>
                  <span className="font-data-mono text-xs tracking-wider text-on-surface-variant uppercase">
                    ESCALAFÓN DE FIDELIDAD TÁCTICA:
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-primary-container text-on-primary-container font-headline-md text-xs uppercase tracking-widest font-black shadow-[0_0_12px_rgba(31,113,239,0.4)]">
                  {fidelitySummary}
                </div>
              </div>

              {/* Progress Bar to Next Level */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-data-mono text-on-surface-variant mb-1">
                  <span>{fidelityName} ({fidelityRange})</span>
                  <span className="text-primary font-bold">
                    {nextLevel
                      ? `SIGUIENTE ESCALÓN: '${nextLevel}'`
                      : 'NIVEL MÁXIMO ALCANZADO (APEX)'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-surface-container-lowest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Warning Penalization Note */}
              <div className="p-2 rounded bg-error-container/20 flex items-start gap-space-xs">
                <span className="material-symbols-outlined text-error text-[16px] flex-shrink-0 mt-0.5">warning</span>
                <p className="font-data-mono text-[11px] text-error leading-tight">
                  NOTA DE PENALIZACIÓN: Se reinicia automáticamente a <strong className="font-bold underline">NOVATO</strong> si hay 2 semanas de impago tras la fecha de caducidad.
                </p>
              </div>
            </div>

            {/* Delete Confirmation Box (if triggered) */}
            {confirmDelete && (
              <div className="p-space-md bg-error-container/30 border border-error rounded-lg flex flex-col gap-2">
                <div className="flex items-center gap-2 text-error font-headline-md uppercase text-base">
                  <span className="material-symbols-outlined">warning</span>
                  <span>¿Está seguro de eliminar permanentemente a este atleta?</span>
                </div>
                <p className="font-body-sm text-xs text-on-surface">
                  Esta acción purgará físicamente el registro de la base de datos SQLite y no se puede deshacer.
                </p>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded bg-surface-container text-xs font-label-badge uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded bg-error text-on-error text-xs font-label-badge uppercase font-bold cursor-pointer"
                  >
                    {deleting ? 'Eliminando...' : 'Sí, Eliminar de SQLite'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Action Bar */}
        <div className="bg-surface-container-low px-space-lg py-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md border-t border-surface-container">
          <div>
            {isAdmin && canDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full sm:w-auto px-space-md py-2.5 rounded font-label-badge text-label-badge tracking-wider uppercase transition-all flex items-center justify-center gap-2 bg-error-container hover:bg-error text-on-error shadow cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                <span>ELIMINAR USUARIO DE LA BASE DE DATOS</span>
              </button>
            ) : (
              <div className="text-outline text-[11px] font-data-mono">
                {isAdmin
                  ? '* Protocolo de purga activo únicamente para cuentas con >30 días de caducidad.'
                  : '* Modo Recepción: Privilegios de eliminación restringidos.'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-space-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-space-md py-2.5 rounded bg-surface-container hover:bg-surface-bright text-on-surface font-label-badge text-label-badge tracking-wider uppercase transition-colors cursor-pointer"
            >
              CERRAR
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 sm:flex-none px-space-md py-2.5 rounded bg-primary text-on-primary font-label-badge text-label-badge tracking-wider uppercase hover:bg-primary-fixed transition-colors flex items-center justify-center gap-1 shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span> IMPRIMIR CARNET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
