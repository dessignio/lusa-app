import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalSidebar from '../../components/portal/PortalSidebar';
import { useClientAuth } from '../../contexts/ClientAuthContext';

interface PortalLayoutProps {
  children: React.ReactNode;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, students, selectedStudent, loading } = useClientAuth();

  useEffect(() => {
    // On mount or when auth state changes, check if student selection is needed.
    if (!loading && user) {
        if (user.userType === 'parent' && students.length > 1 && !selectedStudent) {
            // If parent has multiple students but none is selected, force selection.
            if(location.pathname !== '/portal/select-student') {
               navigate('/portal/select-student', { replace: true });
            }
        } else if (location.pathname === '/portal/select-student' && selectedStudent) {
            // If a student is selected but user is on selector page, redirect to dashboard.
            navigate('/portal/dashboard', { replace: true });
        }
    }
  }, [user, students, selectedStudent, loading, navigate, location.pathname]);


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  if (loading) {
      return <div>Loading Profile...</div>
  }
  
  // If redirection to selector is needed, render a minimal layout or nothing until redirect happens
  if (user?.userType === 'parent' && students.length > 1 && !selectedStudent) {
      if(location.pathname === '/portal/select-student') {
          return <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">{children}</main>;
      }
      return <div>Redirecting to student selection...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-brand-body-bg font-sans">
      <PortalHeader onMenuButtonClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 overflow-hidden">
        <PortalSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-45 bg-black/50 md:hidden"
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

export default PortalLayout;
