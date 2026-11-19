import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ currentPath, navigate }) {
  const { user, activePortal } = useAuth();
  const isAdmin = user?.rol === 'ADMINISTRADOR' || activePortal === 'admin';

  const adminRoutes = [
    { name: 'Dashboard Principal', path: '/admin/dashboard', icon: 'grid_view' },
    { name: 'Control de Acceso', path: '/admin/checkin', icon: 'sensor_door' },
    { name: 'Configurar y Manejar Rutinas', path: '/admin/rutinas', icon: 'fitness_center' },
    { name: 'Membresías & Promociones', path: '/admin/membresias-promociones', icon: 'card_membership' },
    { name: 'Manejar Membresías', path: '/admin/membresias', icon: 'badge' },
    { name: 'Cambios & Aprobaciones', path: '/admin/aprobaciones', icon: 'verified_user' },
    { name: 'Usuarios & Fidelidad', path: '/admin/usuarios', icon: 'military_tech' },
    { name: 'Inventario Maestro', path: '/admin/productos', icon: 'inventory_2' },
    { name: 'Nuevo Usuario', path: '/admin/nuevo-usuario', icon: 'person_add' },
  ];

  const receptionRoutes = [
    { name: 'Control Acceso (Check-In)', path: '/recepcion/checkin', icon: 'sensor_door' },
    { name: 'Manejar Rutinas', path: '/recepcion/rutinas', icon: 'fitness_center' },
    { name: 'Gestión de Membresías', path: '/recepcion/membresias', icon: 'card_membership' },
    { name: 'Venta Rápida Productos', path: '/recepcion/productos', icon: 'point_of_sale' },
    { name: 'Lista de Atletas', path: '/recepcion/atletas', icon: 'groups' },
    { name: 'Agregar Miembro', path: '/recepcion/agregar-miembro', icon: 'person_add' },
  ];

  const routes = isAdmin ? adminRoutes : receptionRoutes;

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-72 bg-surface-container-lowest z-40 flex flex-col justify-between py-space-md shadow-[1px_0_12px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-space-md">
        <div className="px-space-lg">
          <p className="font-data-mono text-[11px] tracking-widest uppercase text-on-surface-variant">
            {isAdmin ? 'ADMINISTRACIÓN // RUTAS' : 'MOSTRADOR // OPERACIONES'}
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
