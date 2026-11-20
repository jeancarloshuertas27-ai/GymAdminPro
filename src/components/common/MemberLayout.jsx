import React from 'react';
import { useAuth } from '../../context/AuthContext';
import MobileHeader from './MobileHeader';

export default function MemberLayout({ title = 'Carnet Digital', children, activeTab, onChangeTab, onCallCoach }) {
  const { logout } = useAuth();

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex items-center justify-center sm:py-8 sm:px-4 selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Marco de Smartphone para escritorio y fluido en móvil */}
      <div className="w-full sm:max-w-[420px] bg-surface min-h-screen sm:min-h-[820px] sm:max-h-[92vh] sm:rounded-[40px] sm:border-[6px] sm:border-surface-container-highest sm:shadow-2xl flex flex-col relative overflow-hidden sm:overflow-y-auto">
        {/* Notch decorativo visible solo en pantallas con marco */}
        <div className="hidden sm:block absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-surface-container-highest rounded-full z-50 pointer-events-none"></div>

        <MobileHeader title={title} onLogout={() => logout('miembro')} />

        <div className="flex-1 w-full pt-4 pb-16 sm:pb-2">
          {children}
        </div>
      </div>
    </div>
  );
}
