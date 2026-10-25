import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function MobileHeader({ title = 'Inicio' }) {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
      <div className="h-16 px-gutter-mobile flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center font-headline-md text-on-primary-container">
            <span className="material-symbols-outlined text-[20px]">fitness_center</span>
          </div>
          <div className="flex flex-col truncate">
            <span className="font-label-badge text-label-badge text-primary uppercase tracking-widest leading-none">
              GYMCORE
            </span>
            <span className="font-headline-md text-headline-md text-on-surface truncate uppercase leading-tight">
              {title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-body-sm text-[12px] text-on-surface-variant font-medium hidden sm:inline">
              {user ? user.nombres : 'Atleta'}
            </span>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-1.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
