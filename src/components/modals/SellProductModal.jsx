import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function SellProductModal({ preselectedProduct, origen, onClose, onSuccess }) {
  const { user, authFetch } = useAuth();
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const [productos, setProductos] = useState([]);
  const [selectedProdId, setSelectedProdId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [voucherFile, setVoucherFile] = useState(null);
  const [voucherPreview, setVoucherPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    authFetch('/api/productos')
      .then((res) => res.json())
      .then((data) => {
        // Filtrar exclusivamente productos con stock > 0
        const inStock = (Array.isArray(data) ? data : []).filter((p) => p.stock > 0);
        setProductos(inStock);
        if (preselectedProduct && preselectedProduct.stock > 0) {
          setSelectedProdId(preselectedProduct.id.toString());
        } else if (inStock.length > 0) {
          setSelectedProdId(inStock[0].id.toString());
        }
      })
      .catch((err) => console.error('Error cargando productos:', err));
  }, [preselectedProduct, authFetch]);

  const currentProduct = productos.find((p) => p.id.toString() === selectedProdId);
  const maxStock = currentProduct ? currentProduct.stock : 1;
  const unitPrice = currentProduct ? currentProduct.precio_venta : 0;
  const totalAmount = (unitPrice * cantidad).toFixed(2);

  const handleQtyChange = (delta) => {
    setCantidad((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxStock) return maxStock;
      return next;
    });
  };

  const handleVoucherChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVoucherFile(file);
      setVoucherPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentProduct) {
      setErrorMsg('Seleccione un producto disponible');
      return;
    }

    if (paymentMethod === 'TRANSFERENCIA' && !voucherFile) {
      setErrorMsg('La subida de comprobante bancario es obligatoria para transferencias');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('producto_id', selectedProdId);
      formData.append('cantidad', cantidad.toString());
      formData.append('metodo_pago', paymentMethod);
      formData.append('origen', origen || (isAdmin ? 'ADMIN' : 'RECEPCION'));
      if (voucherFile) {
        formData.append('comprobante', voucherFile);
      }

      const res = await authFetch('/api/productos/vender', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la venta');
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
      <div className="w-full max-w-xl bg-surface-container rounded-xl shadow-2xl overflow-hidden my-8 border border-primary/30">
        {/* Header Modal */}
        <div className="px-6 py-5 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary text-on-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[24px]">point_of_sale</span>
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide">
                VENTA DE PRODUCTO EN MOSTRADOR
              </h2>
              <span className="font-data-mono text-body-sm text-primary uppercase">
                TERMINAL POS TÁCTICO // CAJA CENTRAL
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
          {/* Selección de Producto (solo con stock > 0) */}
          <div className="flex flex-col gap-1.5">
            <label className="font-data-mono text-body-sm text-outline uppercase font-semibold">
              PRODUCTO A VENDER
            </label>
            <div className="relative">
              <select
                value={selectedProdId}
                onChange={(e) => {
                  setSelectedProdId(e.target.value);
                  setCantidad(1);
                }}
                className="w-full px-4 py-3.5 rounded-lg bg-surface-container-lowest text-on-surface font-headline-md text-body-lg uppercase focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer border border-outline-variant/30"
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — S/ {parseFloat(p.precio_venta).toFixed(2)} (Stock: {p.stock})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3.5 top-3.5 text-outline pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Cantidad Vendida */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-data-mono text-body-sm text-outline uppercase font-semibold">
                CANTIDAD VENDIDA
              </label>
              <span className="font-data-mono text-body-sm text-primary uppercase">
                MÁXIMO DISPONIBLE: {maxStock}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleQtyChange(-1)}
                className="w-12 h-12 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-data-mono text-headline-md flex items-center justify-center transition-colors border border-outline-variant/30"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={maxStock}
                value={cantidad}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  if (val > maxStock) setCantidad(maxStock);
                  else if (val < 1) setCantidad(1);
                  else setCantidad(val);
                }}
                className="flex-1 text-center py-3 rounded-lg bg-surface-container-lowest text-on-surface font-data-mono text-headline-md font-bold focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
              />
              <button
                type="button"
                onClick={() => handleQtyChange(1)}
                className="w-12 h-12 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-data-mono text-headline-md flex items-center justify-center transition-colors border border-outline-variant/30"
              >
                +
              </button>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="flex flex-col gap-2">
            <label className="font-data-mono text-body-sm text-outline uppercase font-semibold">
              MÉTODO DE PAGO
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setPaymentMethod('EFECTIVO')}
                className={`flex flex-col p-3.5 rounded-lg bg-surface-container-lowest cursor-pointer hover:bg-surface-container-high transition-colors border-2 ${
                  paymentMethod === 'EFECTIVO' ? 'border-primary-container bg-surface-container-high' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-body-lg text-on-surface uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">payments</span> Efectivo
                  </span>
                  <input
                    type="radio"
                    name="pos-payment"
                    checked={paymentMethod === 'EFECTIVO'}
                    onChange={() => setPaymentMethod('EFECTIVO')}
                    className="accent-primary"
                  />
                </div>
                <span className="font-data-mono text-[11px] text-outline uppercase mt-1">
                  Registro y aprobación automática en caja
                </span>
              </label>

              <label
                onClick={() => setPaymentMethod('TRANSFERENCIA')}
                className={`flex flex-col p-3.5 rounded-lg bg-surface-container-lowest cursor-pointer hover:bg-surface-container-high transition-colors border-2 ${
                  paymentMethod === 'TRANSFERENCIA' ? 'border-secondary bg-surface-container-high' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-body-lg text-on-surface uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-secondary">qr_code_scanner</span> Transferencia
                  </span>
                  <input
                    type="radio"
                    name="pos-payment"
                    checked={paymentMethod === 'TRANSFERENCIA'}
                    onChange={() => setPaymentMethod('TRANSFERENCIA')}
                    className="accent-secondary"
                  />
                </div>
                <span className="font-data-mono text-[11px] text-outline uppercase mt-1">
                  Comprobante digital obligatorio
                </span>
              </label>
            </div>
          </div>

          {/* Campo Comprobante */}
          {paymentMethod === 'TRANSFERENCIA' && (
            <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-surface-container-lowest border border-secondary/40">
              <label className="font-data-mono text-body-sm text-secondary uppercase font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">receipt_long</span> COMPROBANTE DE TRANSFERENCIA
              </label>
              <label
                htmlFor="posVoucherInput"
                className="w-full p-4 rounded bg-surface-container flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-container-high transition-colors border border-dashed border-outline-variant/40"
              >
                <span className="font-data-mono text-body-sm text-outline truncate">
                  {voucherFile ? voucherFile.name : 'Subir captura bancaria o constancia Yape/Plin'}
                </span>
                <span className="px-3 py-1.5 rounded bg-surface-container-high text-on-surface font-data-mono text-body-sm uppercase flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">upload_file</span> Adjuntar
                </span>
                <input
                  id="posVoucherInput"
                  type="file"
                  accept="image/*"
                  onChange={handleVoucherChange}
                  className="hidden"
                />
              </label>
              {voucherPreview && (
                <div className="h-20 w-32 rounded overflow-hidden border border-secondary/50 mx-auto mt-2">
                  <img src={voucherPreview} alt="Comprobante" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {/* Resumen Total */}
          <div className="p-4 rounded-lg bg-surface-container-lowest flex items-center justify-between border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-data-mono text-body-sm text-outline uppercase">TOTAL A COBRAR EN MOSTRADOR</span>
              <span className="font-data-mono text-[11px] text-primary">TICKET IMPRESO AUTOMÁTICO</span>
            </div>
            <span className="font-metric-huge text-headline-lg text-primary tracking-tight font-bold">
              S/ {totalAmount}
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-error-container text-on-error-container rounded-lg font-data-mono text-[12px]">
              {errorMsg}
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-2">
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
              className="px-8 py-3.5 rounded-lg bg-primary text-on-primary font-headline-md text-headline-md uppercase tracking-wider shadow-[0_0_20px_rgba(175,198,255,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[22px]">check_circle</span>
              <span>{loading ? 'Procesando...' : 'VENDER'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

