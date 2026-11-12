import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ReceptionForm from '../../components/admin/ReceptionForm';
import MemberForm from '../../components/admin/MemberForm';

export default function AddUser({ onNavigate }) {
  const { isAdmin } = useAuth();
  const [activeType, setActiveType] = useState('member'); // default to member
  const [toast, setToast] = useState(null);

  const handleSuccess = (data) => {
    setToast({
      title: 'USUARIO REGISTRADO',
      message: data.message || 'Credenciales y membresía activadas en el nodo central.',
    });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  return (
    <div className="flex flex-col w-full pb-space-xl p-space-lg">
      {/* Header */}
      <div className="flex flex-col mb-space-lg pb-space-sm border-b border-outline-variant/30">
        <h1 className="font-headline-lg text-headline-lg uppercase tracking-wider text-on-surface m-0">
          AGREGAR USUARIO NUEVO
        </h1>
        <p className="font-body-md text-on-surface-variant max-w-2xl mt-1">
          Aprovisionamiento operacional según categoría de usuario.
        </p>
      </div>

      {/* TOP TAB SELECTOR: TIPO: RECEPCIÓN vs TIPO: MIEMBRO */}
      {isAdmin ? (
        <div className="bg-surface-container-low p-2 rounded mb-space-lg shadow-xl border border-outline-variant/30 flex flex-col sm:flex-row gap-2 relative">
          <button
            type="button"
            onClick={() => setActiveType('reception')}
            className={`flex-1 py-3 px-space-lg rounded flex items-center justify-center gap-space-sm transition-all duration-200 cursor-pointer ${
              activeType === 'reception'
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_18px_rgba(31,113,239,0.35)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">badge</span>
            <div className="flex flex-col text-left">
              <span className="font-headline-md text-headline-md tracking-wider uppercase leading-none">
                TIPO: RECEPCIÓN
              </span>
              <span className="font-data-mono text-[11px] opacity-75 uppercase leading-tight">
                Terminal Caja • Control de Aforo • Staff Gym
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('member')}
            className={`flex-1 py-3 px-space-lg rounded flex items-center justify-center gap-space-sm transition-all duration-200 cursor-pointer ${
              activeType === 'member'
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_18px_rgba(31,113,239,0.35)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              fitness_center
            </span>
            <div className="flex flex-col text-left">
              <span className="font-headline-md text-headline-md tracking-wider uppercase leading-none">
                TIPO: MIEMBRO
              </span>
              <span className="font-data-mono text-[11px] opacity-90 uppercase leading-tight">
                Atleta • Membresía • Rutina • App Móvil
              </span>
            </div>
          </button>
        </div>
      ) : (
        <div className="bg-surface-container-low p-3 rounded mb-space-lg shadow border border-outline-variant/30 flex items-center gap-2 text-primary font-headline-md uppercase text-base">
          <span className="material-symbols-outlined">fitness_center</span>
          <span>REGISTRO DE NUEVO ATLETA // ACCESO EXCLUSIVO RECEPCIÓN</span>
        </div>
      )}

      {/* FORMS */}
      {isAdmin && activeType === 'reception' ? (
        <ReceptionForm onSuccess={handleSuccess} />
      ) : (
        <MemberForm onSuccess={handleSuccess} />
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 max-w-md bg-surface-container-highest p-space-md rounded shadow-2xl flex items-center gap-space-sm z-50 border border-primary animate-bounce">
          <span className="material-symbols-outlined text-primary text-[28px]">verified</span>
          <div className="flex flex-col">
            <span className="font-headline-md text-[16px] uppercase text-on-surface leading-tight">
              {toast.title}
            </span>
            <span className="font-body-sm text-[12px] text-on-surface-variant">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

