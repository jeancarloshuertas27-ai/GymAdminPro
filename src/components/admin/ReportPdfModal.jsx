import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generateReportPdf } from '../../utils/generateReportPdf';
import { FileText, Download, Calendar, X, CheckCircle, DollarSign, Users, Package } from 'lucide-react';

export default function ReportPdfModal({ isOpen, onClose }) {
  const { authFetch } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchReport = async (fecha) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/reportes/diario?fecha=${fecha}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error('Error cargando datos de reporte:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport(selectedDate);
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!reportData) return;
    setGenerating(true);
    try {
      generateReportPdf(reportData, selectedDate);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al compilar el PDF: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const totalMemb = reportData?.bloque_a_membresias?.total_recaudado || 0;
  const totalProd = reportData?.bloque_c_productos_ganancias?.total_ingresos || 0;
  const totalNuevos = reportData?.bloque_b_nuevos_usuarios?.total_nuevos || 0;
  const totalGeneral = reportData?.resumen_total?.total_ingresos_dia || (totalMemb + totalProd);

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-container w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-outline-variant/30 animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-container-high flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline-md text-xl uppercase text-on-surface font-bold leading-tight">
                GENERADOR DE REPORTE DIARIO
              </h3>
              <p className="font-data-mono text-xs text-on-surface-variant uppercase">
                DOCUMENTO OFICIAL EN PDF // CONSOLIDADO POR FECHA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-highest flex items-center justify-center text-on-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Selector de Fecha */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <label className="font-data-mono text-xs text-on-surface-variant uppercase block">
                  FECHA FISCAL A AUDITAR
                </label>
                <span className="font-headline-md text-sm uppercase text-on-surface font-bold">
                  Día seleccionado para el balance
                </span>
              </div>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-surface-container text-on-surface font-data-mono text-sm px-3 py-2 rounded-lg border border-outline-variant/30 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Resumen de los 4 Bloques */}
          {loading ? (
            <div className="py-8 text-center text-on-surface-variant font-data-mono text-sm">
              Cargando consolidado del día...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/15 text-center">
                <span className="font-data-mono text-[10px] text-on-surface-variant uppercase block">
                  MEMBRESÍAS
                </span>
                <span className="font-headline-md text-lg text-primary font-bold block mt-1">
                  S/ {parseFloat(totalMemb).toFixed(2)}
                </span>
                <span className="font-data-mono text-[10px] text-outline">
                  {reportData?.bloque_a_membresias?.cantidad_transacciones || 0} trans.
                </span>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/15 text-center">
                <span className="font-data-mono text-[10px] text-on-surface-variant uppercase block">
                  PRODUCTOS
                </span>
                <span className="font-headline-md text-lg text-tertiary font-bold block mt-1">
                  S/ {parseFloat(totalProd).toFixed(2)}
                </span>
                <span className="font-data-mono text-[10px] text-outline">
                  {reportData?.bloque_d_productos_detalle?.length || 0} items
                </span>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/15 text-center">
                <span className="font-data-mono text-[10px] text-on-surface-variant uppercase block">
                  NUEVOS SOCIOS
                </span>
                <span className="font-headline-md text-lg text-secondary font-bold block mt-1">
                  {totalNuevos}
                </span>
                <span className="font-data-mono text-[10px] text-outline">inscritos</span>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/15 text-center">
                <span className="font-data-mono text-[10px] text-on-surface-variant uppercase block">
                  TOTAL DÍA
                </span>
                <span className="font-headline-md text-lg text-on-surface font-extrabold block mt-1">
                  S/ {parseFloat(totalGeneral).toFixed(2)}
                </span>
                <span className="font-data-mono text-[10px] text-[#3bf589] font-bold">Consolidado</span>
              </div>
            </div>
          )}

          {/* Información del nombre de archivo */}
          <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20 flex items-center justify-between font-data-mono text-xs">
            <span className="text-on-surface-variant uppercase">NOMBRE DE ARCHIVO A GENERAR:</span>
            <span className="text-primary font-bold">REPORTE {selectedDate}.pdf</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-container-high border-t border-outline-variant/20 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-highest text-on-surface font-headline-md text-xs uppercase font-bold transition-colors cursor-pointer"
          >
            CANCELAR
          </button>
          <button
            type="button"
            disabled={loading || generating}
            onClick={handleDownload}
            className="px-6 py-3 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-headline-md text-sm uppercase font-bold tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{generating ? 'COMPILANDO...' : `DESCARGAR 'REPORTE ${selectedDate}.pdf'`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
