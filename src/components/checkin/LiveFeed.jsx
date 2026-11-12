import React from 'react';
import { formatLocalTime } from '../../utils/formatTime';

export default function LiveFeed({ items = [] }) {
  return (
    <div className="bg-surface-container-low p-space-md rounded-DEFAULT shadow-md flex flex-col gap-space-md border border-surface-container">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="w-2.5 h-2.5 bg-primary-container rounded-full animate-ping"></span>
          <span className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide">
            ÚLTIMOS INGRESOS
          </span>
        </div>
        <span className="font-data-mono text-data-mono text-primary text-[11px]">FEED EN VIVO</span>
      </div>

      <div className="flex flex-col gap-space-sm max-h-[510px] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="p-space-md text-center font-data-mono text-xs text-on-surface-variant">
            Sin ingresos registrados en este turno.
          </div>
        ) : (
          items.map((item) => {
            const isGreen = item.resultado === 'VERDE_AUTORIZADO';
            const isOrange = item.resultado === 'NARANJA_AVISO';
            const isRed = item.resultado === 'ROJO_DENEGADO';

            let dotColor = 'bg-primary-container shadow-[0_0_6px_rgba(31,113,239,0.8)]';
            let pillColor = 'text-primary';
            let pillText = 'AUTORIZADO';

            if (isOrange) {
              dotColor = 'bg-tertiary shadow-[0_0_6px_rgba(255,182,147,0.8)]';
              pillColor = 'text-tertiary';
              pillText = 'ALERTA PAGO';
            } else if (isRed) {
              dotColor = 'bg-error shadow-[0_0_6px_rgba(255,180,171,0.8)]';
              pillColor = 'text-error';
              pillText = 'DENEGADO';
            }

            // DNI exacto garantizado
            const exactDni = item.dni || item.dni_ingresado || (item.atleta ? item.atleta.dni : '') || 'S/DNI';
            const hasName = Boolean(item.nombres || (item.nombre && !item.nombre.startsWith('DNI')));
            const displayName = hasName
              ? (item.nombres ? `${item.nombres} ${item.apellidos || ''}`.trim() : item.nombre)
              : `DNI ${exactDni}`;

            // Hora local exacta sincronizada con hora de reloj central
            const timeStr = formatLocalTime(item.timestamp || item.hora || item.created_at);

            return (
              <div
                key={item.id}
                className="p-space-sm bg-surface-container rounded-DEFAULT flex flex-col gap-1 shadow-sm transition-all hover:bg-surface-container-high border border-surface-container-high"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs truncate mr-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}></span>
                    <div className="flex flex-col truncate">
                      <span className="font-body-sm text-body-sm font-bold text-on-surface truncate">
                        {displayName}
                      </span>
                      {hasName && exactDni !== 'S/DNI' && (
                        <span className="font-data-mono text-[10px] text-outline leading-tight">
                          DNI: {exactDni}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-data-mono text-data-mono text-on-surface-variant text-[11px] shrink-0 font-bold">
                    {timeStr}
                  </span>
                </div>
                <div className="flex items-center justify-end pl-3">
                  <span className={`font-label-badge text-label-badge text-[11px] shrink-0 font-bold ${pillColor}`}>
                    {pillText}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
