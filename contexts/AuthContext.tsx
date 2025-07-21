import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminUser, AdminUserCredentials, LoginResponse, PermissionKey } from '../types';
import { loginUser } from '../services/apiService';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  permissions: Set<PermissionKey>;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: AdminUserCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (requiredPermissions: PermissionKey | PermissionKey[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Set<PermissionKey>>(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        const storedPermissions = localStorage.getItem('authPermissions');
        
        console.log("AuthContext: Stored user from localStorage:", storedUser); // NEW LOG

        if (storedToken && storedUser && storedPermissions) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
            setPermissions(new Set(JSON.parse(storedPermissions)));
        }
    } catch (error) {
        console.error("Failed to parse auth data from localStorage", error);
        // Clear broken storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('authPermissions');
    } finally {
        setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: AdminUserCredentials): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        try {
          const response: LoginResponse = await loginUser(credentials);
          console.log("AuthContext: Login response user object:", response.user); // NEW LOG
          if (response.access_token && response.user && response.permissions) {
            setToken(response.access_token);
            setUser(response.user);
            setPermissions(new Set(response.permissions));
            
            localStorage.setItem('authToken', response.access_token);
            localStorage.setItem('authUser', JSON.stringify(response.user));
            localStorage.setItem('authPermissions', JSON.stringify(response.permissions));

            return { success: true };
          }
          return { success: false, error: 'Invalid response from server.' };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
      }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setPermissions(new Set());
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('authPermissions');
    navigate('/login');
  }, [navigate]);

  const hasPermission = useCallback((requiredPermissions: PermissionKey | PermissionKey[]) => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No specific permission needed
    }

    const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    // An admin with 'manage_roles_permissions' can do anything.
    if (permissions.has('manage_roles_permissions')) {
        return true;
    }

    return required.some(p => permissions.has(p));
  }, [permissions]);


  const value = {
    user,
    token,
    permissions,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
