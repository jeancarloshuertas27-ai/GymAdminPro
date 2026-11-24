import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function EditProductModal({ product, onClose, onSuccess }) {
  const { authFetch } = useAuth();
  const [nombre, setNombre] = useState(product?.nombre || '');
  const [descripcion, setDescripcion] = useState(product?.descripcion || '');
  const [precioVenta, setPrecioVenta] = useState(product?.precio_venta || '');
  const [precioCosto, setPrecioCosto] = useState(product?.precio_costo || '');
  const [stock, setStock] = useState(product?.stock ?? '');
  const [categoria, setCategoria] = useState(product?.categoria || 'GENERAL');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.imagen_url || null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!product) return null;

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

      const res = await authFetch(`/api/productos/${product.id}`, {
        method: 'PUT',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar producto');
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
        <div className="px-6 py-5 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">edit</span>
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide">
                EDITAR PRODUCTO EN INVENTARIO
              </h2>
              <span className="font-data-mono text-body-sm text-primary uppercase">
                SKU: {product.sku}
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

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-data-mono text-body-sm text-outline uppercase font-semibold">
              FOTOGRAFÍA DEL PRODUCTO
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-on-surface-variant font-data-mono text-body-sm"
            />
            {imagePreview && (
              <div className="h-24 w-36 rounded overflow-hidden border border-primary/40 mt-1">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-data-mono text-body-sm text-outline uppercase font-semibold">
              NOMBRE DEL PRODUCTO
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="px-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-data-mono text-body-sm text-on-surface uppercase font-semibold flex items-center justify-between">
                <span>PRECIO PÚBLICO (PVP)</span>
                <span className="text-primary text-[11px]">S/</span>
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                required
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                className="px-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-data-mono text-body-sm text-tertiary uppercase font-semibold flex items-center justify-between">
                <span>COSTO PRIVADO</span>
                <span className="text-tertiary text-[10px]">SOLO ADMIN</span>
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={precioCosto}
                onChange={(e) => setPrecioCosto(e.target.value)}
                className="px-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono font-bold focus:outline-none focus:ring-2 focus:ring-tertiary border border-outline-variant/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-data-mono text-body-sm text-outline uppercase font-semibold">
                EXISTENCIAS EN STOCK
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="px-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-data-mono text-body-sm text-outline uppercase font-semibold">
                CATEGORÍA
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="px-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
              >
                <option value="SUPLEMENTOS">Suplementos</option>
                <option value="BEBIDAS">Bebidas</option>
                <option value="SNACKS">Snacks</option>
                <option value="ACCESORIOS">Accesorios</option>
                <option value="EQUIPAMIENTO">Equipamiento</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-error-container text-on-error-container rounded-lg font-data-mono text-[12px]">
              {errorMsg}
            </div>
          )}

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
              <span>{loading ? 'Actualizando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

