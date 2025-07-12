import React from 'react';
import { NavLink } from 'react-router-dom';
import { SettingsIcon, UserPlusIcon, DollarSignIcon } from '../components/icons';
import { DynamicKPIs } from '../components/dashboard/DynamicKPIs';
import { ActionCenterWidget } from '../components/dashboard/ActionCenterWidget';
import { FinancialHealthWidget } from '../components/dashboard/FinancialHealthWidget';
import StudentLifecycleWidget from '../components/dashboard/StudentLifecycleWidget';
import { AnnouncementsWidget } from '../components/dashboard/AnnouncementsWidget';
import Button from '../components/forms/Button';
import { useAuth } from '../contexts/AuthContext';


const DashboardPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  return (
    <div className="space-y-6">
      {/* Welcome Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary">¡Hola, {user?.firstName || 'Admin'}!</h1>
          <p className="text-brand-text-secondary mt-1">Aquí tienes un resumen de la actividad de tu estudio.</p>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          {hasPermission('manage_students') && (
            <NavLink to="/users/students/new">
              <Button variant="primary" size="sm" leftIcon={<UserPlusIcon className="w-4 h-4" />}>
                Inscribir Alumno
              </Button>
            </NavLink>
          )}
           {hasPermission('process_payments') && (
             <NavLink to="/billing">
              <Button variant="outline" size="sm" leftIcon={<DollarSignIcon className="w-4 h-4" />}>
                Registrar Pago
              </Button>
            </NavLink>
           )}
        </div>
      </div>
      
      {/* Dynamic KPIs */}
      <DynamicKPIs />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Actions & Info) */}
        <div className="lg:col-span-2 space-y-6">
          <ActionCenterWidget />
          <AnnouncementsWidget />
        </div>

        {/* Right Column (Financial & Community) */}
        <div className="lg:col-span-1 space-y-6">
          {hasPermission('view_dashboard_financials') && <FinancialHealthWidget />}
          <StudentLifecycleWidget />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
