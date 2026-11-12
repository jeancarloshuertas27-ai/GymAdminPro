import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApprovalsList from '../../components/admin/ApprovalsList';
import ReportPdfModal from '../../components/admin/ReportPdfModal';
import { FileText, Download, CheckCircle, ArrowRight } from 'lucide-react';

export default function ApprovalsPage() {
  const { authFetch } = useAuth();
  const [approvals, setApprovals] = useState({
    membresias_pendientes: [],
    ventas_pendientes: [],
  });
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const fetchApprovals = async () => {
    try {
      const res = await authFetch('/api/aprobaciones');
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
      const res = await authFetch(`/api/aprobaciones/${tipo}/${id}/aprobar`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al aceptar cambio.');
        return;
      }
      setToastMessage('Cambio aceptado con éxito. Imagen liberada del servidor y registro contable preservado.');
      setTimeout(() => setToastMessage(null), 4000);
      fetchApprovals();
    } catch (err) {
      console.error('Error al aprobar:', err);
      alert('Error de conexión al aprobar el cambio.');
    }
  };

  const handleReject = async (tipo, id, motivo) => {
    try {
      const res = await authFetch(`/api/aprobaciones/${tipo}/${id}/rechazar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al rechazar.');
        return;
      }
      setToastMessage('Cambio rechazado correctamente.');
      setTimeout(() => setToastMessage(null), 4000);
      fetchApprovals();
    } catch (err) {
      console.error('Error al rechazar:', err);
      alert('Error de conexión al rechazar.');
    }
  };

  const currentDateFormatted = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full min-h-screen p-space-lg flex flex-col relative bg-surface font-body-md text-on-surface">
      {toastMessage && (
        <div className="mb-6 p-4 rounded-xl bg-primary-container text-on-primary-container font-headline-md text-base flex items-center justify-between shadow-xl border border-primary/30 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-on-primary-container" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs uppercase font-bold tracking-wider hover:underline"
          >
            CERRAR
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-on-surface-variant font-data-mono">
          Cargando lista de cambios y aprobaciones...
        </div>
      ) : (
        <ApprovalsList
          approvals={approvals}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* BOTÓN PROMINENTE FLOTANTE: GENERAR REPORTE (ESQUINA INFERIOR DERECHA) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="relative group bg-primary-container hover:bg-tertiary-container text-on-primary-container hover:text-on-tertiary-container px-6 py-4 rounded-xl shadow-[0_8px_30px_rgba(31,113,239,0.45)] hover:shadow-[0_8px_30px_rgba(199,83,2,0.55)] transition-all flex items-center gap-4 border border-primary/50 hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <div className="w-11 h-11 rounded-lg bg-on-primary-container/20 group-hover:bg-on-tertiary-container/20 flex items-center justify-center shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div className="text-left">
            <span className="font-data-mono text-[11px] tracking-wider uppercase block font-bold leading-none text-primary-fixed">
              DESCARGA PDF // CONSOLIDADO DIARIO
            </span>
            <span className="font-headline-lg text-lg uppercase font-bold block leading-none mt-1">
              GENERAR REPORTE
            </span>
            <span className="font-data-mono text-[11px] text-primary-fixed/80 block leading-none mt-1">
              REPORTE {currentDateFormatted}.pdf
            </span>
          </div>
          <ArrowRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      {/* Modal de descarga PDF */}
      <ReportPdfModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}
