import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import FriendRequestActions from "./FriendRequestActions";

interface Notification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  created_at: string;
  actorId: string | null;
  friendshipId: string | null;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

const NotificationsPanel = ({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && userId) {
      fetchNotifications();
      const cleanup = subscribeToNotifications();
      return cleanup;
    }
  }, [open, userId]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Поддерживаем обе схемы БД: actor_id/data/is_read и related_user_id/content/read
      const rows = (data || []) as any[];
      const actorIds = [...new Set(
        rows.map((n) => n.actor_id || n.related_user_id).filter(Boolean)
      )] as string[];
      const profiles: Record<string, any> = {};
      if (actorIds.length) {
        const { data: pdata } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', actorIds);
        for (const p of pdata || []) profiles[p.id] = p;
      }

      const normalized: Notification[] = rows.map((n) => {
        const actorId = n.actor_id || n.related_user_id || null;
        const extra = typeof n.data === 'object' && n.data !== null ? n.data : {};
        return {
          id: n.id,
          type: n.type,
          content: n.content || extra.content || extra.text || '',
          read: n.is_read ?? n.read ?? false,
          created_at: n.created_at,
          actorId,
          friendshipId: n.related_item_id || extra.friendship_id || null,
          profile: actorId ? profiles[actorId] : undefined,
        };
      });
      setNotifications(normalized);
    } catch (error: any) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      let { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) {
        const fallback = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);
        if (fallback.error) throw fallback.error;
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error: any) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      let { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) {
        const fallback = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId)
          .eq('read', false);
        if (fallback.error) throw fallback.error;
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {notifications.some(n => !n.read) && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
          <SheetDescription>
            Stay updated with your activity
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg transition-colors ${
                    notification.read ? 'bg-card' : 'bg-accent/50'
                  } hover:bg-accent`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {notification.profile && (
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={notification.profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {notification.profile.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <p className="text-sm">
                          {notification.profile && (
                            <span className="font-semibold">@{notification.profile.username} </span>
                          )}
                          {notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {notification.type === 'friend_request' && notification.friendshipId && (
                        <FriendRequestActions
                          friendshipId={notification.friendshipId}
                          onAction={fetchNotifications}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsPanel;