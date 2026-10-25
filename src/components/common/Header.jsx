import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ role = 'ADMINISTRADOR', alertMessage = null }) {
  const { user, logout } = useAuth();
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = role === 'ADMINISTRADOR';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
      <div className="w-full h-full px-gutter flex items-center justify-between">
        {/* Left: Brand & Mode Badge */}
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[24px]">fitness_center</span>
            <span className="font-headline-md text-headline-md tracking-wider uppercase text-on-surface">
              GYMCORE <span className="text-primary">//</span> {isAdmin ? 'ADMIN MASTER SUITE' : 'TERMINAL RECEPCIÓN'}
            </span>
          </div>
          <span
            className={`px-space-sm py-0.5 rounded font-label-badge text-label-badge tracking-widest uppercase ${
              isAdmin ? 'bg-error-container text-on-error' : 'bg-primary-container text-on-primary-container'
            }`}
          >
            {isAdmin ? 'SUPERADMIN' : 'RECEPCIONISTA'}
          </span>

          {alertMessage && (
            <div className="hidden lg:flex items-center gap-space-sm px-space-md py-1 bg-tertiary-container rounded shadow-[0_0_12px_rgba(199,83,2,0.4)] animate-pulse">
              <span className="material-symbols-outlined text-on-tertiary-container text-[18px]">warning</span>
              <span className="font-headline-md text-headline-md text-on-tertiary-container text-[14px] uppercase tracking-wide">
                {alertMessage}
              </span>
            </div>
          )}
        </div>

        {/* Right: Telemetry & User Info */}
        <div className="flex items-center gap-space-lg">
          <div className="hidden md:flex items-center gap-space-xs font-data-mono text-data-mono text-primary bg-surface-container-high px-space-md py-1 rounded">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>{time || '23:42:10 UTC'}</span>
          </div>

          <div className="flex items-center gap-space-sm pl-space-sm">
            <div className="text-right hidden sm:block">
              <p className="font-label-badge text-label-badge uppercase leading-none text-on-surface">
                {user ? `${user.nombres} ${user.apellidos}` : 'Operador'}
              </p>
              <p className="font-data-mono text-[11px] leading-tight text-on-surface-variant">
                {isAdmin ? 'ROOT_ACCESS' : 'RECEPCIONISTA // TURNO B'}
              </p>
            </div>
            <div
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary-container"
              title="Cerrar sesión"
              onClick={logout}
            >
              <span className="material-symbols-outlined text-on-primary text-[18px]">logout</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

