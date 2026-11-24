import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Numpad from '../../components/checkin/Numpad';
import SemaphoreCard from '../../components/checkin/SemaphoreCard';
import LiveFeed from '../../components/checkin/LiveFeed';
import TacIdModal from '../../components/modals/TacIdModal';

export default function CheckIn({ onNavigate }) {
  const { authFetch } = useAuth();
  const [dni, setDni] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);
  const [recentFeed, setRecentFeed] = useState([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);

  // Cargar feed reciente al montar
  const fetchRecent = async () => {
    try {
      const res = await authFetch('/api/checkin/recent');
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
      const res = await authFetch('/api/checkin', {
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

      {/* CONTENEDOR CENTRAL: ENTRADA / SEMÁFORO TÁCTICO / FEED EN VIVO */}
      <div className="grid grid-cols-12 gap-space-lg items-start">
        {/* COLUMNA IZQUIERDA: INPUT TÁCTIL + TECLADO */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-space-md">
          <Numpad
            dni={dni}
            onDniChange={setDni}
            onSubmit={handleValidate}
            onClear={() => setDni('')}
            onBackspace={() => setDni(dni.slice(0, -1))}
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
