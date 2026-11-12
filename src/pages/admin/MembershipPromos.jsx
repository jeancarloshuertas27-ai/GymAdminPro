import React, { useState, useEffect } from 'react';
import PromoForm from '../../components/admin/PromoForm';
import PromoGrid from '../../components/admin/PromoGrid';
import MembershipLookup from '../../components/reception/MembershipLookup';
import AddTimeModal from '../../components/modals/AddTimeModal';

export default function MembershipPromos() {
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPromociones = async () => {
    try {
      const res = await fetch('/api/promociones');
      const data = await res.json();
      setPromociones(data);
    } catch (err) {
      console.error('Error al cargar promociones:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const token = localStorage.getItem('gymcore_token') || localStorage.getItem('token');
      const res = await fetch('/api/aprobaciones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const total = (data.membresias_pendientes?.length || 0) + (data.ventas_pendientes?.length || 0);
        setPendingCount(total);
      }
    } catch (err) {
      // Ignorar si aún no hay aprobaciones
    }
  };

  useEffect(() => {
    fetchPromociones();
    fetchPendingApprovals();
  }, []);

  const handleArchivePromo = async (id) => {
    if (!window.confirm('¿Está seguro de archivar esta tarifa? No estará disponible para nuevas asignaciones.')) {
      return;
    }
    try {
      const token = localStorage.getItem('gymcore_token') || localStorage.getItem('token');
      const res = await fetch(`/api/promociones/${id}/archivar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPromociones();
      }
    } catch (err) {
      console.error('Error al archivar:', err);
    }
  };

  const handleOpenModal = (athlete) => {
    setSelectedAthlete(athlete);
    setIsModalOpen(true);
  };

  const handleAssignmentSuccess = (data) => {
    setSuccessToast(data.message || 'Membresía asignada exitosamente.');
    setTimeout(() => setSuccessToast(null), 5000);
    fetchPendingApprovals();
  };

  return (
    <div className="w-full min-h-screen px-gutter pb-space-xl pt-4">
      {/* Subheader Operacional */}
      <div className="relative w-full mb-space-lg flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-space-xs">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm">
            <span className="font-data-mono text-data-mono text-primary uppercase tracking-widest">
              // COMANDO DE MEMBRESÍAS & PLANES
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
            <span className="bg-surface-container-high px-space-xs py-0.5 rounded font-data-mono text-[11px] text-on-surface-variant uppercase">
              MODULO_M03
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight flex items-center gap-space-sm">
            GESTIÓN DE PLANES <span className="text-primary-container">&</span> ASIGNACIÓN TÁCTICA
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
            Configura tarifas maestras, emite pases de mutación de alto rendimiento e imputa vigencias operativas con validación inmediata o conciliación por bóveda de transferencias.
          </p>
        </div>

        {/* Telemetría rápida */}
        <div className="flex items-center gap-space-sm bg-surface-container-low p-space-xs rounded-xl shadow-inner border border-outline-variant/30">
          <div className="px-space-md py-space-xs bg-surface-container rounded-lg flex flex-col">
            <span className="font-data-mono text-[11px] text-on-surface-variant uppercase">PLANES_ACTIVOS</span>
            <span className="font-headline-md text-headline-md text-on-surface leading-none">
              {promociones.length} <span className="text-primary text-[14px]">TARIFAS</span>
            </span>
          </div>
          <div className="px-space-md py-space-xs bg-surface-container rounded-lg flex flex-col">
            <span className="font-data-mono text-[11px] text-on-surface-variant uppercase">CONCILIACIONES_PEND</span>
            <span className="font-headline-md text-headline-md text-tertiary leading-none">
              {pendingCount} <span className="text-[14px] text-outline">DOCS</span>
            </span>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="mb-4 p-4 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-between font-headline-md text-body-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">verified</span>
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="hover:opacity-80">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Grid Dual: Sección A (Formulario & Catálogo) + Sección B (Manejar Membresías) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Columna Izquierda (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          <PromoForm onPromoCreated={fetchPromociones} />
          <PromoGrid promociones={promociones} onArchivePromo={handleArchivePromo} />
        </div>

        {/* Columna Derecha (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          <MembershipLookup onOpenAddTimeModal={handleOpenModal} />
        </div>
      </div>

      {/* Modal de Asignación de Tiempo */}
      {isModalOpen && selectedAthlete && (
        <AddTimeModal
          athleteData={selectedAthlete}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  );
}

