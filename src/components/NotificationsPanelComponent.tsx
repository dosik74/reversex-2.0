import { useState, useEffect } from "react";
import { X, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";

interface Notification {
  id: string;
  type: "friend_request" | "comment" | "message" | "like";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  sender_id?: string;
  sender_name?: string;
}

interface NotificationsPanelComponentProps {
  onClose: () => void;
}

const NotificationsPanelComponent = ({ onClose }: NotificationsPanelComponentProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setNotifications([]);
        return;
      }

      // Здесь можно добавить запрос к таблице notifications
      // Пока показываем демо уведомления
      const demoNotifications: Notification[] = [
        {
          id: "1",
          type: "friend_request",
          title: "Friend Request",
          description: "Someone sent you a friend request",
          timestamp: new Date().toISOString(),
          read: false,
          sender_name: "User123"
        }
      ];

      setNotifications(demoNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute right-0 top-16 w-96 bg-card border border-border rounded-lg shadow-2xl p-0 z-50 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  !notification.read ? "bg-muted/30" : ""
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.description}
                    </p>
                    {notification.sender_name && (
                      <p className="text-xs text-primary mt-1">
                        From: {notification.sender_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-border text-center">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            Mark all as read
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanelComponent;
