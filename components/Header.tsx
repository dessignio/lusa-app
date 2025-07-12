
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { BellIcon, SettingsIcon, UserCircleIcon, LogoutIcon, SearchIcon, BarsIcon, TimesIcon } from './icons';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationPanel from './NotificationPanel';
import { useAuth } from '../contexts/AuthContext';
import Clock from './Clock';

interface HeaderProps {
  onMenuButtonClick: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuButtonClick, isSidebarOpen }) => {
  const navLinkBaseStyles = "flex items-center space-x-1 hover:text-brand-primary-light text-xs sm:text-sm";
  const activeNavLinkStyles = "text-brand-primary-light";
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [classSearchTerm, setClassSearchTerm] = useState('');

  const { unreadCount, markAllAsRead } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const toggleNotifications = () => {
    if(!isNotificationsOpen) {
      markAllAsRead();
    }
    setIsNotificationsOpen(prev => !prev);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsRef]);


  const handleStudentSearchSubmit = () => {
    if (studentSearchTerm.trim()) {
      navigate(`/users/students?search=${encodeURIComponent(studentSearchTerm.trim())}`);
      setStudentSearchTerm('');
    }
  };

  const handleClassSearchSubmit = () => {
    if (classSearchTerm.trim()) {
      navigate(`/classes/offerings?search=${encodeURIComponent(classSearchTerm.trim())}`);
      setClassSearchTerm('');
    }
  };

  const handleStudentSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleStudentSearchSubmit();
    }
  };

  const handleClassSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleClassSearchSubmit();
    }
  };

  return (
    <header className="bg-brand-primary text-white shadow-md relative z-40">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex justify-between items-center py-2 border-b border-brand-primary-dark/50">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuButtonClick}
              className="md:hidden text-white hover:text-brand-primary-light focus:outline-none"
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            >
              {isSidebarOpen ? <TimesIcon className="w-6 h-6" /> : <BarsIcon className="w-6 h-6" />}
            </button>
             <div className="hidden lg:block text-white/90 text-xs"><Clock /></div>
            <div className="text-sm hidden md:block">User: {user?.username || '...'}</div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? `${navLinkBaseStyles} ${activeNavLinkStyles}` : navLinkBaseStyles}
            >
              <i className="fa-solid fa-house"></i>
              <span className="hidden sm:inline">Home</span>
            </NavLink>
            <NavLink 
              to="/classes/schedules" 
              className={({ isActive }) => isActive ? `${navLinkBaseStyles} ${activeNavLinkStyles}` : navLinkBaseStyles}
            >
              <i className="fa-solid fa-calendar"></i>
              <span className="hidden sm:inline">Studio Schedule</span>
            </NavLink>
            <button onClick={logout} className="flex items-center space-x-1 hover:text-brand-primary-light text-xs sm:text-sm">
              <LogoutIcon className="w-3 h-3 sm:w-4 sm:h-4"/>
              <span className="hidden sm:inline">Signout</span>
            </button>
          </div>
        </div>

        {/* Main Header */}
        <div className="flex flex-col md:flex-row justify-between items-center py-3">
          <NavLink 
            to="/" 
            className={({ isActive }) => `text-xl sm:text-2xl font-bold text-white self-center md:self-auto mb-2 md:mb-0 ${isActive ? activeNavLinkStyles : ''}`}
          >
            {APP_NAME}
          </NavLink>
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Find a student..."
                className="bg-brand-primary-dark placeholder-brand-primary-light/70 text-white px-3 py-1.5 rounded-md focus:ring-2 focus:ring-white focus:outline-none text-sm w-full"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                onKeyDown={handleStudentSearchKeyDown}
              />
              <button type="button" onClick={handleStudentSearchSubmit} className="absolute right-0 top-0 bottom-0 px-3 text-brand-primary-light hover:text-white">
                <SearchIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Find a class..."
                className="bg-brand-primary-dark placeholder-brand-primary-light/70 text-white px-3 py-1.5 rounded-md focus:ring-2 focus:ring-white focus:outline-none text-sm w-full"
                value={classSearchTerm}
                onChange={(e) => setClassSearchTerm(e.target.value)}
                onKeyDown={handleClassSearchKeyDown}
              />
              <button type="button" onClick={handleClassSearchSubmit} className="absolute right-0 top-0 bottom-0 px-3 text-brand-primary-light hover:text-white">
                <SearchIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center space-x-3 self-center md:self-auto mt-2 md:mt-0">
              <NavLink to="/settings" className="hover:text-brand-primary-light relative">
                <SettingsIcon className="w-5 h-5" />
              </NavLink>
              <div ref={notificationsRef} className="relative">
                <button onClick={toggleNotifications} className="hover:text-brand-primary-light relative" aria-label={`Notifications, ${unreadCount} unread`}>
                  <BellIcon className="w-5 h-5" />
                  {unreadCount > 0 && (
                     <span className="absolute -top-2 -right-2 flex items-center justify-center bg-brand-error text-xs font-semibold rounded-full h-5 w-5 text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                     </span>
                  )}
                </button>
                {isNotificationsOpen && <NotificationPanel onClose={() => setIsNotificationsOpen(false)} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
