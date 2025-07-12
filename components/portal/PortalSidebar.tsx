import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, CalendarIcon, CheckCircleIcon, SettingsIcon, EnvelopeIcon, TimesIcon } from '../icons';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { calculateAge } from '../../utils';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, onClick, disabled = false }) => {
  const baseStyles = "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors";
  const activeStyles = "bg-brand-primary text-white shadow-sm";
  const inactiveStyles = "text-brand-text-secondary hover:bg-brand-primary-light/20 hover:text-brand-primary-dark";
  const disabledStyles = "text-brand-text-muted cursor-not-allowed bg-brand-neutral-100";

  if(disabled) {
    return (
        <div className={`${baseStyles} ${disabledStyles}`}>
            {icon}
            <span>{label}</span>
        </div>
    );
  }
  
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to === "/portal/" || to === "/portal/dashboard"}
      className={({ isActive }) => `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`}
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

const PortalSidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
    const { selectedStudent, user } = useClientAuth();
    
    // Disable navigation if no student is selected (for parents with multiple children)
    const isNavDisabled = !selectedStudent;
    
    const studentAge = selectedStudent ? calculateAge(selectedStudent.dateOfBirth) : null;
    const isMinor = studentAge !== null && studentAge < 18;
    
    const navItems = [
        { to: "/portal/dashboard", icon: <HomeIcon className="w-5 h-5" />, label: "Dashboard" },
        { to: "/portal/schedule", icon: <CalendarIcon className="w-5 h-5" />, label: "My Schedule" },
        { to: "/portal/attendance", icon: <CheckCircleIcon className="w-5 h-5" />, label: "Attendance" },
        { to: "/portal/announcements", icon: <EnvelopeIcon className="w-5 h-5" />, label: "Announcements" },
        { to: "/portal/account", icon: <SettingsIcon className="w-5 h-5" />, label: "My Account", show: user?.userType === 'parent' || !isMinor },
    ].filter(item => item.show !== false);

  const sidebarContent = (
    <>
      <div className="flex justify-between items-center mb-4 md:hidden">
        <h2 className="text-lg font-semibold text-brand-primary">Menu</h2>
        <button onClick={toggleSidebar} className="text-brand-text-muted hover:text-brand-primary">
            <TimesIcon className="w-6 h-6" />
        </button>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onClick={toggleSidebar} disabled={isNavDisabled} />
        ))}
      </nav>
      {isNavDisabled && user?.userType === 'parent' && (
          <div className="mt-4 p-3 bg-brand-info-light text-brand-info text-xs rounded-md">
              Please select a student profile from the header menu to begin.
          </div>
      )}
    </>
  );

  return (
    <>
      {/* Sidebar for medium screens and up */}
      <aside className="w-64 bg-white p-4 space-y-2 border-r border-brand-neutral-200 shadow-sm hidden md:block flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Overlay) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white p-4 space-y-2 border-r border-brand-neutral-200 shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default PortalSidebar;
