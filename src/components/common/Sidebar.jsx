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
    </aside>
  );
}

