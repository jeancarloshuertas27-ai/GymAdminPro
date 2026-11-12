import React from 'react';

export default function PromoGrid({ promociones, onArchivePromo }) {
  return (
    <section className="bg-surface-container-low rounded-xl p-space-lg shadow-xl flex flex-col gap-space-md border border-outline-variant/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
          <div className="flex flex-col">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide">
              PROMOCIONES Y PRECIOS ACTIVOS
            </h2>
            <span className="font-data-mono text-[11px] text-on-surface-variant uppercase">
              {promociones.length} OFERTAS HABILITADAS EN BASE DE DATOS
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-primary-container/20 text-primary font-data-mono text-[11px] font-bold">
          CATALOGO_SYNC
        </span>
      </div>

      {promociones.length === 0 ? (
        <div className="p-8 text-center text-outline font-data-mono text-[13px]">
          No hay promociones o tarifas activas registradas en el catálogo.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {promociones.map((promo) => {
            const isVolatile = promo.tipo === 'PROMOCION_VOLATIL';
            return (
              <div
                key={promo.id}
                className="bg-surface-container rounded-xl overflow-hidden flex flex-col justify-between p-space-md group hover:bg-surface-container-high transition-all shadow-md relative border border-outline-variant/20"
              >
                {/* Accent line top */}
                <div
                  className={`absolute top-0 right-0 left-0 h-1 ${
                    isVolatile ? 'bg-primary-container' : 'bg-outline-variant'
                  }`}
                />

                <div className="flex flex-col gap-space-xs mb-space-md">
                  <div className="flex justify-between items-start">
                    <span className="font-label-badge text-[11px] uppercase px-space-xs py-0.5 rounded bg-primary-container/20 text-primary font-extrabold tracking-wider">
                      {promo.publico_objetivo || 'TODOS'}
                    </span>
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      {isVolatile ? 'local_fire_department' : 'calendar_month'}
                    </span>
                  </div>

                  <h3 className="font-headline-md text-[18px] text-on-surface uppercase tracking-wide mt-1">
                    {promo.nombre}
                  </h3>

                  <p className="font-body-sm text-[12px] text-on-surface-variant line-clamp-2">
                    {isVolatile
                      ? `Campaña volátil con límite: ${promo.fecha_limite || 'Hasta agotar cupos'}`
                      : 'Tarifa plana fija para atletas recurrentes sin permanencia.'}
                  </p>

                  <div className="mt-space-sm pt-space-xs flex items-baseline justify-between">
                    <span className="font-data-mono text-[12px] text-on-surface-variant uppercase">
                      {promo.duracion_valor} {promo.duracion_unidad}
                    </span>
                    <span className="font-metric-huge text-[28px] leading-none text-primary font-extrabold">
                      S/ {parseFloat(promo.precio).toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-space-xs border-t border-outline-variant/20">
                  <span className="inline-flex items-center gap-1 font-data-mono text-[10px] text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>{' '}
                    {isVolatile ? 'VIGENTE' : 'TARIFA FIJA'}
                  </span>

                  {onArchivePromo && (
                    <button
                      type="button"
                      onClick={() => onArchivePromo(promo.id)}
                      className="text-outline-variant hover:text-error transition-colors p-1"
                      title="Archivar Tarifa"
                    >
                      <span className="material-symbols-outlined text-[18px]">archive</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

