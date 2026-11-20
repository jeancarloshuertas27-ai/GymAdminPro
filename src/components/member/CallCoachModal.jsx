import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BellRing, X, Send, MapPin } from 'lucide-react';

const QUICK_MACHINES = [
  'Máquina #08 - Press Banca Smith',
  'Máquina #02 - Prensa 45°',
  'Máquina #07 - Jalón Polea Ancha',
  'Máquina #15 - Pec-Deck',
];

const REASONS = ['Spot / Cuidado', 'Corregir Postura', 'Duda de Rutina'];

export default function CallCoachModal({ isOpen, onClose, onAlertCreated }) {
  const { authFetch } = useAuth();
  const [machineInput, setMachineInput] = useState('');
  const [selectedReason, setSelectedReason] = useState('Corregir Postura');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const cleanMachine = machineInput.trim();
    if (!cleanMachine) {
      setError('Por favor ingresa o selecciona el número de máquina donde te encuentras.');
      return;
    }

    setSending(true);
    try {
      const res = await authFetch('/api/alertas-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maquina_numero: cleanMachine,
          motivo: selectedReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo enviar la solicitud al coach.');
      }

      setMachineInput('');
      if (onAlertCreated) onAlertCreated(data.alerta);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[420px] rounded-t-2xl sm:rounded-2xl bg-surface-container-low p-5 space-y-4 shadow-2xl border border-outline-variant/30"
      >
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline-md text-xl text-on-surface uppercase font-bold leading-tight">
                SOLICITAR COACH EN SALA
              </h3>
              <p className="font-body-sm text-xs text-outline">
                Recepción avisará al entrenador para que acuda a tu máquina
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-error-container text-on-error-container font-data-mono text-xs border border-error/40">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="coach-machine-input"
            className="font-label-badge text-xs text-on-surface-variant uppercase tracking-wider block"
          >
            ¿En qué número de máquina estás?
          </label>
          <input
            id="coach-machine-input"
            type="text"
            autoFocus
            value={machineInput}
            onChange={(e) => setMachineInput(e.target.value)}
            placeholder="Ej: Máquina 8, #04..."
            className="w-full bg-surface-container-lowest text-on-surface font-body-md text-sm px-4 py-3 rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
          />

          <div className="grid grid-cols-2 gap-2 pt-1">
            {QUICK_MACHINES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMachineInput(m)}
                className={`px-2.5 py-2 rounded-lg text-[11px] font-data-mono flex items-center justify-between gap-1 border transition-all cursor-pointer ${
                  machineInput === m
                    ? 'bg-primary-container text-on-primary-container border-primary'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
                }`}
              >
                <span className="truncate">{m}</span>
                <MapPin className="w-3.5 h-3.5 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-label-badge text-xs text-on-surface-variant uppercase tracking-wider block">
            Motivo de la consulta
          </label>
          <div className="grid grid-cols-3 gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedReason(r)}
                className={`py-2 px-1.5 rounded-lg text-center font-label-badge text-[11px] uppercase font-bold border transition-all cursor-pointer ${
                  selectedReason === r
                    ? 'bg-primary-container text-on-primary-container border-primary'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant/20 hover:text-on-surface'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full py-3.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-headline-md text-base tracking-wider uppercase font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{sending ? 'ENVIANDO ALERTA...' : 'NOTIFICAR AYUDA'}</span>
        </button>
      </form>
    </div>
  );
}
