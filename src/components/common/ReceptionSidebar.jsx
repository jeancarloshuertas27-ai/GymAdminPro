import React from 'react';

export default function ReceptionSidebar({ currentPath, navigate }) {
  const routes = [
    { name: 'Control Acceso (Check-In)', path: '/recepcion/checkin', icon: 'sensor_door' },
    { name: 'Manejar Rutinas', path: '/recepcion/rutinas', icon: 'fitness_center' },
    { name: 'Gestión de Membresías', path: '/recepcion/membresias', icon: 'card_membership' },
    { name: 'Venta Rápida Productos', path: '/recepcion/productos', icon: 'point_of_sale' },
    { name: 'Lista de Atletas', path: '/recepcion/atletas', icon: 'groups' },
    { name: 'Agregar Miembro', path: '/recepcion/agregar-miembro', icon: 'person_add' },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-72 bg-surface-container-lowest z-40 flex flex-col justify-between py-space-md shadow-[1px_0_12px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-space-md">
        <div className="px-space-lg">
          <p className="font-data-mono text-[11px] tracking-widest uppercase text-tertiary font-bold">
            MOSTRADOR // OPERACIONES
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
                    ? 'bg-tertiary-container text-on-tertiary-container font-headline-md shadow-[0_0_16px_rgba(0,229,190,0.25)]'
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
