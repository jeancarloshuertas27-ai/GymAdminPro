import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AdminLayout({ currentPath, navigate, children }) {
  const { logout } = useAuth();

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      <Header role="ADMINISTRADOR" onLogout={() => logout('admin')} />
      <Sidebar currentPath={currentPath} navigate={navigate} />

      <div className="pl-72">
        <main className="w-full min-h-screen pt-16 bg-surface">
          {children}
        </main>
      </div>
    </div>
  );
}
