import React from 'react';
import { NavLink } from 'react-router-dom';
import { Notification } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
import { EnvelopeIcon, CheckCircleIcon, TrashIcon, InfoCircleIcon, ExclamationTriangleIcon } from './icons';

const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notifications, markAllAsRead, clearAll } = useNotifications();

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAll();
  }
  
  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  }

  const getIconForType = (type: Notification['type']) => {
    switch(type) {
      case 'success': return <CheckCircleIcon className="text-brand-success w-5 h-5"/>;
      case 'info': return <InfoCircleIcon className="text-brand-info w-5 h-5"/>;
      case 'warning': return <ExclamationTriangleIcon className="text-brand-warning w-5 h-5"/>;
      case 'error': return <ExclamationTriangleIcon className="text-brand-error w-5 h-5"/>;
      default: return <EnvelopeIcon className="text-brand-text-muted w-5 h-5"/>;
    }
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-brand-neutral-200 z-50 text-brand-text-primary">
        <div className="flex justify-between items-center p-3 border-b border-brand-neutral-200">
            <h4 className="font-semibold text-brand-text-primary">Notifications</h4>
            <div className="flex items-center space-x-2">
                 <button onClick={handleMarkAllRead} className="text-brand-text-muted hover:text-brand-primary" title="Mark all as read">
                    <CheckCircleIcon className="w-5 h-5"/>
                 </button>
                 <button onClick={handleClear} className="text-brand-text-muted hover:text-brand-error" title="Clear all notifications">
                    <TrashIcon className="w-5 h-5"/>
                 </button>
            </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
                <ul>
                    {notifications.map(n => (
                        <li key={n.id} className={`border-b border-brand-neutral-100 last:border-b-0 ${!n.read ? 'bg-brand-primary-light/10' : ''}`}>
                            <NavLink to={n.link || '#'} onClick={onClose} className="block p-3 hover:bg-brand-neutral-50 transition-colors">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-0.5">{getIconForType(n.type)}</div>
                                    <div>
                                        <p className="font-semibold text-sm">{n.title}</p>
                                        <p className="text-xs text-brand-text-secondary">{n.message}</p>
                                        <p className="text-xs text-brand-text-muted mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center p-8 text-sm text-brand-text-muted">
                    <EnvelopeIcon className="w-10 h-10 mx-auto mb-2"/>
                    You have no new notifications.
                </div>
            )}
        </div>
    </div>
  );
};

export default NotificationPanel;
