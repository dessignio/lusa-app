import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientUser, Student, AdminUserCredentials, ClientLoginResponse, ClientProfileResponse } from '../types';
import { clientLogin, getClientProfile } from '../services/apiService';

interface ClientAuthContextType {
  user: ClientUser | null;
  students: Student[];
  selectedStudent: Student | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: AdminUserCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  selectStudent: (studentId: string) => void;
  loadProfile: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export const ClientAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('clientAuthToken'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProfile = useCallback(async () => {
    if (!token) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const profileData = await getClientProfile();
      setUser(profileData.user);
      setStudents(profileData.students);

      const savedStudentId = localStorage.getItem('selectedStudentId');
      const studentToSelect = profileData.students.find(s => s.id === savedStudentId) || profileData.students[0];
      
      if (studentToSelect) {
        setSelectedStudent(studentToSelect);
        localStorage.setItem('selectedStudentId', studentToSelect.id);
      }

    } catch (error) {
      console.error("Failed to load client profile", error);
      // If token is invalid, log out
      setToken(null);
      localStorage.removeItem('clientAuthToken');
      localStorage.removeItem('selectedStudentId');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const login = useCallback(async (credentials: AdminUserCredentials): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const response = await clientLogin(credentials);
      if (response.access_token && response.profile) {
        setToken(response.access_token);
        setUser(response.profile.user);
        setStudents(response.profile.students);
        localStorage.setItem('clientAuthToken', response.access_token);

        if (response.profile.students.length === 1) {
            setSelectedStudent(response.profile.students[0]);
            localStorage.setItem('selectedStudentId', response.profile.students[0].id);
        } else {
            setSelectedStudent(null);
            localStorage.removeItem('selectedStudentId');
        }

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
    setStudents([]);
    setSelectedStudent(null);
    localStorage.removeItem('clientAuthToken');
    localStorage.removeItem('selectedStudentId');
    navigate('/portal/login');
  }, [navigate]);

  const selectStudent = useCallback((studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
        setSelectedStudent(student);
        localStorage.setItem('selectedStudentId', student.id);
        navigate('/portal/dashboard');
    }
  }, [students, navigate]);

  const memoedValue = useMemo(() => ({
    user,
    students,
    selectedStudent,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
    selectStudent,
    loadProfile,
  }), [user, students, selectedStudent, token, loading, login, logout, selectStudent, loadProfile]);

  return <ClientAuthContext.Provider value={memoedValue}>{children}</ClientAuthContext.Provider>;
};

export const useClientAuth = (): ClientAuthContextType => {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
};
