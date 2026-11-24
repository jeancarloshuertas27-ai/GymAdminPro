import React from 'react';

export default function SemaphoreCard({ checkinData, onViewDetail }) {
  if (!checkinData) {
    return (
      <div className="bg-surface-container-low p-space-lg rounded-DEFAULT shadow-lg flex flex-col items-center justify-center min-h-[380px] text-center border border-surface-container">
        <span className="material-symbols-outlined text-[64px] text-outline-variant mb-space-sm animate-pulse">
          fingerprint
        </span>
        <span className="font-headline-md text-headline-md uppercase text-on-surface tracking-wider">
          TERMINAL A LA ESPERA DE INGRESO
        </span>
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mt-1">
          Digite el DNI de 8 dígitos del atleta o utilice el lector óptico para autorizar el paso por el torniquete #01.
        </p>
      </div>
    );
  }

  const { resultado, titulo, kicker, authCode, warningMessage, motivo, atleta } = checkinData;

  const isGreen = resultado === 'VERDE_AUTORIZADO';
  const isOrange = resultado === 'NARANJA_AVISO';
  const isRed = resultado === 'ROJO_DENEGADO';

  let bannerBg = 'bg-primary-container text-on-primary-container shadow-[0_0_16px_rgba(31,113,239,0.35)]';
  let bannerIcon = 'check_circle';
  let glowColor = 'bg-primary-container/20';

  if (isOrange) {
    bannerBg = 'bg-tertiary-container text-on-tertiary-container shadow-[0_0_16px_rgba(199,83,2,0.4)]';
    bannerIcon = 'warning';
    glowColor = 'bg-tertiary-container/20';
  } else if (isRed) {
    bannerBg = 'bg-error-container text-on-error shadow-[0_0_16px_rgba(147,0,10,0.5)]';
    bannerIcon = 'cancel';
    glowColor = 'bg-error-container/20';
  }

  return (
    <div className="bg-surface-container-low p-space-md rounded-DEFAULT shadow-lg transition-all duration-300 relative overflow-hidden border border-surface-container">
      <div className={`absolute -top-16 -right-16 w-48 h-48 ${glowColor} rounded-full blur-3xl pointer-events-none`}></div>

      {/* INDICADOR STATUS BANNER */}
      <div className={`p-space-md ${bannerBg} rounded-DEFAULT flex items-center justify-between transition-all`}>
        <div className="flex items-center gap-space-md">
          <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {bannerIcon}
          </span>
          <div className="flex flex-col">
            <span className="font-data-mono text-data-mono text-[11px] uppercase tracking-widest opacity-90">
              {kicker}
            </span>
            <span className="font-headline-lg text-headline-lg uppercase tracking-wider leading-none">
              {titulo}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-data-mono text-data-mono text-[11px]">ID VALIDACIÓN</span>
          <span className="font-data-mono text-data-mono font-bold text-[14px]">
            {authCode || '#AUTH-SYSTEM'}
          </span>
        </div>
      </div>

      {/* WARNING MESSAGE IF NARANJA */}
      {warningMessage && (
        <div className="mt-space-sm p-space-sm bg-tertiary-container/20 border-l-4 border-tertiary text-tertiary rounded flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span className="font-data-mono text-[11px] font-bold uppercase">{warningMessage}</span>
        </div>
      )}

      {/* REJECTION REASON IF ROJO */}
      {motivo && (
        <div className="mt-space-sm p-space-sm bg-error-container/20 border-l-4 border-error text-error rounded flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span className="font-data-mono text-[11px] font-bold uppercase">{motivo}</span>
        </div>
      )}

      {/* FICHA DETALLADA DEL ATLETA SI EXISTE */}
      {atleta ? (
        <div className="mt-space-md flex flex-col gap-space-md">
          <div className="flex items-start gap-space-md">
            <div className="relative shrink-0">
              <div className="w-24 h-28 rounded-DEFAULT overflow-hidden bg-surface-container-high shadow-md flex items-center justify-center">
                {atleta.fotoUrl ? (
                  <img
                    src={
                      atleta.fotoUrl.startsWith('http') || atleta.fotoUrl.startsWith('data:') || atleta.fotoUrl.startsWith('/')
                        ? atleta.fotoUrl
                        : `/${atleta.fotoUrl}`
                    }
                    alt={atleta.nombreCompleto}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[42px] text-outline">person</span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-DEFAULT bg-surface-container-lowest text-primary font-headline-md text-headline-md uppercase text-[12px] shadow-[0_0_10px_rgba(31,113,239,0.5)] border border-primary/30">
                {atleta.nivelFidelidad || 'NOVATO'}
              </div>
            </div>

            <div className="flex flex-col flex-1">
              <span className="font-headline-lg text-headline-lg uppercase text-on-surface leading-tight">
                {atleta.nombreCompleto}
              </span>
              <div className="flex items-center gap-space-sm mt-1">
                <span className="font-data-mono text-data-mono text-primary font-bold">
                  DNI: {atleta.dni}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                <span className="font-data-mono text-data-mono text-on-surface-variant text-[12px]">
                  {atleta.planTag || 'PLAN GENERAL'}
                </span>
              </div>

              <div className="mt-space-xs inline-flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container-high w-fit">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isGreen ? 'bg-primary-container animate-pulse' : isOrange ? 'bg-tertiary-container' : 'bg-error-container'
                  }`}
                ></span>
                <span className="font-data-mono text-data-mono text-[12px] font-bold text-on-surface">
                  {atleta.tiempoRestante || 'CONSULTAR VIGENCIA'}
                </span>
              </div>
            </div>
          </div>

          {/* RUTINA DEL DÍA */}
          <div className="p-space-sm bg-surface-container rounded-DEFAULT">
            <div className="flex items-center justify-between gap-2">
              <span className="font-data-mono text-data-mono text-on-surface-variant text-[11px] uppercase truncate">
                RUTINA ACTUAL ASIGNADA: {atleta.rutinaAsignada || 'SIN RUTINA ASIGNADA'}
              </span>
              <span className="font-data-mono text-data-mono text-primary text-[11px] uppercase shrink-0">
                {atleta.rutinaHoy || 'GENERAL'}
              </span>
            </div>

            {Array.isArray(atleta.ejerciciosHoy) && atleta.ejerciciosHoy.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mt-space-xs">
                {atleta.ejerciciosHoy.slice(0, 3).map((ej, idx) => (
                  <div key={idx} className="bg-surface-container-high p-space-xs rounded-DEFAULT">
                    <span className="font-data-mono text-data-mono text-on-surface-variant text-[10px] block">
                      {ej.codigo_etiqueta || `BLOQUE 0${idx + 1}`}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface font-bold leading-tight block truncate">
                      {ej.nombre_ejercicio || ej.maquina_nombre} ({ej.series}x{ej.repeticiones})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-space-xs bg-surface-container-high p-space-xs rounded-DEFAULT">
                <span className="font-data-mono text-[11px] text-on-surface-variant block">
                  {atleta.rutinaAsignada && atleta.rutinaAsignada !== 'SIN RUTINA ASIGNADA'
                    ? 'Hoy corresponde descanso o entrenamiento libre según programación.'
                    : 'Atleta aún no cuenta con plantilla semanal asignada.'}
                </span>
              </div>
            )}
          </div>

          {/* ACCIONES DEL PUESTO DE CONTROL */}
          <div className="pt-space-xs">
            <button
              type="button"
              onClick={() => onViewDetail(atleta.id)}
              className="w-full h-12 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-headline-md text-headline-md uppercase tracking-wider rounded-DEFAULT flex items-center justify-center gap-space-xs transition-all active:scale-95 shadow-md border border-outline-variant/30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">id_card</span>
              <span>VER EXPEDIENTE</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-space-md p-space-md bg-surface-container rounded flex items-center justify-between">
          <span className="font-data-mono text-xs text-on-surface-variant">
            Atleta no identificado en la base de datos local.
          </span>
        </div>
      )}

      {/* TELEMETRÍA DE ASISTENCIA */}
      <div className="mt-space-md p-space-md bg-surface-container rounded-DEFAULT shadow-md flex items-center justify-between">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 bg-surface-container-high rounded-DEFAULT flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">calendar_today</span>
          </div>
          <div className="flex flex-col">
            <span className="font-data-mono text-data-mono text-on-surface-variant text-[11px] uppercase">
              FRECUENCIA // ESTE MES
            </span>
            <span className="font-headline-md text-headline-md text-on-surface uppercase leading-none">
              {atleta?.asistenciaMes || '0 SESIONES ESTE MES'}
            </span>
          </div>
        </div>
        <span className="font-label-badge text-label-badge uppercase text-secondary bg-surface-container-high px-2 py-1 rounded-DEFAULT">
          {atleta?.nivelFidelidad || 'CONTROL ACTIVO'}
        </span>
      </div>
    </div>
  );
}
