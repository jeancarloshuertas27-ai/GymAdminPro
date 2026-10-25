import React from 'react';

export default function SemaphoreCard({ checkinData, onForceOpen, onViewDetail }) {
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
              <div className="w-24 h-28 rounded-DEFAULT overflow-hidden bg-surface-container-high shadow-md">
                <img
                  src={
                    atleta.fotoUrl
                      ? `/${atleta.fotoUrl}`
                      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                  }
                  alt={atleta.nombreCompleto}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-DEFAULT bg-surface-container-lowest text-primary font-headline-md text-headline-md uppercase text-[12px] shadow-[0_0_10px_rgba(31,113,239,0.5)] border border-primary/30">
                {atleta.nivelFidelidad || 'NOVATO'}
              </div>
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-data-mono text-data-mono text-on-surface-variant text-[11px] uppercase">
                  FICHA DE ATLETA
                </span>
                <span className="font-label-badge text-label-badge uppercase text-primary bg-surface-container px-2 py-0.5 rounded-DEFAULT">
                  {atleta.planTag || 'MEMBRESÍA ACTIVA'}
                </span>
              </div>
              <span className="font-headline-lg text-headline-lg uppercase text-on-surface tracking-wide truncate">
                {atleta.nombreCompleto}
              </span>
              <div className="flex items-center gap-space-md mt-1">
                <span className="font-data-mono text-data-mono text-on-surface-variant text-[13px]">
                  DNI: <strong className="text-on-surface">{atleta.dni}</strong>
                </span>
              </div>

              <div className="mt-space-sm p-space-xs bg-surface-container rounded-DEFAULT flex items-center justify-between">
                <span className="font-data-mono text-data-mono text-on-surface-variant text-[11px] uppercase">
                  ESTADO DE CUENTA:
                </span>
                <span
                  className={`font-data-mono text-data-mono font-bold text-[12px] ${
                    isGreen ? 'text-[#3bf589]' : isOrange ? 'text-[#f59e0b]' : 'text-error'
                  }`}
                >
                  {atleta.tiempoRestante || 'NO DISPONIBLE'}
                </span>
              </div>
            </div>
          </div>

          {/* RUTINA ASIGNADA */}
          <div className="bg-surface-container p-space-md rounded-DEFAULT flex flex-col gap-space-xs shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-data-mono text-data-mono text-secondary uppercase text-[11px]">
                RUTINA ASIGNADA PARA HOY
              </span>
              <span className="font-label-badge text-label-badge text-on-surface-variant uppercase">
                SALA DE MUSCULACIÓN
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-headline-md text-headline-md uppercase text-on-surface tracking-wide">
                {atleta.rutinaAsignada || 'PPL Clásico // Fuerza & Hipertrofia'}
              </span>
              <span className="font-data-mono text-data-mono text-primary text-[12px]">RPE 8.5</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-space-xs">
              <div className="bg-surface-container-high p-space-xs rounded-DEFAULT">
                <span className="font-data-mono text-data-mono text-on-surface-variant text-[10px] block">BLOQUE 01</span>
                <span className="font-body-sm text-body-sm text-on-surface font-bold leading-tight block">
                  Press Banca 5x5
                </span>
              </div>
              <div className="bg-surface-container-high p-space-xs rounded-DEFAULT">
                <span className="font-data-mono text-data-mono text-on-surface-variant text-[10px] block">BLOQUE 02</span>
                <span className="font-body-sm text-body-sm text-on-surface font-bold leading-tight block">
                  Press Militar 4x8
                </span>
              </div>
              <div className="bg-surface-container-high p-space-xs rounded-DEFAULT">
                <span className="font-data-mono text-data-mono text-on-surface-variant text-[10px] block">BLOQUE 03</span>
                <span className="font-body-sm text-body-sm text-on-surface font-bold leading-tight block">
                  Fondos Lastrados 3x
                </span>
              </div>
            </div>
          </div>

          {/* ACCIONES DEL PUESTO DE CONTROL */}
          <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
            <button
              type="button"
              onClick={onForceOpen}
              className="h-12 bg-primary-container hover:bg-tertiary-container hover:text-on-tertiary-container text-on-primary-container font-headline-md text-headline-md uppercase tracking-wider rounded-DEFAULT flex items-center justify-center gap-space-xs shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">door_open</span>
              <span>FORZAR PASO</span>
            </button>
            <button
              type="button"
              onClick={() => onViewDetail(atleta.id)}
              className="h-12 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-headline-md text-headline-md uppercase tracking-wider rounded-DEFAULT flex items-center justify-center gap-space-xs transition-all active:scale-95"
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
          <button
            type="button"
            onClick={onForceOpen}
            className="px-space-md py-2 bg-primary-container text-on-primary-container font-headline-md uppercase text-sm rounded shadow active:scale-95"
          >
            FORZAR APERTURA
          </button>
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
              18 SESIONES COMPLETADAS
            </span>
          </div>
        </div>
        <span className="font-label-badge text-label-badge uppercase text-secondary bg-surface-container-high px-2 py-1 rounded-DEFAULT">
          REGULARIDAD 94%
        </span>
      </div>
    </div>
  );
}
