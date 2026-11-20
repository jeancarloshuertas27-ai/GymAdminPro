import React from 'react';
import { X, Tag, Sparkles, ArrowRight } from 'lucide-react';

export default function PromoPopupModal({ promos = [], nivelActual, onClose, onGoToRenew }) {
  if (!promos || promos.length === 0) {
    return null;
  }

  const featured = promos[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[380px] rounded-2xl bg-surface-container border-2 border-primary/60 shadow-[0_0_32px_rgba(31,113,239,0.45)] overflow-hidden relative animate-fade-in">
        {/* Botón X de cierre obligatorio */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar promoción"
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-surface-container-lowest/90 hover:bg-error text-on-surface hover:text-on-error flex items-center justify-center border border-outline-variant/40 shadow-lg transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Imagen o encabezado visual */}
        {featured.banner_url ? (
          <div className="w-full h-44 bg-surface-container-lowest relative overflow-hidden">
            <img
              src={featured.banner_url}
              alt={featured.nombre}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent" />
          </div>
        ) : (
          <div className="w-full py-6 bg-gradient-to-br from-primary-container/30 via-surface-container-high to-tertiary-container/20 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
          </div>
        )}

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-container/25 text-primary font-data-mono text-[11px] font-bold uppercase tracking-wider">
              <Tag className="w-3 h-3" />
              {featured.publico_objetivo === 'TODOS'
                ? 'PROMO PARA TODOS'
                : `EXCLUSIVO ${featured.publico_objetivo}`}
            </span>
            {featured.fecha_limite && (
              <span className="font-data-mono text-[10px] text-tertiary font-bold">
                HASTA: {featured.fecha_limite}
              </span>
            )}
          </div>

          <div>
            <h3 className="font-headline-lg text-2xl uppercase text-on-surface font-extrabold leading-tight">
              {featured.nombre}
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant mt-1">
              Promoción especial vigente para tu nivel <strong className="text-primary">{nivelActual}</strong>. Válida por {featured.duracion_valor}{' '}
              {featured.duracion_unidad === 'MESES' ? 'mes(es)' : 'día(s)'}.
            </p>
          </div>

          {promos.length > 1 && (
            <p className="font-data-mono text-[11px] text-secondary">
              + {promos.length - 1} oferta(s) adicional(es) disponible(s) para ti.
            </p>
          )}

          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-3">
            <div>
              <span className="font-data-mono text-[10px] text-outline uppercase block">PRECIO PROMOCIONAL</span>
              <span className="font-headline-lg text-3xl text-primary font-extrabold leading-none">
                S/ {parseFloat(featured.precio || 0).toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onGoToRenew) onGoToRenew();
              }}
              className="px-4 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-headline-md text-sm uppercase font-bold tracking-wider flex items-center gap-1.5 shadow cursor-pointer"
            >
              <span>Ver Ofertas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
