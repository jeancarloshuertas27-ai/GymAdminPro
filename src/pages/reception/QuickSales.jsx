import React, { useState, useEffect } from 'react';
import SellProductModal from '../../components/modals/SellProductModal';

export default function QuickSales() {
  const [productos, setProductos] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [ventasTurno, setVentasTurno] = useState(0);

  const fetchVentasTurno = async () => {
    try {
      const token = localStorage.getItem('gymcore_token') || localStorage.getItem('token');
      const res = await fetch('/api/productos/ventas-turno', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setVentasTurno(data.total_ventas || 0);
      }
    } catch (err) {
      console.error('Error cargando ventas turno:', err);
    }
  };

  const fetchProductos = async () => {
    try {
      const token = localStorage.getItem('gymcore_token') || localStorage.getItem('token');
      const res = await fetch('/api/productos', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      setProductos(data);
    } catch (err) {
      console.error('Error cargando catálogo POS:', err);
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchVentasTurno();
  }, []);

  const handleOpenSale = (prod) => {
    setSelectedProduct(prod);
    setIsSellModalOpen(true);
  };

  const filteredProducts = productos.filter((p) => {
    const matchesCategory =
      categoryFilter === 'all'
        ? true
        : categoryFilter === 'suplementos'
        ? p.categoria?.toUpperCase().includes('SUPLEMENTO')
        : categoryFilter === 'bebidas'
        ? p.categoria?.toUpperCase().includes('BEBIDA')
        : categoryFilter === 'snacks'
        ? p.categoria?.toUpperCase().includes('SNACK')
        : p.categoria?.toUpperCase().includes('ACCESORIO') || p.categoria?.toUpperCase().includes('GEAR');

    const matchesSearch =
      searchTerm.trim() === '' ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full min-h-screen p-space-lg flex flex-col gap-space-lg">
      {/* POS HUD Metrics Banner */}
      <div className="bg-surface-container-low p-space-md rounded-DEFAULT flex flex-col lg:flex-row justify-between items-start lg:items-center gap-space-md shadow-md border border-outline-variant/30">
        <div className="flex flex-col">
          <h1 className="font-headline-lg text-headline-lg uppercase text-on-surface tracking-wider mt-0.5">
            TERMINAL DE VENTA RÁPIDA // CAJA RECEPCIÓN
          </h1>
          <span className="font-body-sm text-body-sm text-outline tracking-normal">
            Turno Actual Activo | Precios Oficiales en Soles (S/) | Costos Confidenciales Bloqueados
          </span>
        </div>

        {/* Quick Metrics Telemetry Cards */}
        <div className="flex gap-space-sm w-full lg:w-auto">
          <div className="bg-surface-container px-space-md py-space-sm rounded-DEFAULT flex flex-col min-w-[170px] shadow-sm border border-outline-variant/20">
            <span className="font-data-mono text-data-mono uppercase text-outline text-[11px]">VENTAS TURNO</span>
            <span className="font-metric-huge text-headline-lg text-primary tracking-tight font-bold">
              S/ {parseFloat(ventasTurno || 0).toFixed(2)}
            </span>
            <span className="font-data-mono text-data-mono text-[10px] text-primary/80">Turno en línea</span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-between font-headline-md text-body-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="hover:opacity-80">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex flex-col gap-space-md">
        {/* Filter Bar & Search */}
        <div className="bg-surface-container-low p-space-sm rounded-DEFAULT flex flex-col md:flex-row gap-space-sm items-stretch md:items-center justify-between shadow-sm border border-outline-variant/30">
          {/* Filter Chips */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-space-md py-1.5 rounded-DEFAULT font-label-badge text-label-badge uppercase tracking-wider transition-all ${
                categoryFilter === 'all'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              TODOS [{productos.length}]
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('suplementos')}
              className={`px-space-md py-1.5 rounded-DEFAULT font-label-badge text-label-badge uppercase tracking-wider transition-all ${
                categoryFilter === 'suplementos'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              SUPLEMENTOS
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('bebidas')}
              className={`px-space-md py-1.5 rounded-DEFAULT font-label-badge text-label-badge uppercase tracking-wider transition-all ${
                categoryFilter === 'bebidas'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              BEBIDAS
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('snacks')}
              className={`px-space-md py-1.5 rounded-DEFAULT font-label-badge text-label-badge uppercase tracking-wider transition-all ${
                categoryFilter === 'snacks'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              SNACKS
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('accesorios')}
              className={`px-space-md py-1.5 rounded-DEFAULT font-label-badge text-label-badge uppercase tracking-wider transition-all ${
                categoryFilter === 'accesorios'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              ACCESORIOS
            </button>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-space-xs bg-surface-container px-space-sm py-1 rounded-DEFAULT w-full md:w-72 border border-outline-variant/30">
            <span className="material-symbols-outlined text-outline text-[18px]">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar SKU o nombre..."
              className="bg-transparent border-0 outline-none text-on-surface font-body-sm w-full placeholder:text-outline uppercase"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-md">
          {filteredProducts.map((prod) => {
            const isOutOfStock = prod.stock === 0;

            if (isOutOfStock) {
              return (
                <div
                  key={prod.id}
                  className="relative bg-surface-container-low/50 rounded-DEFAULT p-space-md flex flex-col justify-between opacity-60 border border-error/30"
                >
                  <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center p-2">
                    <span className="px-3 py-1 bg-error-container text-on-error-container font-headline-md text-[13px] uppercase tracking-wider rounded font-bold shadow-lg -rotate-12 border border-error">
                      AGOTADO
                    </span>
                  </div>
                  <div>
                    <div className="relative w-full h-36 bg-surface-container-lowest rounded-DEFAULT overflow-hidden mb-space-sm grayscale">
                      <img src={prod.imagen_url} alt={prod.nombre} className="w-full h-full object-cover" />
                      <span className="absolute top-2 right-2 bg-error-container px-2 py-0.5 rounded-DEFAULT font-data-mono text-[11px] text-on-error-container font-bold">
                        STOCK: 0
                      </span>
                    </div>
                    <h3 className="font-headline-md text-[16px] uppercase text-outline tracking-wide leading-tight line-through">
                      {prod.nombre}
                    </h3>
                  </div>
                  <div className="mt-space-md pt-space-sm border-t border-outline-variant/20 flex items-center justify-between">
                    <span className="font-headline-md text-[16px] text-outline">
                      S/ {parseFloat(prod.precio_venta).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      disabled
                      className="h-9 px-space-sm bg-surface-container-high text-outline rounded-DEFAULT font-headline-md uppercase text-[13px] cursor-not-allowed"
                    >
                      AGOTADO
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={prod.id}
                className="group relative bg-surface-container-low rounded-DEFAULT p-space-md flex flex-col justify-between hover:bg-surface-container transition-all shadow-md border border-outline-variant/30"
              >
                <div>
                  <div className="relative w-full h-36 bg-surface-container-lowest rounded-DEFAULT overflow-hidden mb-space-sm">
                    <img
                      src={prod.imagen_url}
                      alt={prod.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 right-2 bg-surface-container-lowest/90 backdrop-blur-md px-2 py-0.5 rounded-DEFAULT font-data-mono text-[11px] text-primary font-bold">
                      STOCK: {prod.stock}
                    </span>
                    <span className="absolute bottom-2 left-2 bg-secondary-container/90 px-1.5 py-0.5 rounded-DEFAULT font-data-mono text-[10px] text-on-secondary-container">
                      {prod.sku}
                    </span>
                  </div>
                  <h3 className="font-headline-md text-[17px] uppercase text-on-surface tracking-wide leading-tight line-clamp-1">
                    {prod.nombre}
                  </h3>
                  <p className="font-body-sm text-[12px] text-outline line-clamp-1 mt-0.5">
                    {prod.descripcion || 'Producto oficial GymAdminPro'}
                  </p>
                </div>

                <div className="mt-space-md pt-space-sm bg-surface-container-lowest/40 rounded-DEFAULT p-space-xs flex items-center justify-between border border-outline-variant/20">
                  <div>
                    <span className="font-data-mono text-[10px] uppercase text-outline block">PVP OFICIAL</span>
                    <span className="font-headline-md text-headline-md text-primary font-bold">
                      S/ {parseFloat(prod.precio_venta).toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenSale(prod)}
                    className="h-10 px-space-md bg-primary-container hover:bg-tertiary-container text-on-primary-container hover:text-on-tertiary-container rounded-DEFAULT flex items-center gap-space-xs font-headline-md uppercase tracking-wider text-[15px] transition-all shadow-[0_0_10px_rgba(31,113,239,0.3)]"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    <span>VENDER</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isSellModalOpen && (
        <SellProductModal
          preselectedProduct={selectedProduct}
          origen="RECEPCION"
          onClose={() => {
            setIsSellModalOpen(false);
            setSelectedProduct(null);
          }}
          onSuccess={(res) => {
            setToastMessage(res.message || 'Venta registrada con éxito.');
            fetchProductos();
            fetchVentasTurno();
          }}
        />
      )}
    </div>
  );
}

