import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils';

// Declare io to be globally available from the script tag in index.html
declare const io: any;


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar on route change (for mobile)
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  
  useEffect(() => {
    // Only establish socket connection if user is authenticated and io is available
    if (!user || typeof io === 'undefined') {
      return;
    }

    const socket = io(API_BASE_URL, { transports: ['polling'] });

    socket.on('connect', () => {
      console.log('Socket connected for real-time updates:', socket.id);
      socket.emit('register', user.id);
    });

    socket.on('data:update', ({ entity, payload }: { entity: string, payload: any }) => {
      console.log(`Received data update for entity: '${entity}'`, payload);
      showToast(`Data for '${entity}' has changed. Refreshing relevant data...`, 'info', 2500);
      // Dispatch a global event that components can listen to
      window.dispatchEvent(new CustomEvent('datachange', { detail: { entity, payload } }));
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected.');
    });

    socket.on('connect_error', (err: Error) => {
        console.error('Socket connection error for layout:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);


  return (
    <div className="flex flex-col h-screen bg-brand-body-bg font-sans">
      <Header onMenuButtonClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-45 bg-black/50 md:hidden" // Changed z-30 to z-45
            onClick={toggleSidebar}
            aria-hidden="true"
          ></div>
        )}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
