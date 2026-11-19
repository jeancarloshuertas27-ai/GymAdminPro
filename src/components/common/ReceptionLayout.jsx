import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import ReceptionSidebar from './ReceptionSidebar';
import CoachAlertsBanner from '../coach/CoachAlertsBanner';

export default function ReceptionLayout({ currentPath, navigate, children }) {
  const { logout } = useAuth();

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen selection:bg-tertiary-container selection:text-on-tertiary-container">
      <Header role="RECEPCIONISTA" onLogout={() => logout('recepcion')} />
      <ReceptionSidebar currentPath={currentPath} navigate={navigate} />

      <div className="pl-72">
        <main className="w-full min-h-screen pt-16 bg-surface">
          <CoachAlertsBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
