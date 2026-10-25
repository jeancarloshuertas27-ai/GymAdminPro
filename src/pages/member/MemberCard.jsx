import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import MobileHeader from '../../components/common/MobileHeader';

export default function MemberCard() {
  const { user, authFetch } = useAuth();
  const [memberData, setMemberData] = useState(null);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState('Máquina #15 - Pec-Deck');
  const [selectedReason, setSelectedReason] = useState('Spot / Cuidado');
  const [alertSent, setAlertSent] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

  useEffect(() => {
    const fetchMemberInfo = async () => {
      try {
        if (user?.id) {
          const res = await authFetch(`/api/users/${user.id}`);
          if (res.ok) {
            const data = await res.json();
            setMemberData(data);
          }
        }
      } catch (e) {
        console.error('Error fetching member card:', e);
      }
    };
    fetchMemberInfo();
  }, [user]);

  const handleSendCoachAlert = () => {
    setSendingAlert(true);
    setTimeout(() => {
      setSendingAlert(false);
      setAlertSent(true);
      setTimeout(() => {
        setAlertSent(false);
        setShowCoachModal(false);
      }, 3000);
    }, 1000);
  };

  const remainingDays = memberData?.remaining?.totalDays || 48;
  const fidelityName = memberData?.fidelity?.name || 'MUTANDO';
  const fidelityMonths = memberData?.fidelity?.months || 9;
  const progressPercent = memberData?.fidelity?.progressPercent || 75;

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen relative overflow-x-hidden pb-20">
      <MobileHeader title="Carnet Digital" />

      <main className="flex flex-col relative w-full pt-20 px-gutter-mobile space-y-space-md">
        {/* TICKET / MEMBRESÍA & GAMIFICACIÓN RADICAL */}
        <div className="relative w-full rounded-xl bg-surface-container-low p-space-md shadow-xl overflow-hidden border border-surface-container">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-primary-container/15 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-start justify-between gap-space-sm relative z-10 mb-space-sm">
            <div className="flex flex-col">
              <span className="font-data-mono text-body-sm text-outline tracking-widest uppercase">
                Pase Atleta Activo
              </span>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  {memberData?.membership?.plan_tag || 'MEMBRESÍA VIP'}
                </span>
                <span className="font-data-mono text-[11px] px-2 py-0.5 rounded-full bg-secondary-container/15 text-primary font-bold tracking-wider">
                  DNI: {user?.dni}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-space-sm py-1.5 rounded-full bg-secondary-container/15 shadow-[0_0_12px_rgba(52,255,140,0.25)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3bf589] animate-pulse"></span>
              <span className="font-label-badge text-label-badge text-[#3bf589] uppercase tracking-wider">
                {remainingDays} DÍAS RESTANTES
              </span>
            </div>
          </div>

          <div className="mt-space-xs rounded-lg bg-surface-container-lowest p-space-sm relative overflow-hidden border border-surface-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary-container shadow-[0_0_14px_rgba(255,82,93,0.35)]">
                  <span className="material-symbols-outlined text-[24px]">local_fire_department</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-badge text-label-badge text-primary-container uppercase tracking-widest">
                      {fidelityName} / {fidelityMonths} MESES
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                    Siguiente rango:{' '}
                    <span className="text-secondary uppercase font-bold">
                      {memberData?.fidelity?.nextLevel || 'APEX'}
                    </span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-headline-md text-headline-md text-primary">{progressPercent}%</span>
              </div>
            </div>

            <div className="w-full bg-surface-container-highest rounded-full h-2 mt-3 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-primary-container to-secondary-container rounded-full shadow-[0_0_8px_rgba(52,255,140,0.5)] transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-data-mono text-outline mt-2 pt-1 border-t-0">
              <span className="text-on-surface-variant">Novato</span>
              <span className="text-on-surface-variant">Principiante</span>
              <span className="text-on-surface-variant">Promedio</span>
              <span className="text-primary-container font-bold">Mutando</span>
              <span className="text-secondary font-bold">Mamado/a</span>
              <span>Animal</span>
            </div>
          </div>
        </div>

        {/* BOTÓN ROJO CARMESÍ: LLAMAR COACH */}
        <div className="w-full relative">
          <button
            type="button"
            onClick={() => setShowCoachModal(true)}
            className="group relative w-full h-16 rounded-xl bg-primary-container text-on-primary-fixed font-headline-md text-headline-md tracking-wider uppercase flex items-center justify-center gap-space-sm shadow-[0_0_24px_rgba(31,113,239,0.4)] active:scale-[0.98] transition-transform duration-150 overflow-hidden cursor-pointer"
          >
            <span className="w-3 h-3 rounded-full bg-on-primary-fixed animate-ping"></span>
            <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              emergency_home
            </span>
            <span>🚨 LLAMAR A COACH EN SALA</span>
          </button>
        </div>

        {/* RUTINA DEL DÍA */}
        <div className="rounded-xl bg-surface-container-low p-space-md shadow-lg relative overflow-hidden border border-surface-container">
          <div className="flex items-center justify-between mb-space-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary-container"></span>
              <span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">
                Plan de Asalto Diario
              </span>
            </div>
            <span className="font-data-mono text-[12px] text-primary px-2 py-0.5 rounded bg-primary-container/10">
              DÍA 3 / SEMANA
            </span>
          </div>

          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-wide uppercase leading-none">
              {memberData?.membership?.rutina_asignada || 'FUERZA & EMPUJE PUSH DAY'}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Pecho, Deltoides Anterior y Tríceps • 5 Ejercicios de Carga Progresiva
            </p>
            <div className="flex items-center gap-space-md mt-2 text-outline font-data-mono text-body-sm">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">timer</span> 55 MIN
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">fitness_center</span> 18 SERIES TOT.
              </span>
            </div>
          </div>
        </div>

        {/* PROMOS Y BENEFICIOS SOCIO */}
        <div className="flex flex-col space-y-space-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-badge text-label-badge text-on-surface uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px] text-primary">bolt</span> BENEFICIOS SOCIO
            </span>
            <span className="font-data-mono text-[11px] text-outline">DESLIZA PARA VER &gt;</span>
          </div>

          <div className="flex overflow-x-auto space-x-space-sm pb-2 pt-1 no-scrollbar">
            <div className="flex-shrink-0 w-[84%] max-w-[320px] rounded-xl bg-surface-container p-space-md shadow-md flex flex-col justify-between border border-surface-container-high">
              <div>
                <span className="font-data-mono text-[11px] text-primary uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-primary-container/20">
                  30% OFF SUPLEMENTOS
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface uppercase mt-2 leading-tight">
                  NUTRICIÓN TÁCTICA
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Descuento exclusivo en creatina monohidratada y proteínas aisladas en recepción.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL PARA ASISTENCIA DE COACH */}
      {showCoachModal && (
        <div className="fixed inset-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-surface-container-low p-space-md space-y-space-md shadow-2xl relative border border-surface-container">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[28px]">notification_important</span>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface uppercase leading-tight">
                    SOLICITAR COACH EN SALA
                  </h3>
                  <p className="font-body-sm text-body-sm text-outline">
                    Un preparador físico se acercará a asistirte de inmediato
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCoachModal(false)}
                className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-space-xs">
              <label className="font-label-badge text-label-badge text-on-surface-variant uppercase tracking-wider block">
                Selecciona máquina / estación:
              </label>
              <div className="grid grid-cols-2 gap-2 text-left">
                {[
                  'Máquina #15 - Pec-Deck',
                  'Máquina #04 - Prensa 45°',
                  'Máquina #12 - Polea Alta',
                  'Rack Sentadilla #02',
                ].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMachine(m)}
                    className={`px-3 py-2.5 rounded-lg text-body-sm font-data-mono flex items-center justify-between cursor-pointer ${
                      selectedMachine === m
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-highest'
                    }`}
                  >
                    <span className="truncate">{m}</span>
                    <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-space-xs">
              <label className="font-label-badge text-label-badge text-on-surface-variant uppercase tracking-wider block">
                Motivo de la asistencia
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Spot / Cuidado', 'Corregir Postura', 'Duda de Rutina'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`py-2 px-1 rounded-lg text-center font-label-badge text-[12px] uppercase font-bold cursor-pointer ${
                      selectedReason === r
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container text-outline hover:text-on-surface'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={sendingAlert}
              onClick={handleSendCoachAlert}
              className="w-full h-14 rounded-xl bg-primary-container text-on-primary-fixed font-headline-md text-headline-md tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(31,113,239,0.35)] active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">campaign</span>
              <span>{sendingAlert ? 'ENVIANDO SEÑAL A RECEPCIÓN...' : 'NOTIFICAR AYUDA • ENVIAR ALERTA EN SALA'}</span>
            </button>

            {alertSent && (
              <div className="rounded-xl bg-secondary-container/20 p-space-md text-center border border-primary/40">
                <div className="flex items-center justify-center text-primary mb-1">
                  <span className="material-symbols-outlined text-[32px] animate-bounce">check_circle</span>
                </div>
                <h4 className="font-headline-md text-headline-md text-primary uppercase">
                  ¡ALERTA RECIBIDA POR RECEPCIÓN!
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface mt-1">
                  Un coach de piso se está desplazando hacia tu estación en este instante. No abandones tu máquina.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-surface-container">
        <div className="grid grid-cols-4 items-center h-16 px-space-xs">
          <button className="flex flex-col items-center justify-center gap-space-xs h-full text-primary-container">
            <span className="material-symbols-outlined text-[24px]">speed</span>
            <span className="font-label-badge text-label-badge uppercase text-[11px]">Inicio</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-space-xs h-full text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[24px]">fitness_center</span>
            <span className="font-label-badge text-label-badge uppercase text-[11px]">Mi Rutina</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-space-xs h-full text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[24px]">add_box</span>
            <span className="font-label-badge text-label-badge uppercase text-[11px]">Crear</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-space-xs h-full text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            <span className="font-label-badge text-label-badge uppercase text-[11px]">IA Coach</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

