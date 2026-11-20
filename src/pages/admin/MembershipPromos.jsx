import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import PromoForm from '../../components/admin/PromoForm';
import PromoGrid from '../../components/admin/PromoGrid';
import MembershipLookup from '../../components/reception/MembershipLookup';
import AddTimeModal from '../../components/modals/AddTimeModal';

export default function MembershipPromos() {
  const { authFetch } = useAuth();
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPromociones = useCallback(async () => {
    try {
      const res = await authFetch('/api/promociones');
      if (res.ok) {
        const data = await res.json();
        setPromociones(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error al cargar promociones:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const fetchPendingApprovals = useCallback(async () => {
    try {
      const res = await authFetch('/api/aprobaciones');
      if (res.ok) {
        const data = await res.json();
        const total = (data.membresias_pendientes?.length || 0) + (data.ventas_pendientes?.length || 0);
        setPendingCount(total);
      }
    } catch {
      // Ignorar si aún no hay aprobaciones
    }
  }, [authFetch]);

  useEffect(() => {
    fetchPromociones();
    fetchPendingApprovals();
  }, [fetchPromociones, fetchPendingApprovals]);

  const handleTogglePromo = async (promo) => {
    const nextState = promo.activo === 1 ? 0 : 1;
    try {
      const res = await authFetch(`/api/promociones/${promo.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nextState }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(data.message);
        setTimeout(() => setSuccessToast(null), 4000);
        fetchPromociones();
      }
    } catch (err) {
      console.error('Error al cambiar estado de promoción:', err);
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

  const activeCount = promociones.filter((p) => p.activo === 1).length;

  return (
    <div className="w-full min-h-screen px-gutter pb-space-xl pt-4">
      {/* Subheader Operacional */}
      <div className="relative w-full mb-space-lg flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-space-xs">
        <div className="flex flex-col gap-space-xs">
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight flex items-center gap-space-sm">
            GESTIÓN DE PLANES Y MEMBRESÍAS
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
            Configura tarifas y promociones, activa o desactiva ofertas en el catálogo y gestiona vigencias de socios.
          </p>
        </div>

        <div className="flex items-center gap-space-sm bg-surface-container-low p-space-xs rounded-xl shadow-inner border border-outline-variant/30">
          <div className="px-space-md py-space-xs bg-surface-container rounded-lg flex flex-col">
            <span className="font-data-mono text-[11px] text-on-surface-variant uppercase">PROMOS ACTIVAS</span>
            <span className="font-headline-md text-headline-md text-on-surface leading-none">
              {activeCount} <span className="text-emerald-400 text-[14px]">/ {promociones.length} TOTAL</span>
            </span>
          </div>
          <div className="px-space-md py-space-xs bg-surface-container rounded-lg flex flex-col">
            <span className="font-data-mono text-[11px] text-on-surface-variant uppercase">POR APROBAR</span>
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
          <button onClick={() => setSuccessToast(null)} className="hover:opacity-80 cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Grid Dual: Sección A (Formulario & Catálogo) + Sección B (Manejar Membresías) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Columna Izquierda (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          <PromoForm onPromoCreated={fetchPromociones} />
          <PromoGrid promociones={promociones} onTogglePromo={handleTogglePromo} loading={loading} />
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
