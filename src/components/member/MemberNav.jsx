import React from 'react';

export default function MemberNav({ activeTab = 'carnet', onChangeTab, onCallCoach }) {
  const tabs = [
    { id: 'carnet', label: 'Carnet', icon: 'badge' },
    { id: 'promociones', label: 'Promociones', icon: 'local_offer' },
    { id: 'rutina', label: 'Mi Rutina', icon: 'fitness_center' },
    { id: 'coach', label: 'Llamar Coach', icon: 'campaign' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/20 shadow-lg">
      <div className="max-w-[440px] mx-auto grid grid-cols-4 items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
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
              className={`flex flex-col items-center justify-center gap-1 h-full transition-all ${
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
