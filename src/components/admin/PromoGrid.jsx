import React from 'react';

export default function PromoGrid({ promociones = [], onTogglePromo, loading = false }) {
  const activasCount = promociones.filter((p) => p.activo === 1).length;
  const inactivasCount = promociones.length - activasCount;

  return (
    <section className="bg-surface-container-low rounded-xl p-space-lg shadow-xl flex flex-col gap-space-md border border-outline-variant/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-emerald-400 text-[24px]">verified</span>
          <div className="flex flex-col">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide">
              PROMOCIONES Y PRECIOS
            </h2>
            <span className="font-data-mono text-[11px] text-on-surface-variant uppercase">
              {activasCount} ACTIVAS • {inactivasCount} INACTIVAS ({promociones.length} EN TOTAL)
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-outline font-data-mono text-[13px]">
          Cargando promociones y precios...
        </div>
      ) : promociones.length === 0 ? (
        <div className="p-8 text-center text-outline font-data-mono text-[13px]">
          No hay promociones o tarifas registradas en el catálogo.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {promociones.map((promo) => {
            const isVolatile = promo.tipo === 'PROMOCION_VOLATIL';
            const isActive = promo.activo === 1;

            return (
              <div
                key={promo.id}
                className={`rounded-xl overflow-hidden flex flex-col justify-between p-space-md transition-all shadow-md relative border-2 ${
                  isActive
                    ? 'bg-emerald-950/30 border-emerald-500/60 hover:bg-emerald-950/45'
                    : 'bg-red-950/30 border-red-500/60 hover:bg-red-950/45'
                }`}
              >
                {/* Franja superior diferenciada (verde para activa, rojo para inactiva) */}
                <div
                  className={`absolute top-0 right-0 left-0 h-1.5 ${
                    isActive ? 'bg-emerald-400' : 'bg-red-500'
                  }`}
                />

                <div className="flex flex-col gap-space-xs mb-space-md pt-1">
                  <div className="flex justify-between items-start gap-1">
                    <span
                      className={`font-label-badge text-[11px] uppercase px-space-xs py-0.5 rounded font-extrabold tracking-wider ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {promo.publico_objetivo || 'TODOS'}
                    </span>
                    <span
                      className={`font-data-mono text-[10px] uppercase px-2 py-0.5 rounded font-bold border ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                          : 'bg-red-500/20 text-red-300 border-red-400/50'
                      }`}
                    >
                      {isActive ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </div>

                  <h3 className="font-headline-md text-[18px] text-on-surface uppercase tracking-wide mt-1">
                    {promo.nombre}
                  </h3>

                  <p className="font-body-sm text-[12px] text-on-surface-variant line-clamp-2">
                    {isVolatile
                      ? `Campaña con fecha límite: ${promo.fecha_limite || 'Sin fecha límite'}`
                      : 'Tarifa fija estándar para miembros.'}
                  </p>

                  <div className="mt-space-sm pt-space-xs flex items-baseline justify-between">
                    <span className="font-data-mono text-[12px] text-on-surface-variant uppercase">
                      {promo.duracion_valor} {promo.duracion_unidad}
                    </span>
                    <span
                      className={`font-metric-huge text-[28px] leading-none font-extrabold ${
                        isActive ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      S/ {parseFloat(promo.precio).toFixed(0)}
                    </span>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between gap-2 pt-space-xs border-t ${
                    isActive ? 'border-emerald-900/30' : 'border-red-900/30'
                  }`}
                >
                  <span
                    className={`inline-flex items-center gap-1.5 font-data-mono text-[10px] font-bold ${
                      isActive ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                      }`}
                    />
                    {isVolatile ? 'PROMOCIÓN' : 'TARIFA FIJA'}
                  </span>

                  {onTogglePromo && (
                    <button
                      type="button"
                      onClick={() => onTogglePromo(promo)}
                      className={`px-3 py-1.5 rounded-lg font-label-badge text-[11px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                      }`}
                    >
                      {isActive ? 'Desactivar' : 'Activar'}
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
