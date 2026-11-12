import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Package, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  QrCode,
  DollarSign
} from 'lucide-react';

export default function AdminDashboard({ onNavigate }) {
  const { authFetch } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dniInput, setDniInput] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const fetchMetrics = async () => {
    try {
      const res = await authFetch('/api/reportes/dashboard');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000); // Refresco cada 15s
    return () => clearInterval(interval);
  }, []);

  const handleCheckin = async (e) => {
    if (e) e.preventDefault();
    if (!dniInput || dniInput.trim().length !== 8) {
      alert('Ingrese un DNI de 8 dígitos');
      return;
    }
    setCheckinLoading(true);
    try {
      const res = await authFetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: dniInput.trim() }),
      });
      const data = await res.json();
      setCheckinResult(data);
      fetchMetrics(); // refresca métricas
    } catch (err) {
      console.error('Error en check-in:', err);
    } finally {
      setCheckinLoading(false);
    }
  };

  const ingresos = metrics?.ingresos_hoy || { total: 0, membresias: 0, productos: 0 };
  const atletas = metrics?.atletas || { total_activos: 0, por_vencer_10d: 0, nuevos_este_mes: 0 };
  const stockCritico = metrics?.stock_critico || { total_items: 0, items: [] };
  const aprobaciones = metrics?.aprobaciones || { total_pendientes: 0, recientes: [] };

  const totalIngresos = ingresos.total || 0;
  const membPct = totalIngresos > 0 ? ((ingresos.membresias / totalIngresos) * 100).toFixed(1) : 0;
  const prodPct = totalIngresos > 0 ? ((ingresos.productos / totalIngresos) * 100).toFixed(1) : 0;

  return (
    <div className="w-full min-h-screen p-space-lg flex flex-col gap-space-lg bg-surface font-body-md text-on-surface">
      {/* Subheader Ejecutivo Limpio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl shadow-lg border border-outline-variant/20">
        <div className="flex items-center gap-space-md">
          <div className="w-12 h-12 bg-primary-container flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(31,113,239,0.3)] text-on-primary-container">
            <span className="material-symbols-outlined text-[28px]">speed</span>
          </div>
          <div>
            <div className="flex items-center gap-space-xs">
              <span className="font-data-mono text-[11px] text-primary tracking-widest uppercase font-bold">
                PANEL MAESTRO // TIEMPO REAL
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping"></span>
            </div>
            <h1 className="font-headline-lg text-2xl uppercase tracking-wide text-on-surface font-bold">
              OPERACIONES GENERALES
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 font-data-mono text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant border border-outline-variant/30">
            SOLES S/ // PERÚ
          </span>
          <button
            type="button"
            onClick={fetchMetrics}
            className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary flex items-center gap-1 transition-colors border border-outline-variant/30 cursor-pointer"
            title="Actualizar datos"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>ACTUALIZAR</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: BENTO GRID DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-md">
        {/* Métrica 1: Ingresos del Día (5 columnas) */}
        <div className="lg:col-span-5 bg-surface-container p-space-lg rounded-xl shadow-md border border-outline-variant/20 flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                TELEMETRÍA FINANCIERA // HOY
              </span>
              <h2 className="font-headline-md text-xl uppercase font-bold text-on-surface">
                Ingresos del Día
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded bg-secondary-container/60 text-primary font-data-mono text-xs font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> EN VIVO
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="font-headline-lg text-2xl text-primary font-bold">S/</span>
              <span className="font-metric-huge text-4xl sm:text-5xl text-on-surface font-extrabold tracking-tight">
                {parseFloat(totalIngresos).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Desglose: Membresías vs Productos */}
          <div className="grid grid-cols-2 gap-3 pt-3 bg-surface-container-low p-3 rounded-lg border border-outline-variant/10">
            <div className="flex flex-col">
              <span className="font-data-mono text-[11px] text-on-surface-variant uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span> Membresías
              </span>
              <span className="font-headline-md text-base text-on-surface font-bold mt-0.5">
                S/ {parseFloat(ingresos.membresias).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="w-full bg-surface-container-highest h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${membPct}%` }}></div>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="font-data-mono text-[11px] text-on-surface-variant uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span> Productos
              </span>
              <span className="font-headline-md text-base text-on-surface font-bold mt-0.5">
                S/ {parseFloat(ingresos.productos).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="w-full bg-surface-container-highest h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-tertiary h-full rounded-full transition-all duration-500" style={{ width: `${prodPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Métrica 2: Atletas Activos Totales (4 columnas) */}
        <div className="lg:col-span-4 bg-surface-container p-space-lg rounded-xl shadow-md border border-outline-variant/20 flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                AFORO DE ATLETAS // PADRÓN
              </span>
              <h2 className="font-headline-md text-xl uppercase font-bold text-on-surface">
                Atletas Activos
              </h2>
            </div>
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="my-4 flex items-baseline gap-2">
            <span className="font-metric-huge text-4xl sm:text-5xl text-on-surface font-extrabold">
              {atletas.total_activos}
            </span>
            <span className="font-headline-md text-lg text-on-surface-variant uppercase font-semibold">
              ATLETAS
            </span>
          </div>

          <div className="flex flex-col gap-2 bg-surface-container-low p-3 rounded-lg font-data-mono text-xs border border-outline-variant/10">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-tertiary" /> Por vencer (&le;10d):
              </span>
              <span className="text-tertiary font-bold text-xs">{atletas.por_vencer_10d} atletas</span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-primary"></span> Nuevos este mes:
              </span>
              <span className="text-primary font-bold text-xs">+{atletas.nuevos_este_mes} registros</span>
            </div>
          </div>
        </div>

        {/* Métrica 3: Productos Stock Crítico (3 columnas) */}
        <div className="lg:col-span-3 bg-surface-container p-space-lg rounded-xl shadow-md border border-outline-variant/20 flex flex-col justify-between hover:border-error/40 transition-all relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-data-mono text-[11px] uppercase tracking-wider text-error font-bold">
                ALERTA INVENTARIO
              </span>
              <h2 className="font-headline-md text-xl uppercase font-bold text-on-surface">
                Stock Crítico
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded bg-error-container text-on-error font-label-badge text-xs uppercase font-bold">
              &lt; 5 UNID.
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-2">
            <span className="font-metric-huge text-4xl sm:text-5xl text-error font-extrabold">
              {String(stockCritico.total_items).padStart(2, '0')}
            </span>
            <span className="font-headline-md text-sm text-on-surface-variant uppercase font-semibold">
              ITEMS EN ALERTA
            </span>
          </div>

          <div className="flex flex-col gap-1.5 bg-surface-container-low p-2.5 rounded-lg text-xs font-data-mono border border-outline-variant/10">
            {stockCritico.items.length === 0 ? (
              <span className="text-on-surface-variant py-1 text-center">Sin alertas de stock</span>
            ) : (
              stockCritico.items.slice(0, 2).map((item) => (
                <div key={item.id} className="flex justify-between items-center text-[11px]">
                  <span className="text-on-surface truncate max-w-[130px]">{item.nombre}</span>
                  <span className="text-error font-bold ml-1">{item.stock} u.</span>
                </div>
              ))
            )}
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/admin/productos')}
              className="text-primary hover:underline text-[11px] pt-1 flex items-center justify-between uppercase font-bold tracking-wider cursor-pointer"
            >
              <span>Ver Inventario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CONTROL DE ACCESO INMEDIATO + TRANSFERENCIAS POR AUDITAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Control de Acceso Rápido (8 columnas) */}
        <div className="lg:col-span-8 bg-surface-container p-space-lg rounded-xl shadow-lg border border-outline-variant/20 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2 border-b border-outline-variant/15">
              <div>
                <span className="font-data-mono text-[11px] text-primary tracking-widest uppercase font-bold block">
                  CHECK-IN TÁCTICO // CONTROL INTEGRADO
                </span>
                <h3 className="font-headline-lg text-xl uppercase tracking-wide text-on-surface font-bold">
                  Control de Acceso Inmediato
                </h3>
              </div>
              <span className="px-3 py-1 bg-surface-container-high rounded text-xs font-data-mono text-on-surface-variant flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                LECTOR DNI ACTIVO
              </span>
            </div>

            {/* Input Gigante de DNI */}
            <form onSubmit={handleCheckin} className="bg-surface-container-lowest p-4 rounded-xl shadow-inner my-4 border border-outline-variant/20">
              <label className="block font-data-mono text-xs text-on-surface-variant uppercase mb-2">
                DIGITAR DNI DEL ATLETA [ENTER O CLIC PARA VERIFICAR]
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  maxLength={8}
                  value={dniInput}
                  onChange={(e) => setDniInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="00000000"
                  className="flex-1 bg-surface-container text-on-surface font-headline-lg text-2xl tracking-widest px-4 py-3 rounded-lg border border-outline-variant/30 focus:outline-none focus:border-primary transition-all font-mono"
                />
                <button
                  type="submit"
                  disabled={checkinLoading}
                  className="bg-primary-container hover:bg-primary text-on-primary-container font-headline-md text-base uppercase px-6 py-3 rounded-lg tracking-wider flex items-center justify-center gap-2 transition-all shadow font-bold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">fingerprint</span>
                  <span>{checkinLoading ? 'VERIFICANDO...' : 'VERIFICAR'}</span>
                </button>
              </div>
            </form>

            {/* Resultado de Check-In Semáforo */}
            {checkinResult && (
              <div className="mt-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 transition-all">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/15">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded-full ${
                        checkinResult.resultado === 'VERDE_AUTORIZADO'
                          ? 'bg-[#3bf589] shadow-[0_0_8px_#3bf589]'
                          : checkinResult.resultado === 'NARANJA_AVISO'
                          ? 'bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]'
                          : 'bg-error shadow-[0_0_8px_#ff5449]'
                      }`}
                    ></span>
                    <span className="font-headline-md text-base uppercase font-bold tracking-wider">
                      {checkinResult.resultado === 'VERDE_AUTORIZADO'
                        ? 'ACCESO AUTORIZADO'
                        : checkinResult.resultado === 'NARANJA_AVISO'
                        ? 'POR VENCER (RENOVAR)'
                        : 'ACCESO DENEGADO (VENCIDO)'}
                    </span>
                  </div>
                  <span className="font-data-mono text-xs text-on-surface-variant">
                    {checkinResult.timestamp || 'Ahora'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="font-data-mono text-[10px] text-on-surface-variant uppercase block">Atleta</span>
                    <span className="font-headline-md text-sm uppercase text-on-surface font-bold">
                      {checkinResult.atleta?.nombres || 'Atleta No Registrado'} {checkinResult.atleta?.apellidos || ''}
                    </span>
                    <span className="font-data-mono text-xs text-primary block">DNI: {dniInput}</span>
                  </div>
                  <div>
                    <span className="font-data-mono text-[10px] text-on-surface-variant uppercase block">Membresía / Plan</span>
                    <span className="font-headline-md text-sm uppercase text-on-surface font-semibold">
                      {checkinResult.membresia?.plan_tag || 'Sin plan'}
                    </span>
                    <span className="font-data-mono text-xs text-on-surface-variant block">
                      Vence: {checkinResult.membresia?.fecha_vencimiento || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-data-mono text-[10px] text-on-surface-variant uppercase block">Estado</span>
                    <span
                      className={`font-headline-md text-sm uppercase font-bold ${
                        checkinResult.resultado === 'VERDE_AUTORIZADO'
                          ? 'text-[#3bf589]'
                          : checkinResult.resultado === 'NARANJA_AVISO'
                          ? 'text-[#f59e0b]'
                          : 'text-error'
                      }`}
                    >
                      {checkinResult.membresia?.dias_restantes !== undefined
                        ? `${checkinResult.membresia.dias_restantes} DÍAS RESTANTES`
                        : checkinResult.motivo || 'VENCIDO'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transferencias por Auditar (4 columnas) */}
        <div className="lg:col-span-4 bg-surface-container p-space-lg rounded-xl shadow-lg border border-outline-variant/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
              <div>
                <span className="font-data-mono text-[11px] text-tertiary uppercase font-bold tracking-widest block">
                  AUDITORÍA FISCAL
                </span>
                <h3 className="font-headline-md text-xl uppercase font-bold text-on-surface">
                  Transferencias
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-tertiary-container text-on-tertiary-container font-label-badge text-xs uppercase font-bold">
                {aprobaciones.total_pendientes} PENDIENTES
              </span>
            </div>

            <p className="font-body-sm text-xs text-on-surface-variant mt-2">
              Comprobantes de transferencia que requieren conciliación antes del corte de turno.
            </p>

            {/* Lista rápida de pendientes */}
            <div className="mt-4 space-y-2.5">
              {aprobaciones.recientes.length === 0 ? (
                <div className="bg-surface-container-low p-4 rounded-lg text-center text-on-surface-variant font-data-mono text-xs">
                  No hay transferencias pendientes
                </div>
              ) : (
                aprobaciones.recientes.map((item, idx) => (
                  <div key={idx} className="bg-surface-container-low p-3 rounded-lg flex items-center justify-between border border-outline-variant/10 hover:bg-surface-container-high transition-colors">
                    <div>
                      <span className="font-headline-md text-sm text-on-surface font-bold block uppercase truncate max-w-[170px]">
                        {item.concepto}
                      </span>
                      <span className="font-data-mono text-[11px] text-on-surface-variant">
                        {item.subtitulo} // {item.metodo_pago}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-headline-md text-sm text-primary font-bold block">
                        S/ {parseFloat(item.monto || 0).toFixed(2)}
                      </span>
                      <span className="font-data-mono text-[10px] text-tertiary font-bold">PENDIENTE</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/admin/aprobaciones')}
              className="w-full bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface font-headline-md text-sm uppercase py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-bold shadow-sm cursor-pointer"
            >
              <span>IR A LISTA DE CAMBIOS &amp; APROBACIONES</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
