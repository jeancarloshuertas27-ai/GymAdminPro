import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BellRing, CheckCircle, MapPin } from 'lucide-react';

export default function CoachAlertsBanner() {
  const { authFetch, user } = useAuth();
  const [alertas, setAlertas] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  const fetchAlertas = useCallback(async () => {
    if (!user || (user.rol !== 'RECEPCIONISTA' && user.rol !== 'ADMINISTRADOR')) {
      return;
    }
    try {
      const res = await authFetch('/api/alertas-coach/pendientes');
      if (res.ok) {
        const data = await res.json();
        setAlertas(Array.isArray(data.alertas) ? data.alertas : []);
      }
    } catch {
      // Sondeo tolerante a desconexión momentánea
    }
  }, [authFetch, user]);

  useEffect(() => {
    fetchAlertas();
    const interval = setInterval(fetchAlertas, 2000);
    return () => clearInterval(interval);
  }, [fetchAlertas]);

  const handleAtender = async (alertaId) => {
    setProcessingId(alertaId);
    try {
      const res = await authFetch(`/api/alertas-coach/${alertaId}/atender`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setAlertas((prev) => prev.filter((a) => a.id !== alertaId));
      }
    } catch (err) {
      console.error('Error al marcar alerta como atendida:', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (alertas.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-space-md pt-space-md space-y-2 z-30">
      {alertas.map((a) => (
        <div
          key={a.id}
          role="alert"
          className="w-full bg-error-container/95 border-2 border-error/70 rounded-xl px-4 py-3 shadow-[0_0_24px_rgba(255,180,171,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-error text-on-error flex items-center justify-center shrink-0 animate-pulse">
              <BellRing className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-data-mono text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-on-error text-error">
                  LLAMAR COACH EN SALA
                </span>
                <span className="font-headline-md text-lg text-on-error-container uppercase font-bold truncate">
                  {a.miembro_nombre}
                </span>
              </div>
              <p className="font-data-mono text-xs text-on-error-container/90 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Solicita ayuda en <strong className="underline">{a.maquina_numero}</strong>
                  {a.motivo ? ` • Motivo: ${a.motivo}` : ''}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={processingId === a.id}
            onClick={() => handleAtender(a.id)}
            className="px-4 py-2 rounded-lg bg-on-error-container hover:bg-surface text-error-container hover:text-on-surface font-headline-md text-sm uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 shadow transition-all shrink-0 cursor-pointer disabled:opacity-60"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{processingId === a.id ? 'CERRANDO...' : 'MARCAR COMO ATENDIDA'}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
