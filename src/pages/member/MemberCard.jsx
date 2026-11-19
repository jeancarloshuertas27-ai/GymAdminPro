import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import MemberNav from '../../components/member/MemberNav';
import PromoPopupModal from '../../components/member/PromoPopupModal';
import CallCoachModal from '../../components/member/CallCoachModal';
import MemberRoutine from './MemberRoutine';
import MemberCreateRoutine from './MemberCreateRoutine';
import MemberAiChat from './MemberAiChat';
import { BellRing, XCircle, RefreshCw, Dumbbell, Bot, ArrowRight } from 'lucide-react';

export default function MemberCard() {
  const { user, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('carnet'); // 'carnet' | 'rutina' | 'crear-rutina' | 'ia'
  const [memberData, setMemberData] = useState(null);
  const [promos, setPromos] = useState([]);
  const [nivelPromo, setNivelPromo] = useState('NOVATO');
  const [products, setProducts] = useState([]);
  const [rutinaResumen, setRutinaResumen] = useState(null);

  // Publicidad emergente por inicio de sesión
  const [showPromoPopup, setShowPromoPopup] = useState(false);

  // Llamar Coach: estado pendiente + modal
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [activeCoachAlert, setActiveCoachAlert] = useState(null);
  const [cancelingAlert, setCancelingAlert] = useState(false);

  const promosSectionRef = useRef(null);

  const fetchMemberDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [resUser, resPromos, resProducts, resRutina] = await Promise.all([
        authFetch(`/api/users/${user.id}`),
        authFetch('/api/promociones/para-miembro'),
        authFetch('/api/productos'),
        authFetch('/api/rutinas/mi-rutina'),
      ]);

      if (resUser.ok) {
        setMemberData(await resUser.json());
      }
      if (resPromos.ok) {
        const promoJson = await resPromos.json();
        const activeList = promoJson.promociones || [];
        setPromos(activeList);
        setNivelPromo(promoJson.nivel_actual || 'NOVATO');

        // Publicidad emergente solo una vez por inicio de sesión
        const popupKey = `gym_promo_popup_shown_${user.id}`;
        if (activeList.length > 0 && !sessionStorage.getItem(popupKey)) {
          setShowPromoPopup(true);
        }
      }
      if (resProducts.ok) {
        setProducts(await resProducts.json());
      }
      if (resRutina.ok) {
        const rJson = await resRutina.json();
        setRutinaResumen(rJson.rutina_asignada || null);
      }
    } catch (e) {
      console.error('Error al cargar datos del miembro:', e);
    }
  }, [user, authFetch]);

  const fetchActiveAlert = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await authFetch('/api/alertas-coach/mi-alerta');
      if (res.ok) {
        const data = await res.json();
        setActiveCoachAlert(data.alerta || null);
      }
    } catch {
      // Sondeo tolerante a desconexión
    }
  }, [user, authFetch]);

  useEffect(() => {
    fetchMemberDashboardData();
    fetchActiveAlert();
    const interval = setInterval(fetchActiveAlert, 2000);
    return () => clearInterval(interval);
  }, [fetchMemberDashboardData, fetchActiveAlert]);

  const handleClosePromoPopup = () => {
    if (user?.id) {
      sessionStorage.setItem(`gym_promo_popup_shown_${user.id}`, '1');
    }
    setShowPromoPopup(false);
  };

  const handleGoToRenew = () => {
    setActiveTab('carnet');
    setTimeout(() => {
      promosSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCancelCoachAlert = async () => {
    if (!activeCoachAlert) return;
    setCancelingAlert(true);
    try {
      const res = await authFetch(`/api/alertas-coach/${activeCoachAlert.id}/cancelar`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setActiveCoachAlert(null);
      }
    } catch (err) {
      console.error('Error al cancelar solicitud:', err);
    } finally {
      setCancelingAlert(false);
    }
  };

  const remainingDays = memberData?.remaining?.totalDays ?? 0;
  const fidelityName = memberData?.fidelity?.name || nivelPromo;
  const fidelityMonths = memberData?.fidelity?.months ?? 0;
  const progressPercent = memberData?.fidelity?.progressPercent ?? 0;
  const nextLevel = memberData?.fidelity?.nextLevel || 'MAX';

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-[calc(100vh-80px)] relative">
      {/* PESTAÑA: INICIO / CARNET */}
      {activeTab === 'carnet' && (
        <main className="flex flex-col relative w-full px-gutter-mobile space-y-space-md pb-8">
          {/* MEMBRESÍA, DÍAS FALTANTES Y FIDELIDAD */}
          <div className="relative w-full rounded-xl bg-surface-container-low p-space-md shadow-xl overflow-hidden border border-outline-variant/20">
            <div className="flex items-start justify-between gap-space-sm relative z-10 mb-space-sm">
              <div className="flex flex-col min-w-0">
                <span className="font-data-mono text-xs text-outline tracking-widest uppercase">
                  Membresía Activa
                </span>
                <span className="font-headline-lg text-2xl text-on-surface font-bold uppercase truncate">
                  {memberData?.membership?.plan_tag || 'MEMBRESÍA GIMNASIO'}
                </span>
                <span className="font-data-mono text-[11px] text-primary font-bold mt-0.5">
                  DNI: {user?.dni}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container/20 border border-primary/30 shrink-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    remainingDays > 10
                      ? 'bg-[#3bf589]'
                      : remainingDays > 0
                      ? 'bg-amber-400'
                      : 'bg-error'
                  } animate-pulse`}
                />
                <span className="font-label-badge text-xs text-on-surface uppercase font-bold tracking-wider">
                  {remainingDays} DÍAS FALTANTES
                </span>
              </div>
            </div>

            {/* Nivel de Fidelidad */}
            <div className="mt-2 rounded-lg bg-surface-container-lowest p-3 border border-outline-variant/15">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">military_tech</span>
                  </div>
                  <div>
                    <span className="font-label-badge text-xs text-primary uppercase tracking-wider font-bold block">
                      NIVEL: {fidelityName} ({fidelityMonths} MESES)
                    </span>
                    <span className="font-body-sm text-[11px] text-on-surface-variant">
                      Siguiente rango: <strong className="text-tertiary uppercase">{nextLevel}</strong>
                    </span>
                  </div>
                </div>
                <span className="font-headline-md text-lg text-primary font-bold">{progressPercent}%</span>
              </div>

              <div className="w-full bg-surface-container-highest rounded-full h-2 mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-container to-tertiary-container rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[9px] font-data-mono text-outline mt-1.5">
                <span>Novato</span>
                <span>Principiante</span>
                <span>Promedio</span>
                <span>Mutando</span>
                <span>Mamado/a</span>
                <span>Animal</span>
              </div>
            </div>

            {/* Botón Renovar Membresía */}
            <button
              type="button"
              onClick={handleGoToRenew}
              className="w-full mt-3 py-2.5 rounded-xl bg-surface-container-high hover:bg-primary-container text-primary hover:text-on-primary-container font-headline-md text-sm uppercase font-bold tracking-wider flex items-center justify-center gap-2 border border-primary/30 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Renovar membresía ({promos.length} promociones)</span>
            </button>
          </div>

          {/* MÓDULO LLAMAR COACH (TARJETA ACTIVA O BOTÓN) */}
          {activeCoachAlert ? (
            <div className="w-full rounded-xl bg-tertiary-container/25 border-2 border-tertiary/70 p-4 space-y-3 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-tertiary text-on-tertiary flex items-center justify-center shrink-0 animate-pulse">
                  <BellRing className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-data-mono text-[10px] uppercase font-bold text-tertiary block">
                    SOLICITUD EN CURSO
                  </span>
                  <h3 className="font-headline-md text-base text-on-surface uppercase font-bold">
                    Coach solicitado en {activeCoachAlert.maquina_numero}
                  </h3>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    Recepción ya recibió tu aviso y notificará al entrenador en sala.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={cancelingAlert}
                onClick={handleCancelCoachAlert}
                className="w-full py-2.5 rounded-xl bg-surface-container-lowest hover:bg-error-container text-error border border-error/40 font-headline-md text-sm uppercase font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>{cancelingAlert ? 'Cancelando...' : 'Cancelar solicitud'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCoachModal(true)}
              className="w-full h-14 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-headline-md text-lg tracking-wider uppercase font-bold flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(31,113,239,0.35)] active:scale-[0.98] transition-all cursor-pointer"
            >
              <BellRing className="w-6 h-6" />
              <span>LLAMAR COACH A MI MÁQUINA</span>
            </button>
          )}

          {/* ACCESO RÁPIDO: MI RUTINA Y ASISTENTE IA */}
          <div className="grid grid-cols-1 gap-3">
            <div
              onClick={() => setActiveTab('rutina')}
              className="rounded-xl bg-surface-container-low p-4 shadow-md border border-outline-variant/20 flex items-center justify-between gap-3 hover:border-primary/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="font-data-mono text-[10px] text-outline uppercase block">
                    TU RUTINA ASIGNADA
                  </span>
                  <h3 className="font-headline-md text-lg text-on-surface uppercase font-bold truncate">
                    {rutinaResumen?.nombre || memberData?.membership?.rutina_asignada || 'Ver o crear rutina'}
                  </h3>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-primary shrink-0" />
            </div>

            <div
              onClick={() => setActiveTab('ia')}
              className="rounded-xl bg-surface-container-low p-4 shadow-md border border-outline-variant/20 flex items-center justify-between gap-3 hover:border-primary/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-tertiary-container/25 text-tertiary flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="font-data-mono text-[10px] text-outline uppercase block">
                    AYUDA CON IA
                  </span>
                  <h3 className="font-headline-md text-lg text-on-surface uppercase font-bold truncate">
                    Consultar ejercicios o máquinas
                  </h3>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-tertiary shrink-0" />
            </div>
          </div>

          {/* PROMOCIONES Y PLANES VIGENTES PARA RENOVACIÓN */}
          <div ref={promosSectionRef} className="flex flex-col space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-label-badge text-xs text-on-surface uppercase tracking-wider font-bold">
                Promociones Vigentes para Ti
              </span>
              <span className="font-data-mono text-[11px] text-outline">DESLIZA &gt;</span>
            </div>

            <div className="flex overflow-x-auto space-x-3 pb-2 pt-1 no-scrollbar">
              {promos.length === 0 ? (
                <div className="flex-shrink-0 w-full rounded-xl bg-surface-container p-5 text-center border border-outline-variant/20">
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    No hay promociones vigentes disponibles en este momento.
                  </p>
                </div>
              ) : (
                promos.map((p) => (
                  <div
                    key={p.id}
                    className="flex-shrink-0 w-[82%] max-w-[300px] rounded-xl bg-surface-container overflow-hidden shadow-md flex flex-col justify-between border border-outline-variant/25"
                  >
                    {p.banner_url ? (
                      <div className="w-full h-32 overflow-hidden bg-surface-container-highest">
                        <img
                          src={p.banner_url}
                          alt={p.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-surface-container-highest flex items-center justify-center text-outline">
                        <Dumbbell className="w-8 h-8 opacity-60" />
                      </div>
                    )}

                    <div className="p-3.5 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-data-mono text-[10px] text-primary uppercase font-bold px-2 py-0.5 rounded bg-primary-container/20">
                            {p.duracion_valor} {p.duracion_unidad}
                          </span>
                          {p.fecha_limite && (
                            <span className="font-data-mono text-[10px] text-tertiary font-bold">
                              Hasta {p.fecha_limite}
                            </span>
                          )}
                        </div>
                        <h4 className="font-headline-md text-lg text-on-surface uppercase font-bold mt-2 leading-tight">
                          {p.nombre}
                        </h4>
                        {p.publico_objetivo !== 'TODOS' && (
                          <p className="font-data-mono text-[10px] text-secondary mt-0.5">
                            Exclusivo nivel: {p.publico_objetivo}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex items-center justify-between">
                        <span className="font-data-mono text-[10px] text-outline uppercase">RENOVACIÓN</span>
                        <span className="font-headline-md text-xl text-primary font-extrabold">
                          S/ {parseFloat(p.precio || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TIENDA EN RECEPCIÓN */}
          {products.length > 0 && (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-label-badge text-xs text-on-surface uppercase tracking-wider font-bold">
                  Productos Disponibles en Recepción
                </span>
                <span className="font-data-mono text-[11px] text-outline">STOCK EN SALA &gt;</span>
              </div>
              <div className="flex overflow-x-auto space-x-3 pb-2 pt-1 no-scrollbar">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className={`flex-shrink-0 w-[160px] rounded-xl bg-surface-container overflow-hidden shadow-md flex flex-col justify-between border border-outline-variant/20 ${
                      prod.stock <= 0 ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="w-full h-24 bg-surface-container-highest flex items-center justify-center overflow-hidden">
                      {prod.imagen_url ? (
                        <img
                          src={prod.imagen_url}
                          alt={prod.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-outline text-[28px]">inventory_2</span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <span className="font-data-mono text-[9px] text-secondary font-bold uppercase">
                        {prod.categoria || 'GENERAL'}
                      </span>
                      <h4 className="font-headline-md text-xs text-on-surface uppercase font-bold truncate mt-0.5">
                        {prod.nombre}
                      </h4>
                      <div className="mt-2 pt-1.5 border-t border-outline-variant/15 flex items-baseline justify-between">
                        <span className="font-headline-md text-sm text-primary font-bold">
                          S/ {parseFloat(prod.precio_venta).toFixed(2)}
                        </span>
                        <span className="font-data-mono text-[9px] text-on-surface-variant">
                          {prod.stock > 0 ? `${prod.stock} disp.` : 'Agotado'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* PESTAÑA: MI RUTINA (OFICIAL + PRIVADAS) */}
      {activeTab === 'rutina' && (
        <MemberRoutine onGoToCreate={() => setActiveTab('crear-rutina')} />
      )}

      {/* PESTAÑA: CREAR RUTINA PERSONAL PRIVADA */}
      {activeTab === 'crear-rutina' && (
        <MemberCreateRoutine
          onBack={() => setActiveTab('rutina')}
          onCreated={() => setActiveTab('rutina')}
        />
      )}

      {/* PESTAÑA: AYUDA CON IA */}
      {activeTab === 'ia' && <MemberAiChat />}

      {/* PUBLICIDAD EMERGENTE POR INICIO DE SESIÓN */}
      {showPromoPopup && (
        <PromoPopupModal
          promos={promos}
          nivelActual={nivelPromo}
          onClose={handleClosePromoPopup}
          onGoToRenew={handleGoToRenew}
        />
      )}

      {/* MODAL LLAMAR A COACH */}
      <CallCoachModal
        isOpen={showCoachModal}
        onClose={() => setShowCoachModal(false)}
        onAlertCreated={(alerta) => {
          setActiveCoachAlert(alerta);
          fetchActiveAlert();
        }}
      />

      {/* NAVEGACIÓN INFERIOR MÓVIL */}
      <MemberNav
        activeTab={activeTab}
        onChangeTab={(tabId) => setActiveTab(tabId)}
        onCallCoach={() => {
          if (activeCoachAlert) {
            setActiveTab('carnet');
          } else {
            setShowCoachModal(true);
          }
        }}
      />
    </div>
  );
}
