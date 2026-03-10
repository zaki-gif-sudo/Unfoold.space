// src/components/NotificationPanel.jsx

import { useContext, useCallback } from 'react';
import { Trash2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from '../contexts/NotificationContext';
import '../styles/notification-panel.css';

export default function NotificationPanel({ onClose }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead } =
    useContext(NotificationContext);

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.url) {
      navigate(notification.url);
      onClose?.();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button className="mark-all-read-btn" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-content">
                <div className="notification-title-area">
                  <h4 className="notification-title">{notification.title}</h4>
                  {!notification.is_read && <span className="unread-indicator" />}
                </div>
                {notification.body && (
                  <p className="notification-body">{notification.body}</p>
                )}
                <time className="notification-time">
                  {formatTime(notification.created_at)}
                </time>
              </div>
              <div className="notification-actions">
                {!notification.is_read && (
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  className="action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
