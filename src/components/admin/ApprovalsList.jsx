import React, { useState } from 'react';
import { formatLocalTime } from '../../utils/formatTime';

export default function ApprovalsList({ approvals, onApprove, onReject }) {
  const [previewVoucher, setPreviewVoucher] = useState(null);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { membresias_pendientes = [], ventas_pendientes = [] } = approvals;
  const totalCount = membresias_pendientes.length + ventas_pendientes.length;

  const handleConfirmReject = (e) => {
    e.preventDefault();
    if (!rejectingItem) return;
    onReject(rejectingItem.tipo, rejectingItem.id, rejectReason || 'Rechazado por administración');
    setRejectingItem(null);
    setRejectReason('');
  };

  if (totalCount === 0) {
    return (
      <div className="bg-surface-container-low rounded-xl p-12 text-center flex flex-col items-center gap-3 border border-outline-variant/30 shadow-lg">
        <span className="material-symbols-outlined text-[48px] text-primary">verified</span>
        <h3 className="font-headline-md text-headline-md text-on-surface uppercase">
          SIN CONCILIACIONES PENDIENTES
        </h3>
        <p className="font-body-sm text-outline max-w-md">
          Todas las operaciones de mostrador (efectivo y transferencias) registradas por recepción han sido auditadas y cuadradas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Sección 1: Membresías Pendientes */}
      {membresias_pendientes.length > 0 && (
        <section className="bg-surface-container-low rounded-xl p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">card_membership</span>
              <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
                EXTENSIONES DE MEMBRESÍA EN RECEPCIÓN ({membresias_pendientes.length})
              </h2>
            </div>
            <span className="font-data-mono text-[11px] text-tertiary font-bold uppercase bg-tertiary-container/20 px-2 py-0.5 rounded">
              AUDITORÍA DE PAGOS Y PASES
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {membresias_pendientes.map((m) => {
              const isEfectivo = m.metodo_pago === 'EFECTIVO';

              return (
                <div
                  key={m.id}
                  className="bg-surface-container rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-outline-variant/20 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[26px]">person</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-md text-[17px] text-on-surface uppercase">
                          {m.atleta_nombres} {m.atleta_apellidos}
                        </span>
                        {isEfectivo ? (
                          <span className="px-2 py-0.5 rounded font-data-mono text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">payments</span>
                            EFECTIVO // CAJA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded font-data-mono text-[10px] uppercase font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">account_balance</span>
                            TRANSFERENCIA // BANCO
                          </span>
                        )}
                      </div>
                      <span className="font-data-mono text-[12px] text-on-surface-variant mt-0.5">
                        DNI: <strong className="text-on-surface">{m.atleta_dni}</strong> • Plan:{' '}
                        <span className="text-primary">{m.promocion_nombre || 'Recarga Manual'}</span> (+{m.dias_agregados} Días)
                      </span>
                      <span className="font-data-mono text-[11px] text-outline mt-0.5">
                        Operador: <strong className="text-on-surface-variant">{m.operador_nombre}</strong> • Hora: {formatLocalTime(m.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-data-mono text-[11px] text-outline uppercase block">
                        {isEfectivo ? 'EFECTIVO RECIBIDO' : 'MONTO TRANSFERIDO'}
                      </span>
                      <span className="font-headline-md text-headline-md text-primary font-bold">
                        S/ {parseFloat(m.monto).toFixed(2)}
                      </span>
                    </div>

                    {!isEfectivo && m.comprobante_url && m.comprobante_url !== 'PURGADO_TRAS_APROBACION' && (
                      <button
                        type="button"
                        onClick={() => setPreviewVoucher(m.comprobante_url)}
                        className="px-3 py-2 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-data-mono text-body-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30"
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary">visibility</span>
                        <span>Ver Voucher</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onApprove('membresia', m.id)}
                      className="px-4 py-2 rounded bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary font-label-badge uppercase tracking-wider text-[13px] flex items-center gap-1 shadow-md transition-all font-bold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>APROBAR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRejectingItem({ tipo: 'membresia', id: m.id })}
                      className="px-3 py-2 rounded bg-surface-container-high hover:bg-error-container hover:text-error text-outline font-label-badge uppercase tracking-wider text-[13px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      <span>RECHAZAR</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Sección 2: Ventas de Productos Pendientes */}
      {ventas_pendientes.length > 0 && (
        <section className="bg-surface-container-low rounded-xl p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[24px]">point_of_sale</span>
              <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
                VENTAS DE PRODUCTOS EN RECEPCIÓN ({ventas_pendientes.length})
              </h2>
            </div>
            <span className="font-data-mono text-[11px] text-secondary font-bold uppercase bg-secondary-container/20 px-2 py-0.5 rounded">
              ARQUEO DE MOSTRADOR
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {ventas_pendientes.map((v) => {
              const isEfectivo = v.metodo_pago === 'EFECTIVO';

              return (
                <div
                  key={v.id}
                  className="bg-surface-container rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-outline-variant/20 hover:border-secondary/40 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[26px]">inventory_2</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-md text-[17px] text-on-surface uppercase">
                          {v.producto_nombre} ({v.cantidad} UNID)
                        </span>
                        {isEfectivo ? (
                          <span className="px-2 py-0.5 rounded font-data-mono text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">payments</span>
                            EFECTIVO // CAJA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded font-data-mono text-[10px] uppercase font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">account_balance</span>
                            TRANSFERENCIA // BANCO
                          </span>
                        )}
                      </div>
                      <span className="font-data-mono text-[12px] text-on-surface-variant mt-0.5">
                        SKU: <span className="text-on-surface">{v.producto_sku}</span> • Unitario: S/{' '}
                        {parseFloat(v.precio_unitario).toFixed(2)}
                      </span>
                      <span className="font-data-mono text-[11px] text-outline mt-0.5">
                        Operador: <strong className="text-on-surface-variant">{v.operador_nombre}</strong> • Hora: {formatLocalTime(v.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-data-mono text-[11px] text-outline uppercase block">
                        {isEfectivo ? 'TOTAL EFECTIVO' : 'TOTAL TRANSFERIDO'}
                      </span>
                      <span className="font-headline-md text-headline-md text-secondary font-bold">
                        S/ {parseFloat(v.total).toFixed(2)}
                      </span>
                    </div>

                    {!isEfectivo && v.comprobante_url && v.comprobante_url !== 'PURGADO_TRAS_APROBACION' && (
                      <button
                        type="button"
                        onClick={() => setPreviewVoucher(v.comprobante_url)}
                        className="px-3 py-2 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-data-mono text-body-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30"
                      >
                        <span className="material-symbols-outlined text-[18px] text-secondary">visibility</span>
                        <span>Ver Voucher</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onApprove('producto', v.id)}
                      className="px-4 py-2 rounded bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary-fixed font-label-badge uppercase tracking-wider text-[13px] flex items-center gap-1 shadow-md transition-all font-bold cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>APROBAR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRejectingItem({ tipo: 'producto', id: v.id })}
                      className="px-3 py-2 rounded bg-surface-container-high hover:bg-error-container hover:text-error text-outline font-label-badge uppercase tracking-wider text-[13px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      <span>RECHAZAR</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modal para Visualizar Voucher */}
      {previewVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/85 backdrop-blur-md">
          <div className="max-w-xl w-full bg-surface-container rounded-xl p-4 flex flex-col gap-4 shadow-2xl border border-primary/40">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
              <span className="font-headline-md text-headline-md uppercase text-on-surface">
                Comprobante Digital Adjunto
              </span>
              <button
                type="button"
                onClick={() => setPreviewVoucher(null)}
                className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded bg-surface-container-lowest flex items-center justify-center p-2">
              <img src={previewVoucher} alt="Voucher" className="max-w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Modal para Confirmar Rechazo */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/85 backdrop-blur-md">
          <form
            onSubmit={handleConfirmReject}
            className="max-w-md w-full bg-surface-container rounded-xl p-6 flex flex-col gap-4 shadow-2xl border border-error/40"
          >
            <div className="flex items-center gap-2 text-error">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h3 className="font-headline-md text-headline-md uppercase">Rechazar Transacción</h3>
            </div>
            <p className="font-body-sm text-on-surface-variant">
              {rejectingItem.tipo === 'producto'
                ? 'Al rechazar esta venta, las unidades se reintegrarán automáticamente al stock disponible del producto.'
                : 'Al rechazar esta membresía, los días correspondientes no se concederán (o se revertirán si fueron otorgados en mostrador).'}
            </p>
            <div className="flex flex-col gap-1">
              <label className="font-data-mono text-[11px] uppercase text-outline">Motivo del Rechazo</label>
              <input
                type="text"
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej. Importe no coincide con arqueo de caja..."
                className="px-3 py-2 rounded bg-surface-container-lowest text-on-surface font-body-sm border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded bg-surface-container-high text-outline hover:text-on-surface font-label-badge uppercase text-[12px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-error-container hover:bg-error text-on-error font-label-badge uppercase text-[12px] font-bold shadow-md cursor-pointer"
              >
                Confirmar Rechazo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
