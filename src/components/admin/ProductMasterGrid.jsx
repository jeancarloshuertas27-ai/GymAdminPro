import React from 'react';

export default function ProductMasterGrid({
  productos,
  isAdmin = false,
  onEditProduct,
  onDeleteProduct,
  onSelectForSale
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {productos.map((prod) => {
        const isOutOfStock = prod.stock === 0;

        if (isOutOfStock) {
          return (
            <div
              key={prod.id}
              className="flex flex-col bg-surface-container/40 rounded-xl overflow-hidden opacity-60 hover:opacity-85 transition-all relative border border-error/30"
            >
              {/* Sello AGOTADO // SIN STOCK DISPONIBLE */}
              <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-4">
                <div className="px-6 py-2.5 rounded bg-error-container text-on-error-container font-headline-lg text-headline-md uppercase tracking-widest shadow-2xl -rotate-12 border-2 border-error text-center font-bold">
                  AGOTADO // SIN STOCK DISPONIBLE
                </div>
              </div>

              {/* Imagen en escala de grises */}
              <div className="relative h-56 w-full bg-surface-container-lowest overflow-hidden grayscale">
                <img
                  src={prod.imagen_url || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80'}
                  alt={prod.nombre}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-surface-container-lowest/60"></div>
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-error-container text-on-error-container">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  <span className="font-data-mono text-body-sm uppercase font-bold">STOCK: 0 UNID</span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-headline-md text-headline-md text-outline uppercase tracking-wide leading-tight line-through">
                      {prod.nombre}
                    </h3>
                    <span className="font-data-mono text-body-sm text-outline">{prod.sku}</span>
                  </div>
                  <p className="font-body-sm text-outline mt-1 line-clamp-2">
                    {prod.descripcion || 'Sin descripción disponible.'}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-3 bg-surface-container-low/50 p-3 rounded-lg">
                  <div className="flex items-baseline justify-between">
                    <span className="font-data-mono text-body-sm text-outline uppercase">PVP AL PÚBLICO:</span>
                    <span className="font-headline-md text-headline-md text-outline">
                      S/ {parseFloat(prod.precio_venta).toFixed(2)}
                    </span>
                  </div>
                  {isAdmin && prod.precio_costo !== undefined && (
                    <div className="flex items-center justify-between text-body-sm font-data-mono text-outline">
                      <span>Costo: S/ {parseFloat(prod.precio_costo).toFixed(2)}</span>
                      <span>MARGEN: {prod.margen_porcentaje}%</span>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => onEditProduct(prod)}
                      className="flex-1 py-2.5 px-3 rounded bg-surface-container-high text-outline hover:text-on-surface hover:bg-surface-bright font-headline-md text-body-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span> EDITAR
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(prod.id)}
                      className="py-2.5 px-3 rounded bg-surface-container-high text-outline hover:bg-error-container hover:text-error transition-colors flex items-center justify-center"
                      title="Eliminar (Baja Lógica)"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Producto disponible (Stock > 0)
        return (
          <div
            key={prod.id}
            className="flex flex-col bg-surface-container rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all group relative border border-outline-variant/30"
          >
            <div className="relative h-56 w-full bg-surface-container-lowest overflow-hidden">
              <img
                src={prod.imagen_url || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80'}
                alt={prod.nombre}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/20 to-transparent"></div>
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-lowest/90 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="font-data-mono text-body-sm text-primary uppercase font-bold">
                  STOCK: {prod.stock} UNID
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="font-label-badge text-label-badge px-2 py-0.5 rounded bg-primary-container text-on-primary-container uppercase font-bold">
                  {prod.categoria || 'GENERAL'}
                </span>
              </div>
            </div>

            <div className="p-5 flex flex-col flex-1 justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide leading-tight">
                    {prod.nombre}
                  </h3>
                  <span className="font-data-mono text-body-sm text-outline">{prod.sku}</span>
                </div>
                <p className="font-body-sm text-on-surface-variant mt-1 line-clamp-2">
                  {prod.descripcion || 'Sin descripción técnica.'}
                </p>
              </div>

              {/* Precios y Margen (Costo solo para Admin) */}
              <div className="flex flex-col gap-2 pt-3 bg-surface-container-low p-3 rounded-lg">
                <div className="flex items-baseline justify-between">
                  <span className="font-data-mono text-body-sm text-outline uppercase">PVP AL PÚBLICO:</span>
                  <span className="font-headline-md text-headline-md text-on-surface">
                    S/ {parseFloat(prod.precio_venta).toFixed(2)}
                  </span>
                </div>
                {isAdmin && prod.precio_costo !== undefined && (
                  <div className="flex items-center justify-between text-body-sm font-data-mono bg-surface-container-high px-2 py-1 rounded">
                    <span className="text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-tertiary">lock</span> Costo: S/{' '}
                      {parseFloat(prod.precio_costo).toFixed(2)}
                    </span>
                    <span className="text-tertiary font-bold tracking-wider">
                      MARGEN: {prod.margen_porcentaje}% (ADMIN)
                    </span>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-2">
                {isAdmin ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onEditProduct(prod)}
                      className="flex-1 py-2.5 px-3 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline-md text-body-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span> EDITAR
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(prod.id)}
                      className="py-2.5 px-3 rounded bg-surface-container-high hover:bg-error-container hover:text-error text-outline transition-colors flex items-center justify-center"
                      title="Dar de baja lógica"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectForSale && onSelectForSale(prod)}
                    className="w-full py-2.5 px-3 rounded bg-primary-container text-on-primary-container font-headline-md text-body-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-tertiary-container hover:text-on-tertiary-container shadow-md"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                    VENDER PRODUCTO
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

