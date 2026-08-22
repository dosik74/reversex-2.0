import { useState, useEffect } from "react";
import { X, MessageSquare, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import supabase from "@/utils/supabase";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface MessagesPanelComponentProps {
  onClose: () => void;
}

const MessagesPanelComponent = ({ onClose }: MessagesPanelComponentProps) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setConversations([]);
        return;
      }

      // Здесь можно добавить запрос к таблице conversations
      // Пока показываем демо разговоры
      const demoConversations = [
        {
          id: "1",
          name: "User123",
          avatar: null,
          last_message: "Hey, how are you?",
          last_message_time: new Date().toISOString(),
          unread_count: 2
        }
      ];

      setConversations(demoConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    // Здесь загружаются сообщения для выбранного разговора
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Добавляем демо сообщение
      const message: Message = {
        id: Math.random().toString(),
        conversation_id: selectedConversation,
        sender_id: user.id,
        sender_name: "You",
        content: newMessage,
        timestamp: new Date().toISOString(),
        read: true
      };

      setMessages([...messages, message]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="absolute right-0 top-16 w-96 bg-card border border-border rounded-lg shadow-2xl p-0 z-50 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Messages</h3>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedConversation ? (
          // Conversations List
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading messages...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{conv.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Chat View
          <>
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setSelectedConversation(null);
                  setMessages([]);
                }}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
              <h4 className="font-medium text-sm">
                {conversations.find(c => c.id === selectedConversation)?.name}
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === "current" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        msg.sender_id === "current"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-border flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 h-8 text-sm"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="h-8 w-8"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesPanelComponent;
