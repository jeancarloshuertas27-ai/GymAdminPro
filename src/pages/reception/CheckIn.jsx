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

    } catch (err) {
      alert('Error al validar check-in.');
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
          id: 5,
          nombreCompleto: 'DIEGO GUZMÁN PRADO',
          dni: '72849102',
          fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          nivelFidelidad: 'MUTANDO',
          planTag: 'PLAN ANUAL TITANIUM',
          tiempoRestante: '1 MES Y 18 DÍAS RESTANTES (48 DÍAS)',
          rutinaAsignada: 'HIPERTROFIA & FUERZA - PUSH DAY',
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
          id: 4,
          nombreCompleto: 'CARLA BENAVIDES CASTRO',
          dni: '70918234',
          fotoUrl: null,
          nivelFidelidad: 'PRINCIPIANTE',
          planTag: 'MEMBRESÍA MENSUAL',
          tiempoRestante: 'FALTAN 8 DÍAS',
          rutinaAsignada: 'Torso-Pierna Intenso 4 Días',
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
          id: 6,
          nombreCompleto: 'ANDRÉS MEJÍA LOYOLA',
          dni: '71220944',
          fotoUrl: null,
          nivelFidelidad: 'NOVATO',
          planTag: 'PLAN MENSUAL BÁSICO',
          tiempoRestante: 'VENCIDO HACE 45 DÍAS',
          rutinaAsignada: 'FULLBODY BÁSICO',
        },
      });
    }
  };

  return (
    <div className="p-space-lg flex flex-col gap-space-lg w-full">
      {/* HEADER DE CONTROL DE ACCESO */}
      <div className="flex flex-col gap-1 pb-space-sm border-b border-outline-variant/30">
        <h1 className="font-headline-lg text-headline-lg uppercase text-on-surface tracking-wide">
          CONTROL DE ACCESO & CHECK-IN EN SALA
        </h1>
        <span className="font-body-sm text-body-sm text-outline">
          Valida el ingreso de atletas digitando su DNI en el teclado táctico o lector de mostrador.
        </span>
      </div>

      {/* BANNER CRÍTICO DE ALERTA EN SALA */}
      {!alertDismissed && (
        <div className="w-full bg-tertiary-container text-on-tertiary-container p-space-md rounded-DEFAULT flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-[0_0_24px_rgba(199,83,2,0.45)]">
          <div className="flex items-start md:items-center gap-space-md">
            <div className="w-12 h-12 bg-on-tertiary-container/20 rounded-DEFAULT flex items-center justify-center shrink-0 animate-bounce">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <div>
              <span className="font-headline-md text-headline-md uppercase block">
                ATLETA REPORTA ASISTENCIA URGENTE EN MÁQUINA #15
              </span>
              <span className="font-body-sm text-body-sm opacity-90 block">
                Spotting / ayuda técnica requerida de inmediato en sala de máquinas.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs w-full md:w-auto">
            <button
              type="button"
              onClick={() => alert('Entrenador de piso notificado vía radio.')}
              className="flex-1 md:flex-none px-space-md py-2.5 bg-on-tertiary-container text-tertiary-container font-label-badge text-label-badge uppercase tracking-wider rounded-DEFAULT flex items-center justify-center gap-space-xs transition-all active:scale-95 shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">directions_run</span>
              <span>DESPACHAR COACH</span>
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
