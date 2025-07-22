import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminUser, AdminUserCredentials, LoginResponse, PermissionKey } from '../types';
import { loginUser } from '../services/apiService';

// Helper function to safely parse JSON from localStorage
function getStoredJSON(key: string) {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) return null;
    try {
        return JSON.parse(storedValue);
    } catch (error) {
        console.error(`Failed to parse ${key} from localStorage`, error);
        return null;
    }
}

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
  // ✅ AJUSTE CLAVE: Se inicializa el estado de forma síncrona desde localStorage.
  // Esto elimina el useEffect y la condición de carrera (race condition).
  const [user, setUser] = useState<AdminUser | null>(() => getStoredJSON('authUser'));
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [permissions, setPermissions] = useState<Set<PermissionKey>>(() => new Set(getStoredJSON('authPermissions')));
  
  // 'loading' ahora solo se usa para el proceso de login, no para la carga inicial.
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();

  // El useEffect para cargar desde localStorage ya no es necesario.

  const login = useCallback(async (credentials: AdminUserCredentials): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        try {
          const response: LoginResponse = await loginUser(credentials);

          // ✅ PUNTO DE INSPECCIÓN CRÍTICO:
          // Añade estas dos líneas para ver los datos crudos.
          console.log("Respuesta DIRECTA de la función loginUser:", response);
          console.log("Objeto 'user' DENTRO de la respuesta:", response.user);
          
          if (response.access_token && response.user && response.permissions) {
            // Guardar en localStorage PRIMERO
            localStorage.setItem('authToken', response.access_token);
            localStorage.setItem('authUser', JSON.stringify(response.user));
            localStorage.setItem('authPermissions', JSON.stringify(Array.from(response.permissions)));

            // Actualizar el estado DESPUÉS
            setToken(response.access_token);
            setUser(response.user);
            setPermissions(new Set(response.permissions));
            
            setLoading(false);
            return { success: true };
          }
          setLoading(false);
          return { success: false, error: 'Invalid response from server.' };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          setLoading(false);
          return { success: false, error: errorMessage };
        }
      }, []);

  const logout = useCallback(() => {
    // Limpiar el estado PRIMERO
    setUser(null);
    setToken(null);
    setPermissions(new Set());

    // Limpiar localStorage DESPUÉS
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('authPermissions');
    navigate('/login');
  }, [navigate]);

  const hasPermission = useCallback((requiredPermissions: PermissionKey | PermissionKey[]) => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    if (permissions.has('manage_roles_permissions')) return true;
    return required.some(p => permissions.has(p));
  }, [permissions]);

  const value = useMemo(() => ({
    user,
    token,
    permissions,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
    hasPermission,
  }), [user, token, permissions, loading, login, logout, hasPermission]);


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};