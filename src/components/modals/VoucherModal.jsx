import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, X, ShieldCheck } from 'lucide-react';

export default function VoucherModal({ voucherData, onClose }) {
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!voucherData) return null;

  const {
    imageUrl,
    title = 'Comprobante de Pago',
    clientName = 'Atleta',
    clientDoc = '00000000',
    concept = 'Membresía / Producto',
    amount = '0.00',
    operationCode = 'N/A',
    dateTime = 'Hoy',
    paymentMethod = 'Transferencia',
  } = voucherData;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, z - 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-container w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-outline-variant/30 animate-fade-in">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-surface-container-high flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline-md text-lg uppercase text-on-surface leading-tight font-bold">
                AUDITORÍA FORENSE DE COMPROBANTE
              </h3>
              <p className="font-data-mono text-[11px] text-on-surface-variant uppercase">
                VERIFICACIÓN CRÍTICA // MONTO &amp; CÓDIGO BANCARIO
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-highest flex items-center justify-center text-on-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Canvas de Zoom Interactivo */}
          <div className="md:col-span-7 bg-surface-container-lowest p-6 flex flex-col items-center justify-center relative select-none overflow-hidden min-h-[380px]">
            {/* Controles de Zoom */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-surface-container/90 backdrop-blur px-2 py-1 rounded-lg border border-outline-variant/30">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded hover:bg-surface-container-high text-primary transition-colors cursor-pointer"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                title="Disminuir zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                title="Restablecer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <span className="font-data-mono text-[11px] text-primary px-1 font-bold">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            <div className="overflow-hidden w-full h-[360px] md:h-[440px] flex items-center justify-center">
              <img
                src={imageUrl}
                alt={title}
                className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-200 shadow-md"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>

            <p className="font-data-mono text-[11px] text-on-surface-variant mt-3 text-center">
              Use controles de zoom para verificar titularidad, número de operación e integridad.
            </p>
          </div>

          {/* Panel de Datos y Conciliación */}
          <div className="md:col-span-5 p-6 flex flex-col justify-between bg-surface-container border-l border-outline-variant/20">
            <div className="space-y-4">
              <div>
                <span className="font-data-mono text-[10px] text-tertiary uppercase font-bold tracking-wider">
                  TITULAR / CLIENTE REGISTRADO
                </span>
                <h4 className="font-headline-md text-lg uppercase text-on-surface font-bold mt-0.5">
                  {clientName}
                </h4>
                <p className="font-data-mono text-xs text-on-surface-variant">
                  DNI / DOC: <span className="text-primary font-semibold">{clientDoc}</span>
                </p>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/15 space-y-1">
                <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">
                  CONCEPTO DECLARADO
                </span>
                <p className="font-headline-md text-base uppercase text-on-surface font-bold">
                  {concept}
                </p>
                <p className="font-data-mono text-xs text-on-surface-variant">
                  Método: <span className="text-tertiary font-bold">{paymentMethod}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/15">
                  <span className="font-data-mono text-[10px] text-on-surface-variant uppercase block">
                    MONTO TOTAL
                  </span>
                  <p className="font-headline-md text-xl text-primary font-extrabold mt-0.5">
                    S/ {parseFloat(amount || 0).toFixed(2)}
                  </p>
                </div>

                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/15">
                  <span className="font-data-mono text-[10px] text-on-surface-variant uppercase block">
                    OPERACIÓN / REF
                  </span>
                  <p className="font-data-mono text-xs text-on-surface font-bold mt-1 truncate">
                    {operationCode}
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/15">
                <span className="font-data-mono text-[10px] text-on-surface-variant uppercase block">
                  FECHA Y HORA DE REGISTRO
                </span>
                <p className="font-data-mono text-xs text-on-surface font-semibold mt-0.5">
                  {dateTime}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-headline-md text-sm uppercase py-2.5 rounded-lg transition-colors font-bold cursor-pointer"
              >
                CERRAR VISOR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
