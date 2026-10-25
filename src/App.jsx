import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Login from './pages/Login';
import CheckIn from './pages/reception/CheckIn';
import UserRoster from './pages/admin/UserRoster';
import AthletesList from './pages/reception/AthletesList';
import AddUser from './pages/admin/AddUser';
import MemberCard from './pages/member/MemberCard';

function MainRouter() {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname !== '/' ? window.location.pathname : '';
  });

  // Role based automatic redirection upon login
  useEffect(() => {
    if (!user) {
      setCurrentPath('/login');
      return;
    }

    if (user.rol === 'ADMINISTRADOR') {
      if (!currentPath.startsWith('/admin')) {
        setCurrentPath('/admin/usuarios');
      }
    } else if (user.rol === 'RECEPCIONISTA') {
      if (!currentPath.startsWith('/recepcion')) {
        setCurrentPath('/recepcion/checkin');
      }
    } else if (user.rol === 'MIEMBRO') {
      setCurrentPath('/miembro/carnet');
    }
  }, [user]);

  const navigate = (path) => {
    setCurrentPath(path);
    window.history.pushState(null, '', path);
  };

  if (!user) {
    return <Login onLoginSuccess={(u) => navigate(u.redirectTo || '/')} />;
  }

  // Member Mobile View
  if (user.rol === 'MIEMBRO') {
    return <MemberCard />;
  }

  // Desktop Master Suite (Admin & Reception)
  const isAdmin = user.rol === 'ADMINISTRADOR';

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      <Header role={user.rol} />
      <Sidebar currentPath={currentPath} navigate={navigate} />

      <div className="pl-72">
        <main className="w-full min-h-screen pt-16 bg-surface">
          {/* Admin Routes */}
          {isAdmin && (
            <>
              {currentPath === '/admin/nuevo-usuario' ? (
                <AddUser onNavigate={navigate} />
              ) : (
                <UserRoster />
              )}
            </>
          )}

          {/* Reception Routes */}
          {!isAdmin && (
            <>
              {currentPath === '/recepcion/atletas' ? (
                <AthletesList onNavigate={navigate} />
              ) : currentPath === '/recepcion/agregar-miembro' ? (
                <AddUser onNavigate={navigate} />
              ) : (
                <CheckIn onNavigate={navigate} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
