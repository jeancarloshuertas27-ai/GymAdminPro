import React, { useState } from 'react';

export default function AddProductModal({ onClose, onSuccess }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [precioCosto, setPrecioCosto] = useState('');
  const [stock, setStock] = useState('25');
  const [categoria, setCategoria] = useState('SUPLEMENTOS');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion);
      formData.append('precio_venta', precioVenta);
      formData.append('precio_costo', precioCosto);
      formData.append('stock', stock);
      formData.append('categoria', categoria);
      if (imageFile) {
        formData.append('imagen', imageFile);
      }

      const token = localStorage.getItem('gymcore_token') || localStorage.getItem('token');
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el producto');
      }

      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-surface-container rounded-xl shadow-2xl overflow-hidden my-8 border border-primary/30">
        {/* Header Modal */}
        <div className="px-6 py-5 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">inventory_2</span>
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide">
                AGREGAR NUEVO PRODUCTO AL INVENTARIO
              </h2>
              <span className="font-data-mono text-body-sm text-primary uppercase">
                CATÁLOGO OPERACIONAL // GYMCORE
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Zona para subir imagen */}
          <div className="flex flex-col gap-1.5">
            <label className="font-data-mono text-body-sm text-outline uppercase font-semibold">
              FOTOGRAFÍA DEL PRODUCTO
            </label>
            <label
              htmlFor="prodImageInput"
              className="w-full p-4 rounded-lg bg-surface-container-lowest flex flex-col items-center justify-center gap-2 hover:bg-surface-container-low transition-all cursor-pointer border border-dashed border-outline-variant/40"
            >
              <span className="material-symbols-outlined text-[36px] text-primary">cloud_upload</span>
              <span className="font-headline-md text-body-lg text-on-surface uppercase tracking-wider">
                {imageFile ? imageFile.name : 'Subir Foto Producto JPG/PNG'}
              </span>
              <span className="font-data-mono text-[11px] text-outline uppercase">
                Resolución sugerida: 1200x800px (Máx. 5MB)
              </span>
              <input
                id="prodImageInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {imagePreview && (
              <div className="h-28 w-44 rounded-lg overflow-hidden border border-primary/40 mx-auto mt-2">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Nombre del Producto */}
          <div className="flex flex-col gap-1.5">
            <label className="font-data-mono text-body-sm text-outline uppercase font-semibold">
              NOMBRE DEL PRODUCTO
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Pre-Entreno Nuclear Pump 400g"
              className="px-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
            />
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <label className="font-data-mono text-body-sm text-outline uppercase font-semibold">
              CATEGORÍA
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="px-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 cursor-pointer"
            >
              <option value="SUPLEMENTOS">Suplementos</option>
              <option value="BEBIDAS">Bebidas</option>
              <option value="SNACKS">Snacks</option>
              <option value="ACCESORIOS">Accesorios & Gear</option>
              <option value="EQUIPAMIENTO">Equipamiento</option>
            </select>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label className="font-data-mono text-body-sm text-outline uppercase font-semibold">
              DESCRIPCIÓN TÉCNICA / BENEFICIOS
            </label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Fórmula de vasodilatación con citrulina y beta-alanina para bombeo y congestión muscular prolongada..."
              className="px-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
            />
          </div>

          {/* Precios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PVP en S/ */}
            <div className="flex flex-col gap-1.5">
              <label className="font-data-mono text-body-sm text-on-surface uppercase font-semibold flex items-center justify-between">
                <span>PRECIO DE VENTA PÚBLICO (PVP)</span>
                <span className="text-primary text-[11px]">S/ IMPUESTOS INC.</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-data-mono text-outline font-bold">S/</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  placeholder="189.00"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono font-bold placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                />
              </div>
            </div>

            {/* Precio de Costo Privado (Admin) */}
            <div className="flex flex-col gap-1.5">
              <label className="font-data-mono text-body-sm text-tertiary uppercase font-semibold flex items-center justify-between">
                <span>PRECIO DE COSTO PRIVADO</span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-tertiary text-[10px] flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[12px]">lock</span> Invisible para Recepción
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-data-mono text-outline font-bold">S/</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  value={precioCosto}
                  onChange={(e) => setPrecioCosto(e.target.value)}
                  placeholder="110.00"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono font-bold placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-tertiary border border-outline-variant/30"
                />
              </div>
            </div>
          </div>

          {/* Stock Inicial */}
          <div className="flex flex-col gap-1.5">
            <label className="font-data-mono text-body-sm text-outline uppercase font-semibold">
              STOCK INICIAL (UNIDADES DISPONIBLES)
            </label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="25"
              className="px-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono font-bold placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-error-container text-on-error-container rounded-lg font-data-mono text-[12px]">
              {errorMsg}
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface-variant font-headline-md text-body-lg uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-primary-container text-on-primary-container font-headline-md text-headline-md uppercase tracking-wider shadow-[0_0_16px_rgba(31,113,239,0.3)] hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              <span>{loading ? 'Guardando...' : 'Guardar Producto en Inventario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

