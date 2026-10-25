import React from 'react';

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

            const athleteName = item.atleta
              ? `${item.atleta.nombres} ${item.atleta.apellidos}`
              : `DNI ${item.dni_ingresado}`;

            const timeStr = item.created_at ? item.created_at.split('T')[1]?.substring(0, 8) : '19:42:01';

            return (
              <div
                key={item.id}
                className="p-space-sm bg-surface-container rounded-DEFAULT flex flex-col gap-1 shadow-sm transition-all hover:bg-surface-container-high border border-surface-container-high"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs truncate mr-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}></span>
                    <span className="font-body-sm text-body-sm font-bold text-on-surface truncate">
                      {athleteName}
                    </span>
                  </div>
                  <span className="font-data-mono text-data-mono text-on-surface-variant text-[11px] shrink-0">
                    {timeStr}
                  </span>
                </div>
                <div className="flex items-center justify-between pl-3">
                  <span className={`font-data-mono text-data-mono text-[10px] uppercase truncate ${pillColor}`}>
                    {item.motivo || item.atleta?.planTag || 'CHECK-IN EN SALA'}
                  </span>
                  <span className={`font-label-badge text-label-badge text-[11px] shrink-0 ${pillColor}`}>
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
