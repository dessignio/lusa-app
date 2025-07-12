
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL } from '../constants';
import { Notification } from '../types';
import { showToast } from '../utils';

// This is an unauthenticated global declaration for the socket.io client
declare const io: any;

// Define a richer notification type from the server
interface ServerNotificationPayload {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// A mock user ID for this implementation
const MOCK_USER_ID = 'DANCERSTAR';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const addNotification = useCallback((payload: ServerNotificationPayload) => {
    const newNotification: Notification = {
      ...payload,
      id: uuidv4(),
      read: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    showToast(`${payload.title}: ${payload.message}`, payload.type);
  }, []);

  useEffect(() => {
    // Ensure io is defined (from the script tag)
    if (typeof io === 'undefined') {
        console.error("Socket.io client not found. Make sure the script is loaded.");
        return;
    }

    // Force polling to prevent WebSocket upgrade errors on some networks/proxies.
    const socket = io(API_BASE_URL, { transports: ['polling'] });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      // Register this client with a user ID
      socket.emit('register', MOCK_USER_ID);
    });

    socket.on('notification', (payload: ServerNotificationPayload) => {
      console.log('Received notification:', payload);
      addNotification(payload);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (err: Error) => {
        console.error('Socket connection error:', err.message);
    });
    
    // For demonstration: send a welcome notification
    setTimeout(() => addNotification({title: 'Welcome!', message: 'Notification system is active.', type: 'info'}), 2000);

    return () => {
      socket.disconnect();
    };
  }, [addNotification]);
  
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
      setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
