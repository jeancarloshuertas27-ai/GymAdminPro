import React from 'react';

export default function MemberNav({ activeTab = 'carnet', onChangeTab, onCallCoach }) {
  const tabs = [
    { id: 'carnet', label: 'Inicio', icon: 'badge' },
    { id: 'rutina', label: 'Mi Rutina', icon: 'fitness_center' },
    { id: 'coach', label: 'Llamar Coach', icon: 'campaign' },
    { id: 'ia', label: 'Ayuda IA', icon: 'smart_toy' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 sm:sticky sm:bottom-0 w-full z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/20 shadow-lg">
      <div className="grid grid-cols-4 items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (tab.id === 'rutina' && activeTab === 'crear-rutina');
          const isCoach = tab.id === 'coach';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (isCoach && onCallCoach) {
                  onCallCoach();
                } else if (onChangeTab) {
                  onChangeTab(tab.id);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 h-full transition-all cursor-pointer ${
                isActive
                  ? 'text-primary font-bold'
                  : isCoach
                  ? 'text-tertiary hover:text-tertiary-container'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${isCoach ? 'animate-pulse' : ''}`}>
                {tab.icon}
              </span>
              <span className="font-label-badge text-[10px] uppercase tracking-wider">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
