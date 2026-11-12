import React from 'react';
import AdminDashboard from '../../components/admin/AdminDashboard';

export default function DashboardPage({ onNavigate }) {
  return <AdminDashboard onNavigate={onNavigate} />;
}
