import React, { useState } from 'react';
import { formatLocalTime, formatPeruDateTime } from '../../utils/formatTime';
import VoucherModal from '../modals/VoucherModal';
import { Check, X, Eye, Trash2, ShieldCheck, ShoppingBag, BadgePercent, ArrowRight } from 'lucide-react';

export default function ApprovalsList({ approvals, onApprove, onReject }) {
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const { membresias_pendientes = [], ventas_pendientes = [] } = approvals;
  const totalCount = membresias_pendientes.length + ventas_pendientes.length;

  const handleOpenVoucher = (data) => {
    setSelectedVoucher(data);
  };

  const formatFechaHora = (dateStr) => {
    return formatPeruDateTime(dateStr);
  };

  return (
    <>
      {/* Resumen Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-outline-variant/20 gap-4">
        <div>
          <span className="font-data-mono text-[11px] text-primary uppercase font-bold tracking-widest block">
            SUPERVISIÓN MAESTRA // RECONCILIACIÓN DIARIA
          </span>
          <h1 className="font-headline-lg text-2xl uppercase tracking-wide text-on-surface font-bold">
            LISTA DE CAMBIOS &amp; AUDITORÍA
          </h1>
        </div>

        <div className="flex items-center gap-3 font-data-mono text-xs">
          <div className="bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30 flex items-center gap-2">
            <span className="text-on-surface-variant uppercase">PENDIENTES:</span>
            <span className="text-tertiary font-bold">{totalCount} REGISTROS</span>
          </div>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="bg-surface-container-low rounded-2xl p-12 text-center flex flex-col items-center gap-3 border border-outline-variant/30 shadow-lg my-6">
          <span className="material-symbols-outlined text-[48px] text-primary">verified</span>
          <h3 className="font-headline-md text-xl text-on-surface uppercase font-bold">
            SIN CAMBIOS PENDIENTES DE AUDITAR
          </h3>
          <p className="font-body-sm text-outline max-w-md text-sm">
            Todas las renovaciones de membresías y ventas en mostrador han sido aceptadas y conciliadas correctamente.
          </p>
        </div>
      ) : (
        /* Master Twin Audit Columns (2 Columnas Paralelas y Ordenadas) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg items-start pb-20">
          {/* COLUMNA IZQUIERDA: CAMBIOS EN MEMBRESÍAS */}
          <div className="flex flex-col gap-4">
            <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between shadow-sm border-l-4 border-primary border border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">card_membership</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-lg uppercase tracking-wide text-on-surface font-bold leading-tight">
                    CAMBIOS EN MEMBRESÍAS
                  </h2>
                  <p className="font-data-mono text-[11px] text-on-surface-variant uppercase">
                    AUDITORÍA // RENOVACIONES &amp; EXTENSIONES
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-surface-container-high text-primary font-data-mono text-xs rounded-lg font-bold">
                {membresias_pendientes.length} PENDIENTES
              </span>
            </div>

            {membresias_pendientes.length === 0 ? (
              <div className="bg-surface-container-low p-6 rounded-xl text-center text-on-surface-variant font-data-mono text-xs border border-outline-variant/15">
                No hay cambios de membresía pendientes
              </div>
            ) : (
              membresias_pendientes.map((m) => {
                const isTransfer = m.metodo_pago === 'TRANSFERENCIA';
                const hasVoucher = isTransfer && m.comprobante_url && m.comprobante_url !== 'PURGADO_TRAS_APROBACION';

                return (
                  <div
                    key={m.id}
                    className="bg-surface-container p-5 rounded-xl shadow-md border border-outline-variant/20 hover:border-outline-variant/40 transition-all flex flex-col gap-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-headline-md text-base text-on-surface uppercase font-bold">
                            {m.atleta_nombres} {m.atleta_apellidos}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary-fixed border border-primary/30 font-label-badge text-xs uppercase tracking-wider font-bold">
                            Cambiado por: {m.operador_nombre || 'Recepción'}
                          </span>
                        </div>
                        <p className="font-data-mono text-xs text-on-surface-variant mt-0.5">
                          DNI: <span className="text-on-surface font-semibold">{m.atleta_dni}</span> // ID: <span className="text-primary font-semibold">USR-{m.usuario_id}</span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="font-headline-md text-lg text-primary font-extrabold block leading-none">
                          S/ {parseFloat(m.monto || 0).toFixed(2)}
                        </span>
                        <span className="font-data-mono text-[10px] text-on-surface-variant uppercase block mt-0.5">
                          {isTransfer ? 'TRANSFERENCIA' : 'CAJA FÍSICA'}
                        </span>
                      </div>
                    </div>

                    {/* Bloque de Atributos */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/10 text-xs">
                      <div>
                        <span className="font-data-mono text-[10px] uppercase text-on-surface-variant block">
                          TIEMPO AGREGADO
                        </span>
                        <span className="font-headline-md text-sm text-tertiary uppercase font-bold block mt-0.5">
                          +{m.dias_agregados} DÍAS
                        </span>
                      </div>
                      <div>
                        <span className="font-data-mono text-[10px] uppercase text-on-surface-variant block">
                          FECHA &amp; HORA
                        </span>
                        <span className="font-data-mono text-xs text-on-surface block mt-0.5">
                          {formatFechaHora(m.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="font-data-mono text-[10px] uppercase text-on-surface-variant block">
                          MÉTODO DE PAGO
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-data-mono text-xs text-primary font-semibold">
                            {m.metodo_pago}
                          </span>
                          {hasVoucher && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenVoucher({
                                  imageUrl: m.comprobante_url,
                                  title: `Comprobante - ${m.atleta_nombres} ${m.atleta_apellidos}`,
                                  clientName: `${m.atleta_nombres} ${m.atleta_apellidos}`,
                                  clientDoc: m.atleta_dni,
                                  concept: `Extensión de Membresía (+${m.dias_agregados} días)`,
                                  amount: m.monto,
                                  operationCode: m.numero_operacion || 'OP-TRANSF',
                                  dateTime: formatFechaHora(m.created_at),
                                  paymentMethod: m.metodo_pago,
                                })
                              }
                              className="px-2 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-badge text-[11px] tracking-wider uppercase inline-flex items-center gap-1 border border-outline-variant/30 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" /> Ver imagen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción: Denegar o Aceptar cambio */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-outline-variant/15">
                      <p className="font-data-mono text-[11px] text-on-surface-variant leading-tight flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5 text-tertiary" />
                        <span>Aceptar libera la foto; Denegar revierte y elimina</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onReject('membresia', m.id)}
                          className="bg-error-container/20 hover:bg-error-container text-error hover:text-on-error-container border border-error/30 font-headline-md text-xs tracking-wider uppercase px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer"
                          title="Denegar cambio y revertir operación"
                        >
                          <X className="w-4 h-4" />
                          <span>DENEGAR CAMBIO</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onApprove('membresia', m.id)}
                          className="bg-primary-container hover:bg-primary text-on-primary-container font-headline-md text-xs tracking-wider uppercase px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold shadow transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>ACEPTAR CAMBIO</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* COLUMNA DERECHA: VENTA DE PRODUCTOS */}
          <div className="flex flex-col gap-4">
            <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between shadow-sm border-l-4 border-tertiary border border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-lg uppercase tracking-wide text-on-surface font-bold leading-tight">
                    VENTA DE PRODUCTOS
                  </h2>
                  <p className="font-data-mono text-[11px] text-on-surface-variant uppercase">
                    AUDITORÍA // TIENDA TÁCTICA &amp; STOCK
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-surface-container-high text-tertiary font-data-mono text-xs rounded-lg font-bold">
                {ventas_pendientes.length} PENDIENTES
              </span>
            </div>

            {ventas_pendientes.length === 0 ? (
              <div className="bg-surface-container-low p-6 rounded-xl text-center text-on-surface-variant font-data-mono text-xs border border-outline-variant/15">
                No hay ventas de productos pendientes
              </div>
            ) : (
              ventas_pendientes.map((v) => {
                const isTransfer = v.metodo_pago === 'TRANSFERENCIA';
                const hasVoucher = isTransfer && v.comprobante_url && v.comprobante_url !== 'PURGADO_TRAS_APROBACION';

                return (
                  <div
                    key={v.id}
                    className="bg-surface-container p-5 rounded-xl shadow-md border border-outline-variant/20 hover:border-outline-variant/40 transition-all flex flex-col gap-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-headline-md text-base text-on-surface uppercase font-bold">
                            {v.producto_nombre}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-container-highest text-tertiary border border-tertiary/30 font-label-badge text-xs uppercase tracking-wider font-bold">
                            Vendido por: {v.operador_nombre || 'Recepción'}
                          </span>
                        </div>
                        <p className="font-data-mono text-xs text-on-surface-variant mt-0.5">
                          SKU: <span className="text-on-surface font-semibold">{v.producto_sku || 'N/A'}</span> // Cantidad: <span className="text-primary font-semibold">{v.cantidad} unid.</span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="font-headline-md text-lg text-tertiary font-extrabold block leading-none">
                          S/ {parseFloat(v.total || 0).toFixed(2)}
                        </span>
                        <span className="font-data-mono text-[10px] text-on-surface-variant uppercase block mt-0.5">
                          {isTransfer ? 'TRANSFERENCIA' : 'CAJA FÍSICA'}
                        </span>
                      </div>
                    </div>

                    {/* Bloque de Atributos */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/10 text-xs">
                      <div>
                        <span className="font-data-mono text-[10px] uppercase text-on-surface-variant block">
                          CANTIDAD VENDIDA
                        </span>
                        <span className="font-headline-md text-sm text-primary uppercase font-bold block mt-0.5">
                          {v.cantidad} {v.cantidad === 1 ? 'UNIDAD' : 'UNIDADES'}
                        </span>
                      </div>
                      <div>
                        <span className="font-data-mono text-[10px] uppercase text-on-surface-variant block">
                          FECHA &amp; HORA
                        </span>
                        <span className="font-data-mono text-xs text-on-surface block mt-0.5">
                          {formatFechaHora(v.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="font-data-mono text-[10px] uppercase text-on-surface-variant block">
                          MÉTODO DE PAGO
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-data-mono text-xs text-tertiary font-semibold">
                            {v.metodo_pago}
                          </span>
                          {hasVoucher && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenVoucher({
                                  imageUrl: v.comprobante_url,
                                  title: `Comprobante - ${v.producto_nombre}`,
                                  clientName: `Venta por ${v.operador_nombre || 'Recepción'}`,
                                  clientDoc: v.producto_sku || 'SKU',
                                  concept: `${v.producto_nombre} (${v.cantidad} un.)`,
                                  amount: v.total,
                                  operationCode: 'OP-VENTA-POS',
                                  dateTime: formatFechaHora(v.created_at),
                                  paymentMethod: v.metodo_pago,
                                })
                              }
                              className="px-2 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-tertiary font-label-badge text-[11px] tracking-wider uppercase inline-flex items-center gap-1 border border-outline-variant/30 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" /> Ver imagen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción: Denegar o Aceptar cambio */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-outline-variant/15">
                      <p className="font-data-mono text-[11px] text-on-surface-variant leading-tight flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5 text-tertiary" />
                        <span>Aceptar libera la foto; Denegar revierte y elimina</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onReject('producto', v.id)}
                          className="bg-error-container/20 hover:bg-error-container text-error hover:text-on-error-container border border-error/30 font-headline-md text-xs tracking-wider uppercase px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer"
                          title="Denegar cambio y revertir operación"
                        >
                          <X className="w-4 h-4" />
                          <span>DENEGAR CAMBIO</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onApprove('producto', v.id)}
                          className="bg-tertiary-container hover:bg-tertiary text-on-tertiary-container font-headline-md text-xs tracking-wider uppercase px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold shadow transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>ACEPTAR CAMBIO</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Visor Forense de Voucher */}
      {selectedVoucher && (
        <VoucherModal
          voucherData={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </>
  );
}
