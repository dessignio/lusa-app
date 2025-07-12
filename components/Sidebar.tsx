import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, UsersIcon, ClassesIcon, CalendarIcon, DollarSignIcon, EnvelopeIcon, ChartBarIcon, SettingsIcon, TimesIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isNavLinkEnd?: boolean; // For v6 NavLink 'end' prop, similar to 'exact' for root
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, onClick, isNavLinkEnd = false }) => {
  const baseStyles = "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors";
  const activeSpecificStyles = "bg-brand-primary text-white shadow-sm";
  const inactiveSpecificStyles = "text-brand-text-secondary hover:bg-brand-primary-light/20 hover:text-brand-primary-dark";
  
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={isNavLinkEnd} // Use 'end' prop for v6
      className={({ isActive }) => `${baseStyles} ${isActive ? activeSpecificStyles : inactiveSpecificStyles}`}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};


interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
    const { hasPermission } = useAuth();
  
    const navItems = [
    { to: "/", icon: <HomeIcon className="w-5 h-5" />, label: "Dashboard", isNavLinkEnd: true, show: hasPermission('view_dashboard') },
    { to: "/users", icon: <UsersIcon className="w-5 h-5" />, label: "User Management", show: hasPermission(['view_students', 'view_instructors']) },
    { to: "/classes", icon: <ClassesIcon className="w-5 h-5" />, label: "Class Management", show: hasPermission(['manage_programs', 'manage_class_offerings', 'manage_schedules']) },
    { to: "/enrollments", icon: <CalendarIcon className="w-5 h-5" />, label: "Enrollments", show: hasPermission(['view_enrollments', 'manage_enrollments']) },
    { to: "/billing", icon: <DollarSignIcon className="w-5 h-5" />, label: "Billing & Payments", show: hasPermission(['process_payments', 'manage_invoices', 'manage_subscriptions']) },
    { to: "/communications", icon: <EnvelopeIcon className="w-5 h-5" />, label: "Communications", show: hasPermission('send_announcements') },
    { to: "/reports", icon: <ChartBarIcon className="w-5 h-5" />, label: "Reports", show: hasPermission(['view_all_reports', 'view_student_reports', 'view_attendance_reports', 'view_enrollment_reports', 'view_financial_reports', 'view_membership_reports']) },
    { to: "/settings", icon: <SettingsIcon className="w-5 h-5" />, label: "Settings", show: hasPermission(['manage_general_settings', 'manage_calendar_settings', 'manage_membership_plans', 'manage_roles_permissions', 'manage_admin_users']) },
  ].filter(item => item.show);


  return (
    <>
      {/* Sidebar for medium screens and up */}
      <aside className="w-64 bg-white p-4 space-y-2 border-r border-brand-neutral-200 shadow-sm hidden md:block flex-shrink-0">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar (Overlay) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white p-4 space-y-2 border-r border-brand-neutral-200 shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-brand-primary">Menu</h2>
            <button onClick={toggleSidebar} className="text-brand-text-muted hover:text-brand-primary">
                <TimesIcon className="w-6 h-6" />
            </button>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} onClick={toggleSidebar} /> // Close sidebar on nav item click
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
