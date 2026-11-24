import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProductMasterGrid from '../../components/admin/ProductMasterGrid';
import AddProductModal from '../../components/modals/AddProductModal';
import EditProductModal from '../../components/modals/EditProductModal';
import SellProductModal from '../../components/modals/SellProductModal';

export default function ProductInventory() {
  const { authFetch } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchProductos = async () => {
    try {
      const res = await authFetch('/api/productos');
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Está seguro de dar de baja lógica a este producto? Se preservará el histórico de ventas pasadas.')) {
      return;
    }
    try {
      const res = await authFetch(`/api/productos/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setToastMessage('Producto dado de baja lógica correctamente.');
        setTimeout(() => setToastMessage(null), 4000);
        fetchProductos();
      }
    } catch (err) {
      console.error('Error al eliminar producto:', err);
    }
  };

  // Filtrado
  const filteredProducts = productos.filter((p) => {
    const matchesCategory =
      categoryFilter === 'all'
        ? true
        : categoryFilter === 'suplementos'
        ? p.categoria?.toUpperCase().includes('SUPLEMENTO')
        : categoryFilter === 'bebidas'
        ? p.categoria?.toUpperCase().includes('BEBIDA') || p.categoria?.toUpperCase().includes('SNACK')
        : p.categoria?.toUpperCase().includes('ACCESORIO') || p.categoria?.toUpperCase().includes('GEAR');

    const matchesSearch =
      searchTerm.trim() === '' ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Telemetría
  const totalStockValue = productos.reduce((acc, p) => acc + p.precio_venta * p.stock, 0);
  const activeSkusCount = productos.filter((p) => p.stock > 0).length;

  return (
    <div className="w-full min-h-screen px-gutter pb-32 pt-4">
      {/* Encabezado Táctico de Inventario */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-surface-container-low p-6 rounded-xl shadow-lg relative overflow-hidden border border-outline-variant/30 mb-8">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="font-data-mono text-body-sm text-primary tracking-widest uppercase">
              MÓDULO DE SUMINISTROS Y LOGÍSTICA // V2.4
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg uppercase text-on-surface tracking-wide">
            INVENTARIO MAESTRO Y MANEJO DE PRODUCTOS <span className="text-primary font-data-mono text-body-lg ml-2">// GYMADMINPRO</span>
          </h1>
          <p className="font-body-md text-on-surface-variant max-w-2xl">
            Control balístico de existencias, cálculo automatizado de márgenes brutos y terminal de venta rápida con arqueo auditado para recepción y comandancia.
          </p>
        </div>

        {/* Quick Stats Telemetry Row */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="px-4 py-3 rounded-lg bg-surface-container flex flex-col border border-outline-variant/20">
            <span className="font-data-mono text-body-sm text-outline uppercase">VALOR EN STOCK</span>
            <span className="font-headline-md text-headline-md text-primary leading-tight">
              S/ {totalStockValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="px-4 py-3 rounded-lg bg-surface-container flex flex-col border border-outline-variant/20">
            <span className="font-data-mono text-body-sm text-outline uppercase">SKUs DISPONIBLES</span>
            <span className="font-headline-md text-headline-md text-secondary leading-tight">
              {activeSkusCount} / {productos.length}
            </span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="mb-6 p-4 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-between font-headline-md text-body-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="hover:opacity-80">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded font-data-mono text-body-sm uppercase font-bold tracking-wider transition-all ${
              categoryFilter === 'all'
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(31,113,239,0.3)]'
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            TODOS ({productos.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('suplementos')}
            className={`px-4 py-2 rounded font-data-mono text-body-sm uppercase tracking-wider transition-all ${
              categoryFilter === 'suplementos'
                ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_12px_rgba(31,113,239,0.3)]'
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            SUPLEMENTOS
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('bebidas')}
            className={`px-4 py-2 rounded font-data-mono text-body-sm uppercase tracking-wider transition-all ${
              categoryFilter === 'bebidas'
                ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_12px_rgba(31,113,239,0.3)]'
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            BEBIDAS & SNACKS
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('accesorios')}
            className={`px-4 py-2 rounded font-data-mono text-body-sm uppercase tracking-wider transition-all ${
              categoryFilter === 'accesorios'
                ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_12px_rgba(31,113,239,0.3)]'
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            ACCESORIOS & GEAR
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-surface-container text-outline text-body-sm font-data-mono w-full sm:w-72 border border-outline-variant/30">
            <span className="material-symbols-outlined text-[18px]">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="FILTRAR POR SKU O MARCA..."
              className="bg-transparent text-on-surface placeholder:text-outline focus:outline-none uppercase w-full"
            />
          </div>
        </div>
      </div>

      {/* Grilla de Productos */}
      <ProductMasterGrid
        productos={filteredProducts}
        isAdmin={true}
        onEditProduct={(p) => setEditingProduct(p)}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* Barra Flotante de Acciones en Esquina Inferior Derecha */}
      <div className="fixed bottom-6 right-8 z-40 flex items-center gap-4 bg-surface-container-lowest/95 backdrop-blur-xl p-2.5 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-outline-variant/40">
        {/* Botón Azul: [+] AGREGAR PRODUCTOS */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-4 rounded-lg bg-primary-container hover:bg-primary-container/85 text-on-primary-container font-headline-md text-headline-md uppercase tracking-wider flex items-center gap-3 transition-all shadow-[0_0_20px_rgba(31,113,239,0.35)] active:scale-95"
        >
          <span className="material-symbols-outlined text-[26px]">add_box</span>
          <span>[+] AGREGAR PRODUCTOS</span>
        </button>

        {/* Botón Verde: [$] VENDER PRODUCTO */}
        <button
          type="button"
          onClick={() => setIsSellModalOpen(true)}
          className="px-6 py-4 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-headline-md text-headline-md uppercase tracking-wider flex items-center gap-3 transition-all shadow-[0_0_20px_rgba(175,198,255,0.45)] active:scale-95"
        >
          <span className="material-symbols-outlined text-[26px]">point_of_sale</span>
          <span>[$] VENDER PRODUCTO</span>
        </button>
      </div>

      {/* Modales */}
      {isAddModalOpen && (
        <AddProductModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setToastMessage('Producto guardado correctamente en el inventario.');
            fetchProductos();
          }}
        />
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            setToastMessage('Producto actualizado correctamente.');
            fetchProductos();
          }}
        />
      )}

      {isSellModalOpen && (
        <SellProductModal
          onClose={() => setIsSellModalOpen(false)}
          onSuccess={(res) => {
            setToastMessage(res.message || 'Venta procesada con éxito.');
            fetchProductos();
          }}
        />
      )}
    </div>
  );
}

