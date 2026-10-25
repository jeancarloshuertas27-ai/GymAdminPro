import React, { useState, useEffect } from 'react';
import Numpad from '../../components/checkin/Numpad';
import SemaphoreCard from '../../components/checkin/SemaphoreCard';
import LiveFeed from '../../components/checkin/LiveFeed';
import TacIdModal from '../../components/modals/TacIdModal';

export default function CheckIn({ onNavigate }) {
  const [dni, setDni] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);
  const [recentFeed, setRecentFeed] = useState([]);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);
  const [turnstileReady, setTurnstileReady] = useState(true);

  // Cargar feed reciente al montar
  const fetchRecent = async () => {
    try {
      const res = await fetch('/api/checkin/recent');
      if (res.ok) {
        const data = await res.json();
        setRecentFeed(data);
      }
    } catch (e) {
      console.error('Error fetching recent checkins:', e);
    }
  };

  useEffect(() => {
    fetchRecent();
    const timer = setInterval(fetchRecent, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleValidate = async () => {
    if (dni.length !== 8) {
      alert('Por favor digite un DNI completo de 8 dígitos.');
      return;
    }

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni }),
      });

      const data = await res.json();
      setCheckinResult(data);
      fetchRecent();

      // Pulso visual del torniquete si concedió acceso
      if (data.grantAccess) {
        setTurnstileReady(false);
        setTimeout(() => setTurnstileReady(true), 2000);
      }
    } catch (err) {
      alert('Error en conexión con el torniquete.');
    }
  };

  const handleSimulate = (state) => {
    if (state === 'VERDE') {
      setCheckinResult({
        resultado: 'VERDE_AUTORIZADO',
        titulo: 'ACCESO AUTORIZADO',
        kicker: 'RESPUESTA RELÉ // PASO CONCEDIDO',
        authCode: '#AUTH-89102',
        grantAccess: true,
        atleta: {
          id: 1,
          nombreCompleto: 'MATEO VALDIVIA ROCA',
          dni: '72849102',
          fotoUrl: null,
          nivelFidelidad: 'MUTANDO',
          planTag: 'VIP ANUAL',
          tiempoRestante: '48 DÍAS RESTANTES (VENCE: 28/05/2026)',
          rutinaAsignada: 'FUERZA & EMPUJE PUSH DAY',
        },
      });
    } else if (state === 'NARANJA') {
      setCheckinResult({
        resultado: 'NARANJA_AVISO',
        titulo: 'ACCESO CONCEDIDO (AVISO DE PAGO)',
        kicker: 'RESPUESTA RELÉ // PASO CONCEDIDO',
        authCode: '#AUTH-70918',
        grantAccess: true,
        warningMessage: 'Faltan 8 días para el vencimiento de su membresía.',
        atleta: {
          id: 2,
          nombreCompleto: 'CARLA BENAVIDES CASTRO',
          dni: '70918234',
          fotoUrl: null,
          nivelFidelidad: 'EN PROGRESO',
          planTag: 'MEMBRESÍA MENSUAL',
          tiempoRestante: 'FALTAN 8 DÍAS',
          rutinaAsignada: 'Torso / Pierna Pro (4 días)',
        },
      });
    } else if (state === 'ROJO') {
      setCheckinResult({
        resultado: 'ROJO_DENEGADO',
        titulo: 'ACCESO DENEGADO',
        kicker: 'RESPUESTA RELÉ // PASO BLOQUEADO',
        authCode: '#AUTH-71220',
        grantAccess: false,
        motivo: 'Membresía caducada hace 45 días. Se requiere renovación.',
        atleta: {
          id: 4,
          nombreCompleto: 'ANDRÉS MEJÍA LOYOLA',
          dni: '71220944',
          fotoUrl: null,
          nivelFidelidad: 'NOVATO',
          planTag: 'PLAN VENCIDO',
          tiempoRestante: 'VENCIDO HACE 45 DÍAS',
          rutinaAsignada: 'Sin rutina activa',
        },
      });
    }
  };

  const handleManualPulse = () => {
    setTurnstileReady(false);
    setTimeout(() => setTurnstileReady(true), 2500);
    alert('Relé de torniquete activado manualmente. Paso concedido temporalmente.');
  };

  const handleForceOpen = async () => {
    try {
      const activeDni = dni || checkinResult?.atleta?.dni || '72849102';
      await fetch('/api/checkin/force', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: activeDni, motivo: 'Apertura forzada por operador en recepción' }),
      });
      handleManualPulse();
      fetchRecent();
    } catch {
      handleManualPulse();
    }
  };

  return (
    <div className="p-space-lg flex flex-col gap-space-lg w-full">
      {/* BARRA TÁCTICA SUPERIOR / AFORO & TELEMETRÍA */}
      <div className="grid grid-cols-12 gap-space-md items-stretch">
        <div className="col-span-12 lg:col-span-7 bg-surface-container-low p-space-md rounded-DEFAULT flex flex-col justify-between shadow-md relative overflow-hidden border border-surface-container">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-primary-container/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <span className="w-3 h-3 bg-primary-container rounded-full animate-ping"></span>
              <span className="font-data-mono text-data-mono text-primary uppercase">
                TELEMETRÍA DE SALA 01 // V1.08
              </span>
            </div>
            <span className="font-data-mono text-data-mono text-on-surface-variant text-[12px] bg-surface-container-high px-space-sm py-0.5 rounded-DEFAULT">
              RELÉ: 12V DC ONLINE
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-space-md gap-y-space-xs my-space-sm">
            <span className="font-headline-lg text-headline-lg uppercase text-on-surface tracking-wide">
              CONTROL DE ACCESO & CHECK-IN EN SALA
            </span>
            <span className="font-label-badge text-label-badge text-primary uppercase tracking-widest bg-surface-container px-space-sm py-1 rounded-DEFAULT">
              PUESTO FRONTAL
            </span>
          </div>

          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
              <span className="font-data-mono text-data-mono text-on-surface text-[13px]">
                CICLO DE ENTRADA: 1.2s
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[20px]">sensors</span>
              <span className="font-data-mono text-data-mono text-on-surface text-[13px]">
                LECTOR ÓPTICO: ACTIVO
              </span>
            </div>
          </div>
        </div>

        {/* METRICA AFORO EN VIVO */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-low p-space-md rounded-DEFAULT flex flex-col justify-between shadow-md border border-surface-container">
          <div className="flex justify-between items-start">
            <span className="font-data-mono text-data-mono text-on-surface-variant uppercase text-[12px]">
              AFORO SALA CENTRAL
            </span>
            <span className="font-label-badge text-label-badge uppercase text-primary bg-surface-container px-1.5 py-0.5 rounded-DEFAULT">
              49% OCUPADO
            </span>
          </div>
          <div className="my-space-xs flex items-baseline gap-space-xs">
            <span className="font-metric-huge text-metric-huge text-on-surface leading-none">42</span>
            <span className="font-headline-md text-headline-md text-on-surface-variant uppercase">/ 85</span>
          </div>
          <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary-container h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(31,113,239,0.8)]"
              style={{ width: '49.4%' }}
            ></div>
          </div>
        </div>

        {/* ESTADO DEL RELÉ TORNIQUETE */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-2 bg-surface-container-low p-space-md rounded-DEFAULT flex flex-col justify-between shadow-md border border-surface-container">
          <span className="font-data-mono text-data-mono text-on-surface-variant uppercase text-[12px]">
            TORNIQUETE RELÉ #01
          </span>
          <div className="flex flex-col my-space-xs">
            <div className="flex items-center gap-space-xs">
              <span
                className={`w-3 h-3 rounded-full ${
                  turnstileReady
                    ? 'bg-primary-container shadow-[0_0_10px_rgba(31,113,239,0.9)] animate-pulse'
                    : 'bg-[#3bf589] shadow-[0_0_10px_#3bf589]'
                }`}
              ></span>
              <span className="font-headline-md text-headline-md uppercase text-on-surface tracking-wider">
                {turnstileReady ? 'LISTO' : 'ABIERTO'}
              </span>
            </div>
            <span className="font-data-mono text-data-mono text-on-surface-variant text-[11px]">
              {turnstileReady ? 'SOLENOIDE RETRAÍDO' : 'PASO HABILITADO'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleManualPulse}
            className="w-full py-2 bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-on-surface rounded-DEFAULT font-label-badge text-label-badge uppercase tracking-wider flex items-center justify-center gap-space-xs transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            <span>PULSO MANUAL</span>
          </button>
        </div>
      </div>

      {/* BANNER CRÍTICO DE ALERTA EN SALA */}
      {!alertDismissed && (
        <div className="w-full bg-tertiary-container text-on-tertiary-container p-space-md rounded-DEFAULT flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-[0_0_24px_rgba(199,83,2,0.45)]">
          <div className="flex items-start md:items-center gap-space-md">
            <div className="w-12 h-12 bg-on-tertiary-container/20 rounded-DEFAULT flex items-center justify-center shrink-0 animate-bounce">
              <span className="material-symbols-outlined text-on-tertiary-container text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                emergency
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="font-label-badge text-label-badge uppercase tracking-widest bg-on-tertiary-container/30 px-2 py-0.5 rounded-DEFAULT">
                  PRIORIDAD ALTA // ASISTENCIA
                </span>
                <span className="font-data-mono text-data-mono text-on-tertiary-container text-[12px]">
                  HACE 42 SEG • SALA DE PESO LIBRE
                </span>
              </div>
              <span className="font-headline-md text-headline-md uppercase tracking-wide leading-tight mt-0.5">
                ¡ALERTA EN SALA! ASISTENCIA REQUERIDA EN MÁQUINA #15 (PEC-DECK)
              </span>
              <p className="font-body-sm text-body-sm text-on-tertiary-container/90">
                Disparado por atleta <strong className="uppercase font-bold">Mateo Valdivia Roca</strong> (DNI: 72849102) mediante GymCore Mobile App.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => alert('Mensaje transmitido a los coaches en piso mediante walkie-talkie / app.')}
              className="flex-1 md:flex-none px-space-md py-2.5 bg-on-tertiary-container text-tertiary-container hover:bg-surface-container-lowest hover:text-on-surface font-headline-md text-headline-md uppercase tracking-wider rounded-DEFAULT shadow-md flex items-center justify-center gap-space-xs transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">campaign</span>
              <span>AVISAR AL COACH EN SALA</span>
            </button>
            <button
              type="button"
              onClick={() => setAlertDismissed(true)}
              className="flex-1 md:flex-none px-space-md py-2.5 bg-on-tertiary-container/20 hover:bg-on-tertiary-container/30 text-on-tertiary-container font-label-badge text-label-badge uppercase tracking-wider rounded-DEFAULT flex items-center justify-center gap-space-xs transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>DESMARCAR ALERTA</span>
            </button>
          </div>
        </div>
      )}

      {/* CONTENEDOR CENTRAL: ENTRADA / SEMÁFORO TÁCTICO / FEED EN VIVO */}
      <div className="grid grid-cols-12 gap-space-lg items-start">
        {/* COLUMNA IZQUIERDA: INPUT TÁCTIL + TECLADO + SWITCH DE SIMULACIÓN */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-space-md">
          <Numpad
            dni={dni}
            onDniChange={setDni}
            onSubmit={handleValidate}
            onClear={() => setDni('')}
            onBackspace={() => setDni(dni.slice(0, -1))}
            onSimulate={handleSimulate}
          />
        </div>

        {/* COLUMNA CENTRAL: MÓDULO DE VALIDACIÓN SEMÁFORO & FICHA DEL ATLETA */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-space-md">
          <SemaphoreCard
            checkinData={checkinResult}
            onForceOpen={handleForceOpen}
            onViewDetail={(id) => setSelectedAthleteId(id)}
          />
        </div>

        {/* COLUMNA DERECHA: ÚLTIMOS INGRESOS EN VIVO */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-space-md">
          <LiveFeed items={recentFeed} />
        </div>
      </div>

      {/* MODAL DETALLE DE ATLETA ("VER EXPEDIENTE") */}
      {selectedAthleteId && (
        <TacIdModal
          athleteId={selectedAthleteId}
          onClose={() => setSelectedAthleteId(null)}
          onDeleteSuccess={() => {
            setSelectedAthleteId(null);
            fetchRecent();
          }}
        />
      )}
    </div>
  );
}
