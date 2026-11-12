import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Portales y Logins Exclusivos
import PortalSelect from './pages/PortalSelect';
import AdminLogin from './pages/admin/AdminLogin';
import ReceptionLogin from './pages/reception/ReceptionLogin';
import MemberLogin from './pages/member/MemberLogin';

// Layouts Dedicados
import AdminLayout from './components/common/AdminLayout';
import ReceptionLayout from './components/common/ReceptionLayout';
import MemberLayout from './components/common/MemberLayout';

// Páginas del Administrador
import DashboardPage from './pages/admin/DashboardPage';
import ApprovalsPage from './pages/admin/ApprovalsPage';
import UserRoster from './pages/admin/UserRoster';
import MembershipPromos from './pages/admin/MembershipPromos';
import ProductInventory from './pages/admin/ProductInventory';
import AddUser from './pages/admin/AddUser';

// Páginas de Recepción
import CheckIn from './pages/reception/CheckIn';
import MembershipOps from './pages/reception/MembershipOps';
import QuickSales from './pages/reception/QuickSales';
import AthletesList from './pages/reception/AthletesList';

// Páginas del Miembro
import MemberCard from './pages/member/MemberCard';

function MainRouter() {
  const { sessions, setCurrentPath: setContextPath } = useAuth();
  const [currentPath, setCurrentPathState] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname || '/';
      setCurrentPathState(p);
      setContextPath(p);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setContextPath]);

  const navigate = (path) => {
    setCurrentPathState(path);
    setContextPath(path);
    window.history.pushState(null, '', path);
  };

  // 1. Selector Táctico de Portales (Ruta Raíz /)
  if (currentPath === '/' || currentPath === '') {
    return <PortalSelect onSelectPortal={(p) => navigate(p)} />;
  }

  // 2. Sitio Administrador (/admin/*)
  if (currentPath.startsWith('/admin')) {
    const adminUser = sessions.admin?.user;
    if (!adminUser) {
      return (
        <AdminLogin
          onLoginSuccess={() => navigate('/admin/dashboard')}
          onBackToPortals={() => navigate('/')}
        />
      );
    }

    return (
      <AdminLayout currentPath={currentPath} navigate={navigate}>
        {(currentPath === '/admin' || currentPath === '/admin/dashboard') && (
          <DashboardPage onNavigate={navigate} />
        )}
        {currentPath === '/admin/checkin' && (
          <CheckIn onNavigate={navigate} />
        )}
        {currentPath === '/admin/membresias-promociones' && (
          <MembershipPromos onNavigate={navigate} />
        )}
        {currentPath === '/admin/membresias' && (
          <MembershipOps onNavigate={navigate} />
        )}
        {currentPath === '/admin/aprobaciones' && (
          <ApprovalsPage onNavigate={navigate} />
        )}
        {currentPath === '/admin/usuarios' && (
          <UserRoster onNavigate={navigate} />
        )}
        {currentPath === '/admin/productos' && (
          <ProductInventory onNavigate={navigate} />
        )}
        {currentPath === '/admin/nuevo-usuario' && (
          <AddUser onNavigate={navigate} />
        )}
      </AdminLayout>
    );
  }

  // 3. Sitio Recepción (/recepcion/*)
  if (currentPath.startsWith('/recepcion')) {
    const recepUser = sessions.recepcion?.user;
    if (!recepUser) {
      return (
        <ReceptionLogin
          onLoginSuccess={() => navigate('/recepcion/checkin')}
          onBackToPortals={() => navigate('/')}
        />
      );
    }

    return (
      <ReceptionLayout currentPath={currentPath} navigate={navigate}>
        {(currentPath === '/recepcion' || currentPath === '/recepcion/checkin') && (
          <CheckIn onNavigate={navigate} />
        )}
        {currentPath === '/recepcion/membresias' && (
          <MembershipOps onNavigate={navigate} />
        )}
        {currentPath === '/recepcion/productos' && (
          <QuickSales onNavigate={navigate} />
        )}
        {currentPath === '/recepcion/atletas' && (
          <AthletesList onNavigate={navigate} />
        )}
        {currentPath === '/recepcion/agregar-miembro' && (
          <AddUser onNavigate={navigate} />
        )}
      </ReceptionLayout>
    );
  }

  // 4. Sitio Miembro (/miembro/*)
  if (currentPath.startsWith('/miembro')) {
    const memberUser = sessions.miembro?.user;
    if (!memberUser) {
      return (
        <MemberLogin
          onLoginSuccess={() => navigate('/miembro/carnet')}
          onBackToPortals={() => navigate('/')}
        />
      );
    }

    return (
      <MemberLayout title="Carnet Digital">
        <MemberCard onNavigate={navigate} />
      </MemberLayout>
    );
  }

  // Fallback por defecto: Selector de Portales
  return <PortalSelect onSelectPortal={(p) => navigate(p)} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
