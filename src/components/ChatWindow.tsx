import { useState, useEffect, useRef } from "react";
import supabase from "@/utils/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Loader2, X, File, AlertCircle } from "lucide-react";

interface ChatWindowProps {
  open: boolean;
  onClose: () => void;
  friendId: string;
  friendUsername: string;
  friendAvatar: string | null;
  currentUserId: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  sender: {
    username: string;
    avatar_url: string | null;
  };
}

const ChatWindow = ({
  open,
  onClose,
  friendId,
  friendUsername,
  friendAvatar,
  currentUserId,
}: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    if (open) {
      fetchMessages();
      const subscription = supabase
        .channel(`chat_${currentUserId}_${friendId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [open, friendId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          sender_id,
          receiver_id,
          content,
          file_url,
          file_name,
          created_at,
          sender:profiles(username, avatar_url)
        `
        )
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Файл слишком большой. Максимум 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-files")
        .getPublicUrl(fileName);

      await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: friendId,
        content: `📎 Отправил файл`,
        file_url: publicUrl,
        file_name: file.name,
      });

      toast.success("Файл отправлен");
      fetchMessages();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка загрузки файла");
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: friendId,
        content: messageText.trim(),
      });

      if (error) throw error;
      setMessageText("");
      fetchMessages();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ошибка отправки сообщения");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img
              src={friendAvatar || ""}
              alt={friendUsername}
              className="w-8 h-8 rounded-full object-cover"
            />
            {friendUsername}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              <p>Нет сообщений. Начни разговор!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-secondary text-secondary-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>

                    {message.file_url && (
                      <a
                        href={message.file_url}
                        download={message.file_name}
                        className="mt-2 flex items-center gap-2 text-xs hover:underline"
                      >
                        <File className="w-4 h-4" />
                        {message.file_name}
                      </a>
                    )}

                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t pt-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 mb-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">Максимум файла: 5MB</p>
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="file"
              id="file-input"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("file-input")?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <File className="w-4 h-4" />
              )}
            </Button>

            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Напиши сообщение..."
              disabled={sending}
            />

            <Button type="submit" disabled={sending || !messageText.trim()} size="sm">
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatWindow;