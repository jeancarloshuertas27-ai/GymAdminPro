import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const TIER_ORDER = {
  'TODOS': 0,
  'NOVATO': 1,
  'PRINCIPIANTE': 2,
  'PROMEDIO': 3,
  'EN_PROGRESO': 4,
  'MUTANDO': 5,
  'MAMADO': 6,
  'DIOS_GRIEGO': 7,
  'ANIMAL': 8
};

function normalizeTier(tier) {
  if (!tier) return 'TODOS';
  const t = String(tier).toUpperCase().trim();
  if (t === 'TODOS') return 'TODOS';
  if (t.includes('DIOS')) return 'DIOS_GRIEGO';
  if (t.includes('ANIMAL')) return 'ANIMAL';
  if (t.includes('MAMAD')) return 'MAMADO';
  if (t.includes('MUTAN')) return 'MUTANDO';
  if (t.includes('PROGRESO')) return 'EN_PROGRESO';
  if (t.includes('PROMEDIO')) return 'PROMEDIO';
  if (t.includes('PRINCIPIANTE')) return 'PRINCIPIANTE';
  if (t.includes('NOVATO')) return 'NOVATO';
  return 'NOVATO';
}

function canMemberAccessPromo(userFidelityLevel, promoRequiredLevel) {
  if (!promoRequiredLevel || promoRequiredLevel === 'TODOS') return true;
  const normPromo = normalizeTier(promoRequiredLevel);
  if (normPromo === 'TODOS') return true;
  const normUser = normalizeTier(userFidelityLevel);
  const userRank = TIER_ORDER[normUser] !== undefined ? TIER_ORDER[normUser] : 1;
  const requiredRank = TIER_ORDER[normPromo] !== undefined ? TIER_ORDER[normPromo] : 0;
  return userRank >= requiredRank;
}

export default function AddTimeModal({ athleteData, origen, onClose, onSuccess }) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const [mode, setMode] = useState('promo'); // 'promo' | 'manual'
  const [promociones, setPromociones] = useState([]);
  const [selectedPromoId, setSelectedPromoId] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const [manualUnit, setManualUnit] = useState('MESES');
  const [manualCost, setManualCost] = useState('120.00');

  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [voucherFile, setVoucherFile] = useState(null);
  const [voucherPreview, setVoucherPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Cargar promociones activas filtrando por nivel de fidelidad del miembro seleccionado
  useEffect(() => {
    const nivelMiembro = athleteData?.usuario?.nivel_fidelidad
      || athleteData?.atleta?.nivelFidelidad
      || athleteData?.fidelidad?.nivel_actual
      || athleteData?.membresia_actual?.nivel_fidelidad
      || athleteData?.nivel_fidelidad
      || 'NOVATO';
    const token = localStorage.getItem('gymcore_token') || localStorage.getItem('token');
    const url = `/api/promociones?nivel_miembro=${encodeURIComponent(nivelMiembro)}`;
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const filtered = list.filter((p) => canMemberAccessPromo(nivelMiembro, p.publico_objetivo));
        setPromociones(filtered);
        if (filtered.length > 0) {
          setSelectedPromoId(filtered[0].id.toString());
        } else {
          setSelectedPromoId('');
        }
      })
      .catch((err) => console.error('Error cargando promociones:', err));
  }, [athleteData]);

  const handleVoucherChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVoucherFile(file);
      setVoucherPreview(URL.createObjectURL(file));
    }
  };

  // Calcular días e importe actuales
  const currentPromo = promociones.find((p) => p.id.toString() === selectedPromoId);
  const daysToAdd = mode === 'promo'
    ? currentPromo ? (currentPromo.duracion_unidad === 'MESES' ? (currentPromo.duracion_valor === 12 ? 365 : currentPromo.duracion_valor * 30) : currentPromo.duracion_valor) : 0
    : manualUnit === 'MESES' ? manualQty * 30 : manualQty;

  const totalCost = mode === 'promo'
    ? currentPromo ? currentPromo.precio : 0
    : parseFloat(manualCost || 0);

  const currentDays = athleteData?.membresia_actual?.dias_restantes || 0;
  const projectedDays = (currentDays > 0 ? currentDays : 0) + Number(daysToAdd || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (paymentMethod === 'TRANSFERENCIA' && !isAdmin && !voucherFile) {
      setErrorMsg('La subida de foto o comprobante bancario es obligatoria para transferencias en Recepción.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('usuario_id', athleteData.usuario.id.toString());
      formData.append('modo', mode === 'promo' ? 'PROMO' : 'MANUAL');
      if (mode === 'promo') {
        formData.append('promocion_id', selectedPromoId);
      } else {
        formData.append('cantidad_tiempo', manualQty.toString());
        formData.append('unidad_tiempo', manualUnit);
      }
      formData.append('monto', totalCost.toString());
      formData.append('metodo_pago', paymentMethod);
      formData.append('origen', origen || (isAdmin ? 'ADMIN' : 'RECEPCION'));

      if (voucherFile) {
        formData.append('comprobante', voucherFile);
      }

      const token = localStorage.getItem('gymcore_token') || localStorage.getItem('token');
      const res = await fetch('/api/membresias/asignar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la asignación');
      }

      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!athleteData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-2xl bg-surface-container-low border border-primary/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Accent top line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary-container via-surface-tint to-tertiary"></div>

        {/* Header Modal */}
        <div className="px-space-lg py-space-md bg-surface-container border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">more_time</span>
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wide">
                AGREGAR TIEMPO DE MEMBRESÍA
              </h2>
              <span className="font-data-mono text-[11px] text-primary uppercase">
                ATLETA: {athleteData.usuario.nombres} {athleteData.usuario.apellidos} (DNI: {athleteData.usuario.dni})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-space-lg py-space-md overflow-y-auto flex flex-col gap-space-md">
          {/* Target Athlete Banner */}
          <div className="p-space-sm bg-surface-container rounded-xl flex items-center justify-between border border-outline-variant/30">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">person_check</span>
              <div className="flex flex-col">
                <span className="font-headline-md text-[16px] text-on-surface uppercase">
                  {athleteData.usuario.nombres} {athleteData.usuario.apellidos}
                </span>
                <span className="font-data-mono text-[11px] text-on-surface-variant">
                  DNI: <span className="text-on-surface">{athleteData.usuario.dni}</span> • SALDO ACTUAL:{' '}
                  <strong className="text-primary">{athleteData.membresia_actual.dias_restantes} DÍAS</strong>
                </span>
              </div>
            </div>
            <span className="px-space-sm py-0.5 rounded bg-surface-container-highest text-primary font-data-mono text-[11px] uppercase">
              {athleteData.membresia_actual.estado}
            </span>
          </div>

          {/* Selector de Modalidad: Promoción Activa vs Manual */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-badge text-label-badge text-on-surface-variant uppercase flex justify-between items-center">
              <span>Modo de Adición de Tiempo</span>
              <span className="font-data-mono text-[10px] text-outline">ELIJA DESPLEGABLE O PERSONALIZADO</span>
            </label>
            <div className="grid grid-cols-2 gap-space-xs p-1 bg-surface-container rounded-xl">
              <button
                type="button"
                onClick={() => setMode('promo')}
                className={`py-2.5 px-space-sm rounded-lg font-label-badge text-label-badge uppercase tracking-wider transition-all ${
                  mode === 'promo'
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface font-semibold'
                }`}
              >
                Elegir Promoción Activa
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`py-2.5 px-space-sm rounded-lg font-label-badge text-label-badge uppercase tracking-wider transition-all ${
                  mode === 'manual'
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface font-semibold'
                }`}
              >
                Agregar Meses / Días
              </button>
            </div>
          </div>

          {/* Opción A: Desplegable de Promoción Activa */}
          {mode === 'promo' && (
            <div className="flex flex-col gap-space-xs">
              <label htmlFor="modalPlanSelector" className="font-label-badge text-label-badge text-on-surface-variant uppercase flex justify-between items-center">
                <span>Promociones Activas en Catálogo</span>
                <span className="font-data-mono text-[10px] text-primary">TARIFAS REGISTRADAS</span>
              </label>
              <div className="relative">
                <select
                  id="modalPlanSelector"
                  value={selectedPromoId}
                  onChange={(e) => setSelectedPromoId(e.target.value)}
                  className="w-full h-12 bg-surface-container px-space-md rounded text-on-surface font-body-md focus:outline-none focus:bg-surface-container-high transition-all cursor-pointer border border-outline-variant/40 appearance-none"
                >
                  {promociones.length === 0 ? (
                    <option value="" disabled>
                      No hay promociones disponibles para este nivel de fidelidad
                    </option>
                  ) : (
                    promociones.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} // S/ {parseFloat(p.precio).toFixed(2)} (+{p.duracion_valor} {p.duracion_unidad})
                      </option>
                    ))
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-space-md top-1/2 -translate-y-1/2 text-outline-variant text-[20px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          )}

          {/* Opción B: Carga Manual */}
          {mode === 'manual' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-badge text-label-badge text-on-surface-variant uppercase flex justify-between items-center">
                  <span>Cantidad de Tiempo</span>
                  <span className="font-data-mono text-[10px] text-outline">VALOR NUMÉRICO</span>
                </label>
                <div className="flex gap-space-xs">
                  <input
                    type="number"
                    min="1"
                    value={manualQty}
                    onChange={(e) => setManualQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-2/3 h-12 bg-surface-container px-space-md rounded text-on-surface font-data-mono text-[16px] focus:outline-none focus:bg-surface-container-high border border-outline-variant/40"
                  />
                  <select
                    value={manualUnit}
                    onChange={(e) => setManualUnit(e.target.value)}
                    className="w-1/3 h-12 bg-surface-container px-space-xs rounded text-primary font-label-badge text-label-badge uppercase focus:outline-none focus:bg-surface-container-high cursor-pointer border border-outline-variant/40"
                  >
                    <option value="MESES">Meses</option>
                    <option value="DIAS">Días</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-badge text-label-badge text-on-surface-variant uppercase flex justify-between items-center">
                  <span>Importe a Cobrar (S/)</span>
                  <span className="font-data-mono text-[10px] text-primary">MONTO EN CAJA</span>
                </label>
                <div className="relative">
                  <span className="absolute left-space-md top-1/2 -translate-y-1/2 font-data-mono text-primary font-bold">
                    S/
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={manualCost}
                    onChange={(e) => setManualCost(e.target.value)}
                    className="w-full h-12 bg-surface-container pl-10 pr-space-md rounded text-on-surface font-data-mono text-[16px] focus:outline-none focus:bg-surface-container-high border border-outline-variant/40"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Método de Pago */}
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-badge text-label-badge text-on-surface-variant uppercase flex items-center justify-between">
              <span>Método de Pago</span>
              <span className="font-data-mono text-[10px] text-tertiary">SELECCIÓN OBLIGATORIA</span>
            </span>
            <div className="grid grid-cols-2 gap-space-sm">
              <label
                onClick={() => setPaymentMethod('EFECTIVO')}
                className={`flex items-center justify-between p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high cursor-pointer border-2 transition-all ${
                  paymentMethod === 'EFECTIVO' ? 'border-primary-container' : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-md text-[16px] text-on-surface uppercase">Efectivo</span>
                    <span className="font-data-mono text-[10px] text-outline">APROBACIÓN INMEDIATA EN CAJA</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="modal_payment_method"
                  checked={paymentMethod === 'EFECTIVO'}
                  onChange={() => setPaymentMethod('EFECTIVO')}
                  className="accent-primary w-5 h-5 cursor-pointer"
                />
              </label>

              <label
                onClick={() => setPaymentMethod('TRANSFERENCIA')}
                className={`flex items-center justify-between p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high cursor-pointer border-2 transition-all ${
                  paymentMethod === 'TRANSFERENCIA' ? 'border-tertiary-container' : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[20px]">account_balance</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-md text-[16px] text-on-surface uppercase">Transferencia</span>
                    <span className="font-data-mono text-[10px] text-outline">REQUIERE COMPROBANTE</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="modal_payment_method"
                  checked={paymentMethod === 'TRANSFERENCIA'}
                  onChange={() => setPaymentMethod('TRANSFERENCIA')}
                  className="accent-primary w-5 h-5 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Aviso Efectivo vs Comprobante Transferencia */}
          {paymentMethod === 'EFECTIVO' ? (
            <div className="p-space-sm bg-surface-container rounded-lg flex items-center gap-space-sm border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary text-[22px]">verified</span>
              <div className="flex flex-col">
                <span className="font-label-badge text-[13px] uppercase text-on-surface">Validación Instantánea</span>
                <span className="font-data-mono text-[11px] text-on-surface-variant">
                  El pago se registra como liquidado en caja y el tiempo se suma de inmediato.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-space-xs p-space-md bg-surface-container rounded-xl border border-tertiary/40">
              <div className="flex items-center justify-between">
                <span className="font-label-badge text-label-badge text-tertiary uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">priority_high</span> Comprobante de Pago Digital
                </span>
                <span className="font-data-mono text-[10px] text-outline">
                  {isAdmin ? 'OPCIONAL PARA ADMIN' : 'OBLIGATORIO RECEPCIÓN'}
                </span>
              </div>
              <label
                htmlFor="modalVoucherFile"
                className="w-full h-24 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-dashed border-outline-variant/50 flex flex-col items-center justify-center cursor-pointer p-space-sm text-center transition-all"
              >
                <span className="material-symbols-outlined text-[24px] text-tertiary">upload_file</span>
                <span className="font-label-badge text-[12px] uppercase text-on-surface mt-1">
                  {voucherFile ? voucherFile.name : 'Subir Captura Yape / Plin / Voucher'}
                </span>
                <span className="font-data-mono text-[10px] text-outline">JPG, PNG o WEBP (Máx. 5MB)</span>
                <input
                  id="modalVoucherFile"
                  type="file"
                  accept="image/*"
                  onChange={handleVoucherChange}
                  className="hidden"
                />
              </label>
              {voucherPreview && (
                <div className="h-20 w-32 rounded overflow-hidden border border-primary mx-auto mt-1">
                  <img src={voucherPreview} alt="Comprobante" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {/* Resumen de Total y Proyección */}
          <div className="p-4 rounded-xl bg-surface-container flex items-center justify-between border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-data-mono text-[11px] text-outline uppercase">PROYECCIÓN SALDO TOTAL</span>
              <span className="font-headline-md text-headline-md text-on-surface">
                {projectedDays} DÍAS <span className="text-primary text-[14px]">(+{daysToAdd} DÍAS)</span>
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="font-data-mono text-[11px] text-outline uppercase">TOTAL A COBRAR</span>
              <span className="font-metric-huge text-headline-lg text-primary font-bold">
                S/ {parseFloat(totalCost || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-error-container text-on-error-container rounded-lg font-data-mono text-[12px]">
              {errorMsg}
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-space-md pt-space-xs border-t border-outline-variant/30">
            <button
              type="button"
              onClick={onClose}
              className="px-space-md h-12 rounded font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-space-xl bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container rounded font-label-badge text-label-badge uppercase tracking-widest flex items-center gap-space-sm transition-all shadow-[0_0_20px_rgba(175,198,255,0.4)] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>{loading ? 'Procesando...' : 'CONFIRMAR ASIGNACIÓN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

