import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export type NotificationType = 'error' | 'success';

interface NotificationProps {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  isVisible,
  onClose,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div
        className={`flex items-center gap-2 p-4 rounded-lg shadow-lg border ${
          type === 'error'
            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
        }`}
      >
        {type === 'error' ? (
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
        )}
        <p
          className={`text-sm font-medium ${
            type === 'error'
              ? 'text-red-800 dark:text-red-200'
              : 'text-green-800 dark:text-green-200'
          }`}
        >
          {message}
        </p>
      </div>
    </div>
  );
};