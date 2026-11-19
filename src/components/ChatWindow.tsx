import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  Smile,
  Image as ImageIcon,
  Mic,
  Square,
  Film,
  List,
  X,
  Gift,
  Search,
  Play,
  ChevronRight,
} from "lucide-react";
import { searchMovies, searchSeries, getMoviePosterUrl } from "@/utils/tmdbApi";
import { fetchRawg, RAWG_API_KEY } from "@/utils/rawgApi";

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
  is_read: boolean;
  created_at: string;
  sender: { username: string; avatar_url: string | null } | null;
}

type Rich = { kind: string; [key: string]: any };

const PREFIX = "RXMSG:";
const encodeRich = (payload: Rich) => PREFIX + JSON.stringify(payload);
const decodeRich = (content: string | null): Rich | null => {
  if (!content?.startsWith(PREFIX)) return null;
  try {
    return JSON.parse(content.slice(PREFIX.length));
  } catch {
    return null;
  }
};

const EMOJIS = [
  "😀", "😂", "🥹", "😍", "🥰", "😎", "🤩", "😭", "😡", "🤯",
  "👍", "👎", "👏", "🙌", "🤝", "💪", "🔥", "✨", "💯", "❤️",
  "🎬", "🍿", "🎮", "🏆", "⭐", "🎉", "👀", "🚀", "💡", "☕",
];
const STICKERS = ["😀", "😂", "😍", "😎", "🥳", "😭", "😡", "🤯", "🫡", "🤔", "🙃", "🥺", "😴", "🤗", "👻", "💀", "🐱", "🐶", "🍕", "⚽", "🎬", "🎮", "🔥", "✨"];
const GIFS = [
  "https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif",
  "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
  "https://media.giphy.com/media/l0HlE5Q7MFOl6xceQ/giphy.gif",
  "https://media.giphy.com/media/5yLgoc7N67J6M/giphy.gif",
  "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
  "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif",
];

const CONTENT_PATH: Record<string, string> = {
  movie_link: "/movie/",
  series_link: "/series/",
  game_link: "/game/",
};

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
  const [panel, setPanel] = useState<"emoji" | "sticker" | "gif" | "attach" | null>(null);
  const [attachTab, setAttachTab] = useState<"movie" | "series" | "game" | "lists">("movie");
  const [attachQuery, setAttachQuery] = useState("");
  const [attachResults, setAttachResults] = useState<any[]>([]);
  const [myLists, setMyLists] = useState<any[]>([]);
  const [searchingContent, setSearchingContent] = useState(false);
  const [recording, setRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const fetchMessages = async () => {
    try {
      const pairFilter = `and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`;
      const selectBase = `id, sender_id, receiver_id, content, created_at,
           sender:profiles(username, avatar_url)`;

      let result = await supabase
        .from("messages")
        .select(`${selectBase}, is_read`)
        .or(pairFilter)
        .order("created_at", { ascending: true });

      // fallback для альтернативной схемы БД, где колонка называется read
      if (result.error?.code === "42703") {
        result = await supabase
          .from("messages")
          .select(`${selectBase}, read`)
          .or(pairFilter)
          .order("created_at", { ascending: true });
      }
      if (result.error) throw result.error;

      setMessages((result.data || []) as unknown as Message[]);
      const readKey = result.data?.some((m: any) => "is_read" in m) ? "is_read" : "read";
      await supabase
        .from("messages")
        .update({ [readKey]: true })
        .eq("sender_id", friendId)
        .eq("receiver_id", currentUserId)
        .eq(readKey, false);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchMessages();

    const channel = supabase
      .channel(`chat_${[currentUserId, friendId].sort().join("_")}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, friendId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendRich = async (payload: Rich) => {
    const { error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: friendId,
      content: encodeRich(payload),
    });
    if (error) throw error;
    setPanel(null);
    fetchMessages();
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: friendId,
        content: text,
      });
      if (error) throw error;
      setMessageText("");
      fetchMessages();
    } catch {
      toast.error("Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  const uploadAndSend = async (blob: Blob, ext: string, payload: Omit<Rich, "url">) => {
    setUploading(true);
    try {
      const path = `${currentUserId}/chat/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-media")
        .upload(path, blob, { contentType: blob.type || "application/octet-stream", upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
      await sendRich({ ...payload, url: data.publicUrl });
    } catch (err) {
      console.error(err);
      toast.error("Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
  };

  const handleImage = (file: File) => {
    if (file.size > 20 * 1024 * 1024) return toast.error("Файл слишком большой (макс. 20 МБ)");
    const ext = file.name.split(".").pop() || "png";
    uploadAndSend(file, ext, { kind: "image", name: file.name });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size) uploadAndSend(blob, "webm", { kind: "voice", duration: 0 });
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error("Нет доступа к микрофону");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const loadLists = async () => {
    const { data: lists } = await supabase
      .from("top_lists")
      .select("id, title, media_type")
      .eq("user_id", currentUserId);
    const ids = (lists || []).map((l: any) => l.id);
    if (!ids.length) return setMyLists([]);
    const { data: items } = await supabase
      .from("top_list_items")
      .select("id, top_list_id, item_id, title, poster_url")
      .in("top_list_id", ids)
      .order("rank", { ascending: true });
    setMyLists(
      (lists || []).map((l: any) => ({
        ...l,
        items: (items || []).filter((i: any) => i.top_list_id === l.id).slice(0, 6),
      }))
    );
  };

  useEffect(() => {
    if (panel !== "attach") return;
    if (attachTab === "lists") loadLists();
    else setAttachResults([]);
  }, [panel, attachTab]);

  const searchContent = async () => {
    const q = attachQuery.trim();
    if (!q) return;
    setSearchingContent(true);
    try {
      if (attachTab === "movie") {
        const { movies } = await searchMovies(q);
        setAttachResults(
          movies.map((m: any) => ({
            id: m.id,
            title: m.title || m.name,
            poster: getMoviePosterUrl(m.poster_path),
            year: (m.release_date || m.first_air_date || "").slice(0, 4),
            rating: m.vote_average,
          }))
        );
      } else if (attachTab === "series") {
        const { results } = await searchSeries(q);
        setAttachResults(
          results.map((s: any) => ({
            id: s.id,
            title: s.name || s.title,
            poster: getMoviePosterUrl(s.poster_path),
            year: (s.first_air_date || "").slice(0, 4),
            rating: s.vote_average,
          }))
        );
      } else {
        const data = await fetchRawg(
          `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(q)}&page_size=8`
        );
        setAttachResults(
          (data?.results || []).map((g: any) => ({
            id: g.id,
            title: g.name,
            poster: g.background_image || "",
            year: (g.released || "").slice(0, 4),
            rating: g.rating,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Поиск не удался");
    } finally {
      setSearchingContent(false);
    }
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  const renderMessage = (message: Message) => {
    const rich = decodeRich(message.content);
    if (!rich) {
      return <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>;
    }
    switch (rich.kind) {
      case "image":
        return (
          <div className="space-y-1">
            <img src={rich.url} alt={rich.name || "Фото"} className="max-h-64 max-w-full rounded-lg object-cover" />
            {rich.name && <p className="text-[11px] opacity-70">{rich.name}</p>}
          </div>
        );
      case "voice":
        return (
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            <audio controls src={rich.url} className="w-52 h-8" />
          </div>
        );
      case "sticker":
        return <div className="text-5xl leading-none py-1">{rich.emoji}</div>;
      case "movie_link":
      case "series_link":
      case "game_link": {
        const path = CONTENT_PATH[rich.kind];
        return (
          <Link to={`${path}${rich.id}`} className="flex items-center gap-3 rounded-xl bg-black/30 p-2 hover:bg-black/50 transition-colors">
            {rich.poster && <img src={rich.poster} alt="" className="w-12 h-16 object-cover rounded-md" />}
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{rich.title}</p>
              <p className="text-xs opacity-70">
                {rich.kind === "movie_link" ? "Фильм" : rich.kind === "series_link" ? "Сериал" : "Игра"}
                {rich.year ? ` · ${rich.year}` : ""}
              </p>
              <span className="text-xs text-cyan-300 inline-flex items-center gap-1 mt-1">
                Открыть <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        );
      }
      case "list_share":
        return (
          <div className="rounded-xl bg-black/30 p-3 min-w-[200px]">
            <p className="text-sm font-bold mb-1">📋 {rich.title}</p>
            <div className="space-y-1">
              {(rich.items || []).map((item: any, i: number) => (
                <Link
                  key={i}
                  to={`/${item.mediaType === "series" || item.mediaType === "anime" ? "series" : item.mediaType === "game" ? "game" : "movie"}/${item.id}`}
                  className="flex items-center gap-2 text-xs hover:text-cyan-300"
                >
                  <span className="opacity-60">{i + 1}.</span>
                  <span className="truncate">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      default:
        return <p className="text-sm break-words">{rich.name || rich.kind}</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl h-[680px] max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="px-5 py-4 border-b border-white/10">
          <DialogTitle className="flex items-center gap-3">
            <img
              src={friendAvatar || ""}
              alt={friendUsername}
              className="w-9 h-9 rounded-full object-cover bg-zinc-800"
            />
            <span className="bk-benzin text-lg">{friendUsername}</span>
            <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> онлайн
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Личная переписка с {friendUsername}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4 bg-zinc-950/60">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-zinc-500">
              <p>Нет сообщений. Начни разговор!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === currentUserId;
              return (
                <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] px-3 py-2 rounded-2xl ${
                      isOwn
                        ? "bg-cyan-600/80 text-white rounded-br-sm"
                        : "bg-white/10 text-white rounded-bl-sm"
                    }`}
                  >
                    {renderMessage(message)}
                    <p className="text-[10px] opacity-60 mt-1 text-right">
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {panel && (
          <div className="border-t border-white/10 bg-zinc-900/95 p-3 max-h-56 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="bk-eyebrow text-zinc-400">
                {panel === "emoji" ? "Эмодзи" : panel === "sticker" ? "Стикеры" : panel === "gif" ? "GIF" : "Прикрепить"}
              </span>
              <button onClick={() => setPanel(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {panel === "emoji" && (
              <div className="grid grid-cols-10 gap-1">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setMessageText((t) => t + e)} className="text-xl rounded hover:bg-white/10 p-1">
                    {e}
                  </button>
                ))}
              </div>
            )}

            {panel === "sticker" && (
              <div className="grid grid-cols-8 gap-1">
                {STICKERS.map((e) => (
                  <button
                    key={e}
                    onClick={() => sendRich({ kind: "sticker", emoji: e })}
                    className="text-3xl rounded-lg hover:bg-white/10 p-1"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            {panel === "gif" && (
              <div className="grid grid-cols-3 gap-2">
                {GIFS.map((url) => (
                  <button key={url} onClick={() => sendRich({ kind: "image", url, name: "GIF" })} className="rounded-lg overflow-hidden h-20 hover:opacity-80">
                    <img src={url} alt="GIF" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {panel === "attach" && (
              <div className="space-y-3">
                <div className="flex gap-1 flex-wrap">
                  {(["movie", "series", "game", "lists"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAttachTab(t)}
                      className={`bk-benzin px-3 py-1.5 rounded-full text-xs ${
                        attachTab === t ? "bg-white text-black" : "bg-white/10 text-zinc-300"
                      }`}
                    >
                      {t === "movie" ? "Фильм" : t === "series" ? "Сериал" : t === "game" ? "Игра" : "Мои списки"}
                    </button>
                  ))}
                </div>

                {attachTab === "lists" ? (
                  <div className="space-y-2">
                    {myLists.length === 0 && <p className="text-xs text-zinc-500">У тебя пока нет списков</p>}
                    {myLists.map((list: any) => (
                      <button
                        key={list.id}
                        onClick={() =>
                          sendRich({
                            kind: "list_share",
                            title: list.title,
                            items: (list.items || []).map((i: any) => ({
                              id: i.item_id,
                              title: i.title,
                              mediaType: list.media_type,
                            })),
                          })
                        }
                        className="flex items-center justify-between w-full rounded-xl bg-white/5 hover:bg-white/10 px-3 py-2 text-sm"
                      >
                        <span className="truncate">{list.title}</span>
                        <span className="text-xs text-cyan-300">{list.items?.length || 0} шт.</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={attachQuery}
                        onChange={(e) => setAttachQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchContent()}
                        placeholder="Название фильма, сериала или игры..."
                        className="rounded-full h-9 bg-black/40"
                      />
                      <Button onClick={searchContent} size="sm" disabled={searchingContent} className="rounded-full">
                        {searchingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {attachResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={() =>
                            sendRich({
                              kind: attachTab === "movie" ? "movie_link" : attachTab === "series" ? "series_link" : "game_link",
                              id: item.id,
                              title: item.title,
                              poster: item.poster,
                              year: item.year,
                            })
                          }
                          className="flex items-center gap-2 w-full rounded-xl bg-white/5 hover:bg-white/10 p-2 text-left"
                        >
                          {item.poster && <img src={item.poster} alt="" className="w-8 h-11 object-cover rounded" />}
                          <span className="text-sm truncate">{item.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-white/10 p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImage(file);
              e.target.value = "";
            }}
          />
          <div className="flex items-center gap-1 mb-2">
            <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => setPanel(panel === "emoji" ? null : "emoji")} title="Эмодзи">
              <Smile className="w-5 h-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => setPanel(panel === "sticker" ? null : "sticker")} title="Стикеры">
              <Gift className="w-5 h-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => setPanel(panel === "gif" ? null : "gif")} title="GIF">
              <Play className="w-5 h-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => fileInputRef.current?.click()} title="Фото" disabled={uploading}>
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={recording ? stopRecording : startRecording} title={recording ? "Остановить запись" : "Голосовое"} disabled={uploading}>
              {recording ? <Square className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => setPanel(panel === "attach" ? null : "attach")} title="Фильм / список">
              {attachTab === "lists" ? <List className="w-5 h-5" /> : <Film className="w-5 h-5" />}
            </Button>
            {recording && <span className="text-xs text-rose-400 animate-pulse">Идёт запись...</span>}
            {uploading && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
          </div>

          <form onSubmit={handleSendText} className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Напиши сообщение..."
              disabled={sending}
              className="rounded-full bg-black/40"
            />
            <Button type="submit" disabled={sending || !messageText.trim()} size="icon" className="rounded-full">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatWindow;
