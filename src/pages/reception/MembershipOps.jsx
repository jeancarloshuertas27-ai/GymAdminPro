import React, { useState } from 'react';
import MembershipLookup from '../../components/reception/MembershipLookup';
import AddTimeModal from '../../components/modals/AddTimeModal';

export default function MembershipOps() {
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const handleOpenModal = (athlete) => {
    setSelectedAthlete(athlete);
    setIsModalOpen(true);
  };

  const handleSuccess = (data) => {
    setToastMsg(data.message || 'Operación registrada correctamente.');
    setTimeout(() => setToastMsg(null), 5000);
  };

  return (
    <div className="w-full min-h-screen px-gutter pb-space-xl pt-4 max-w-4xl mx-auto">
      <div className="flex flex-col gap-space-xs mb-space-lg">
        <div className="flex items-center gap-space-sm">
          <span className="font-data-mono text-data-mono text-primary uppercase tracking-widest">
            // TERMINAL RECEPCIÓN // MÓDULO MEMBRESÍAS
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
          GESTIÓN Y RENOVACIÓN DE MEMBRESÍAS
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Digita el DNI del atleta para consultar su estado de cuenta y registrar pagos en efectivo o transferencias con comprobante obligatorio.
        </p>
      </div>

      {toastMsg && (
        <div className="mb-4 p-4 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-between font-headline-md text-body-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">verified</span>
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="hover:opacity-80">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      <MembershipLookup onOpenAddTimeModal={handleOpenModal} />

      {isModalOpen && selectedAthlete && (
        <AddTimeModal
          athleteData={selectedAthlete}
          origen="RECEPCION"
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

