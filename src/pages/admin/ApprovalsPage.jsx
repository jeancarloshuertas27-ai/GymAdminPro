import React, { useState, useEffect } from 'react';
import ApprovalsList from '../../components/admin/ApprovalsList';
import { formatLocalTime } from '../../utils/formatTime';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState({
    membresias_pendientes: [],
    ventas_pendientes: [],
    resumen_hoy: {
      efectivo_hoy: 0,
      transferencias_hoy: 0,
      total_hoy: 0
    },
    resumen_arqueo: {
      efectivo_hoy: 0,
      transferencias_hoy: 0,
      total_hoy: 0,
      total_efectivo_pendiente: 0,
      total_transferencia_pendiente: 0,
      total_pendiente: 0,
      total_transacciones_pendientes: 0
    },
    historial_hoy: {
      ventas: [],
      membresias: []
    }
  });
  const [activeTab, setActiveTab] = useState('pendientes'); // 'pendientes' | 'historial'
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchApprovals = async () => {
    try {
      const token = localStorage.getItem('gymcore_token') || localStorage.getItem('token');
      const res = await fetch('/api/aprobaciones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApprovals(data);
      }
    } catch (err) {
      console.error('Error al cargar lista de aprobaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (tipo, id) => {
    try {
      const token = localStorage.getItem('gymcore_token') || localStorage.getItem('token');
      const res = await fetch(`/api/aprobaciones/${tipo}/${id}/aprobar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al aprobar solicitud.');
        return;
      }
      setToastMessage(data.mensaje || '¡Operación aprobada y conciliada exitosamente!');
      setTimeout(() => setToastMessage(null), 5000);
      fetchApprovals();
    } catch (err) {
      console.error('Error aprobando:', err);
      alert('Error de conexión al aprobar.');
    }
  };

  const handleReject = async (tipo, id, motivo) => {
    try {
      const token = localStorage.getItem('gymcore_token') || localStorage.getItem('token');
      const res = await fetch(`/api/aprobaciones/${tipo}/${id}/rechazar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ motivo })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al rechazar solicitud.');
        return;
      }
      setToastMessage(data.mensaje || 'Solicitud rechazada correctamente.');
      setTimeout(() => setToastMessage(null), 5000);
      fetchApprovals();
    } catch (err) {
      console.error('Error rechazando:', err);
      alert('Error de conexión al rechazar.');
    }
  };

  const totalPendientes =
    (approvals?.membresias_pendientes?.length || 0) +
    (approvals?.ventas_pendientes?.length || 0);

  const totalHistorial =
    (approvals?.historial_hoy?.ventas?.length || 0) +
    (approvals?.historial_hoy?.membresias?.length || 0);

  const resumen = approvals.resumen_hoy || approvals.resumen_arqueo || {
    efectivo_hoy: 0,
    transferencias_hoy: 0,
    total_hoy: 0
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 pb-32">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-primary-container text-on-primary-container px-6 py-4 rounded-xl shadow-2xl border border-primary flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
          <span className="font-headline-md text-headline-md uppercase tracking-wider">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[28px]">verified_user</span>
            <span className="font-data-mono text-[11px] tracking-widest text-primary font-bold uppercase">
              AUDITORÍA FINANCIERA & ARQUEO DE CAJA
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tight">
            CAMBIOS Y APROBACIONES
          </h1>
          <p className="font-body-md text-on-surface-variant max-w-2xl mt-1">
            Supervisión, verificación de ingresos y arqueo de operaciones registradas por recepción (Efectivo y Transferencias). Valide el dinero físico o conciliaciones bancarias para cuadrar la caja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchApprovals}
            className="p-2.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface transition-colors flex items-center gap-1.5 font-data-mono text-body-sm cursor-pointer"
            title="Refrescar datos"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Tarjetas HUD de Arqueo y Dinero del Día */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Efectivo Hoy */}
        <div className="bg-surface-container-low p-5 rounded-xl border border-emerald-500/30 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-data-mono text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
              EFECTIVO HOY
            </span>
            <span className="material-symbols-outlined text-emerald-400 text-[24px]">payments</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-headline-xl text-[28px] text-emerald-400 font-bold">
              S/ {parseFloat(resumen.efectivo_hoy || 0).toFixed(2)}
            </span>
          </div>
          <span className="font-data-mono text-[11px] text-outline mt-1">
            Total en efectivo de operaciones aprobadas hoy
          </span>
        </div>

        {/* Transferencias Hoy */}
        <div className="bg-surface-container-low p-5 rounded-xl border border-blue-500/30 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-data-mono text-[11px] text-blue-400 font-bold uppercase tracking-wider">
              TRANSFERENCIAS HOY
            </span>
            <span className="material-symbols-outlined text-blue-400 text-[24px]">account_balance</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-headline-xl text-[28px] text-blue-400 font-bold">
              S/ {parseFloat(resumen.transferencias_hoy || 0).toFixed(2)}
            </span>
          </div>
          <span className="font-data-mono text-[11px] text-outline mt-1">
            Total de transferencias bancarias aprobadas hoy
          </span>
        </div>

        {/* Total Hoy */}
        <div className="bg-surface-container-low p-5 rounded-xl border border-primary/30 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-data-mono text-[11px] text-primary font-bold uppercase tracking-wider">
              TOTAL HOY
            </span>
            <span className="material-symbols-outlined text-primary text-[24px]">paid</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-headline-xl text-[28px] text-primary font-bold">
              S/ {parseFloat(resumen.total_hoy || 0).toFixed(2)}
            </span>
          </div>
          <span className="font-data-mono text-[11px] text-outline mt-1">
            Suma de efectivo y transferencias aprobados hoy
          </span>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('pendientes')}
          className={`px-5 py-2.5 rounded-lg font-label-badge text-label-badge uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'pendientes'
              ? 'bg-primary-container text-on-primary-container font-bold shadow-md'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
          <span>EN ESPERA DE APROBACIÓN ({totalPendientes})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historial')}
          className={`px-5 py-2.5 rounded-lg font-label-badge text-label-badge uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'historial'
              ? 'bg-primary-container text-on-primary-container font-bold shadow-md'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span>HISTORIAL DE OPERACIONES DEL DÍA ({totalHistorial})</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-outline">
          <span className="material-symbols-outlined animate-spin text-[36px] text-primary">progress_activity</span>
          <span className="font-data-mono text-body-sm uppercase tracking-widest">Cargando registros financieros...</span>
        </div>
      ) : activeTab === 'pendientes' ? (
        <ApprovalsList
          approvals={approvals}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : (
        /* Vista de Historial de Operaciones del Día */
        <div className="flex flex-col gap-6">
          {/* Historial de Ventas Hoy */}
          <section className="bg-surface-container-low rounded-xl p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">inventory_2</span>
              <span>VENTAS DE PRODUCTOS REGISTRADAS HOY ({approvals?.historial_hoy?.ventas?.length || 0})</span>
            </h2>

            {approvals?.historial_hoy?.ventas?.length === 0 ? (
              <p className="font-body-sm text-outline">No hay ventas registradas en el día de hoy.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {approvals.historial_hoy.ventas.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-lg bg-surface-container flex items-center justify-between border border-outline-variant/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-[22px]">shopping_bag</span>
                      <div className="flex flex-col">
                        <span className="font-headline-md text-[15px] uppercase text-on-surface">
                          {v.producto_nombre} ({v.cantidad} UNID)
                        </span>
                        <span className="font-data-mono text-[11px] text-outline">
                          SKU: {v.producto_sku} • Operador: {v.operador_nombre} • Hora: {formatLocalTime(v.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-0.5 rounded font-data-mono text-[10px] uppercase font-bold ${
                        v.metodo_pago === 'EFECTIVO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {v.metodo_pago}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-data-mono text-[10px] uppercase font-bold ${
                        v.estado === 'APROBADO' ? 'bg-primary-container/20 text-primary' : v.estado === 'RECHAZADO' ? 'bg-error-container/20 text-error' : 'bg-tertiary-container/20 text-tertiary'
                      }`}>
                        {v.estado}
                      </span>
                      <span className="font-headline-md text-[16px] text-on-surface font-bold min-w-[90px] text-right">
                        S/ {parseFloat(v.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Historial de Membresías Hoy */}
          <section className="bg-surface-container-low rounded-xl p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">card_membership</span>
              <span>MEMBRESÍAS REGISTRADAS HOY ({approvals?.historial_hoy?.membresias?.length || 0})</span>
            </h2>

            {approvals?.historial_hoy?.membresias?.length === 0 ? (
              <p className="font-body-sm text-outline">No hay membresías registradas en el día de hoy.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {approvals.historial_hoy.membresias.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-lg bg-surface-container flex items-center justify-between border border-outline-variant/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
                      <div className="flex flex-col">
                        <span className="font-headline-md text-[15px] uppercase text-on-surface">
                          {m.atleta_nombre} (DNI: {m.atleta_dni})
                        </span>
                        <span className="font-data-mono text-[11px] text-outline">
                          +{m.dias_agregados} Días • Operador: {m.operador_nombre} • Hora: {formatLocalTime(m.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-0.5 rounded font-data-mono text-[10px] uppercase font-bold ${
                        m.metodo_pago === 'EFECTIVO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {m.metodo_pago}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-data-mono text-[10px] uppercase font-bold ${
                        m.estado === 'APROBADO' ? 'bg-primary-container/20 text-primary' : m.estado === 'RECHAZADO' ? 'bg-error-container/20 text-error' : 'bg-tertiary-container/20 text-tertiary'
                      }`}>
                        {m.estado}
                      </span>
                      <span className="font-headline-md text-[16px] text-on-surface font-bold min-w-[90px] text-right">
                        S/ {parseFloat(m.monto).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
