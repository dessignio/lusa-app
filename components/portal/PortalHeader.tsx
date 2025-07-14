
import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { SettingsIcon, LogoutIcon, BarsIcon, TimesIcon, UserCircleIcon, UsersIcon } from '../icons';
import Clock from '../Clock';

interface PortalHeaderProps {
  onMenuButtonClick: () => void;
  isSidebarOpen: boolean;
}

const PortalHeader: React.FC<PortalHeaderProps> = ({ onMenuButtonClick, isSidebarOpen }) => {
  const { user, students, selectedStudent, selectStudent, logout } = useClientAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStudentSelect = (studentId: string) => {
    selectStudent(studentId);
    setIsProfileMenuOpen(false);
  }

  const showStudentSwitcher = user?.userType === 'parent' && students.length > 1;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
                {/* Mobile Menu Button */}
                <button
                onClick={onMenuButtonClick}
                className="md:hidden text-brand-text-secondary hover:text-brand-primary focus:outline-none"
                aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
                >
                {isSidebarOpen ? <TimesIcon className="w-6 h-6" /> : <BarsIcon className="w-6 h-6" />}
                </button>
                <div className="font-semibold text-brand-primary">
                    {selectedStudent ? `${selectedStudent.firstName}'s Portal` : 'Client Portal'}
                </div>
            </div>
            
            <div className="hidden sm:block text-brand-text-secondary text-xs"><Clock /></div>

            <div className="flex items-center space-x-4" ref={menuRef}>
                <div className="relative">
                    <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-brand-neutral-100">
                        <UserCircleIcon className="w-8 h-8 text-brand-text-muted" />
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-medium text-brand-text-primary">{user?.firstName} {user?.lastName}</p>
                            <p className="text-xs text-brand-text-secondary">{user?.userType === 'parent' ? 'Parent Account' : 'Student Account'}</p>
                        </div>
                    </button>

                    {isProfileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-brand-neutral-200 py-1 z-50">
                            {showStudentSwitcher && (
                                <>
                                    <div className="px-4 py-2 text-xs text-brand-text-muted uppercase font-semibold flex items-center">
                                        <UsersIcon className="w-4 h-4 mr-2"/>
                                        <span>Switch Student Profile</span>
                                    </div>
                                    {students.map(s => (
                                        <button 
                                            key={s.id}
                                            onClick={() => handleStudentSelect(s.id)}
                                            className={`w-full text-left px-4 py-2 text-sm flex items-center ${selectedStudent?.id === s.id ? 'bg-brand-primary-light/10 text-brand-primary font-semibold' : 'text-brand-text-secondary hover:bg-brand-neutral-50'}`}
                                        >
                                            <UserCircleIcon className="w-5 h-5 mr-2" />
                                            {s.firstName} {s.lastName}
                                        </button>
                                    ))}
                                    <div className="border-t border-brand-neutral-200 my-1"></div>
                                </>
                            )}
                            <NavLink to="/portal/account" onClick={() => setIsProfileMenuOpen(false)} className="w-full text-left px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-neutral-50 flex items-center">
                                <SettingsIcon className="w-4 h-4 mr-2"/> My Account
                            </NavLink>
                            <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-neutral-50 flex items-center">
                                <LogoutIcon className="w-4 h-4 mr-2"/> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;
