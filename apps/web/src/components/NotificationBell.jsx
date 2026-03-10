// src/components/NotificationBell.jsx

import { useContext, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { NotificationContext } from '../contexts/NotificationContext';
import NotificationPanel from './NotificationPanel';
import '../styles/notification-bell.css';

export default function NotificationBell() {
  const { unreadCount } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="notification-panel-backdrop"
            onClick={() => setIsOpen(false)}
          />
          <NotificationPanel onClose={() => setIsOpen(false)} />
        </>
      )}
    </div>
  );
}
