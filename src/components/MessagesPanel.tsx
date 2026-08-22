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
import { MessageSquare } from "lucide-react";
import ChatWindow from "./ChatWindow";

interface Message {
  id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

const MessagesPanel = ({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
}) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<{ friendId: string; friendUsername: string; friendAvatar: string | null } | null>(null);

  useEffect(() => {
    if (open && userId) {
      fetchConversations();
      subscribeToMessages();
    }
  }, [open, userId]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group by sender
      const grouped = data?.reduce((acc: any, msg: any) => {
        const senderId = msg.sender.id;
        if (!acc[senderId]) {
          acc[senderId] = {
            sender: msg.sender,
            messages: [],
            unreadCount: 0,
          };
        }
        acc[senderId].messages.push(msg);
        if (!msg.read) acc[senderId].unreadCount++;
        return acc;
      }, {});

      setConversations(Object.values(grouped || {}));
    } catch (error: any) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Messages</SheetTitle>
          <SheetDescription>
            Your private conversations
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                    <div className="h-3 bg-muted animate-pulse rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No messages yet
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => {
                const latestMessage = conv.messages[0];
                return (
                  <div
                    key={conv.sender.id}
                    className="p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() =>
                      setSelectedChat({
                        friendId: conv.sender.id,
                        friendUsername: conv.sender.username,
                        friendAvatar: conv.sender.avatar_url,
                      })
                    }
                  >
                    <div className="flex gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conv.sender.avatar_url || undefined} />
                        <AvatarFallback>
                          {conv.sender.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm">{conv.sender.username}</p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {latestMessage.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(latestMessage.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
      {selectedChat && (
        <ChatWindow
          open={!!selectedChat}
          onClose={() => setSelectedChat(null)}
          friendId={selectedChat.friendId}
          friendUsername={selectedChat.friendUsername}
          friendAvatar={selectedChat.friendAvatar}
          currentUserId={userId}
        />
      )}
    </Sheet>
  );
};

export default MessagesPanel;