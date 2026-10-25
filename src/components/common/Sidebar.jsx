import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ currentPath, navigate }) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const adminRoutes = [
    { name: 'Usuarios & Fidelidad', path: '/admin/usuarios', icon: 'military_tech' },
    { name: 'Nuevo Usuario', path: '/admin/nuevo-usuario', icon: 'person_add' },
  ];

  const receptionRoutes = [
    { name: 'Control Acceso & Check-In', path: '/recepcion/checkin', icon: 'sensor_door' },
    { name: 'Lista de Atletas', path: '/recepcion/atletas', icon: 'groups' },
    { name: 'Agregar Miembro', path: '/recepcion/agregar-miembro', icon: 'person_add' },
  ];

  const routes = isAdmin ? adminRoutes : receptionRoutes;

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-72 bg-surface-container-lowest z-40 flex flex-col justify-between py-space-md shadow-[1px_0_12px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-space-md">
        <div className="px-space-lg">
          <p className="font-data-mono text-[11px] tracking-widest uppercase text-on-surface-variant">
            NÚCLEO TÁCTICO // RUTAS
          </p>
        </div>

        <nav className="flex flex-col gap-space-xs px-space-sm">
          {routes.map((r) => {
            const isActive = currentPath === r.path;
            return (
              <button
                key={r.path}
                type="button"
                onClick={() => navigate(r.path)}
                className={`flex items-center gap-space-sm px-space-md py-3 rounded text-left transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-headline-md shadow-[0_0_16px_rgba(31,113,239,0.25)]'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{r.icon}</span>
                <span className="font-label-badge text-label-badge tracking-wider uppercase">
                  {r.name}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-space-md flex flex-col gap-space-sm">
        {/* Terminal Info */}
        <div className="bg-surface-container-low p-space-sm rounded flex flex-col gap-space-xs">
          <div className="flex justify-between items-center">
            <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">TORNIQUETE #01</span>
            <span className="font-data-mono text-[10px] text-primary uppercase">EN LÍNEA</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">PROTOCOL</span>
            <span className="font-data-mono text-[10px] text-on-surface uppercase">TLS 1.3 / AES-GCM</span>
          </div>
        </div>

        {/* SOS Bloqueo Total */}
        <button
          type="button"
          onClick={() => alert('¡ALERTA SOS ACTIVADA! Protocolo de bloqueo de emergencia activado.')}
          className="w-full h-11 bg-error-container hover:bg-error text-on-error hover:text-on-primary-container rounded flex items-center justify-center gap-space-sm transition-all shadow-[0_0_12px_rgba(147,0,10,0.4)]"
        >
          <span className="material-symbols-outlined text-[18px]">e911_emergency</span>
          <span className="font-headline-md text-headline-md uppercase tracking-wider text-[15px]">
            SOS // BLOQUEO TOTAL
          </span>
        </button>
      </div>
    </aside>
  );
}

