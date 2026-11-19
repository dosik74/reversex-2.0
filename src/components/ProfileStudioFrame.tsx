import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Sparkles, Bookmark, Users } from "lucide-react";
import { toast } from "sonner";
import supabase from "@/lib/supabase";

const STORAGE_KEY = "reversex_profile_studio_v2";

type Props = {
  userId: string;
  onExit: () => void;
};

const STATUS_RU: Record<string, string> = {
  watched: "Просмотрено",
  watching: "Смотрю",
  planned: "В планах",
  postponed: "Отложено",
  dropped: "Брошено",
  favorite: "Избранное",
};

const TYPE_RU: Record<string, string> = {
  movie: "Фильмы",
  series: "Сериалы",
  game: "Игры",
  anime: "Аниме",
};

const PALETTE = ["#14b8a6", "#0ea5e9", "#ec4899", "#f59e0b", "#ef4444", "#22c55e", "#eab308", "#8b5cf6"];

/** Реальные данные профиля: аватар, статистика, закладки, друзья, списки */
async function loadProfileData(userId: string) {
  const [profileRes, bookmarksRes, friendsRes, followingRes, commentsRes, listsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url, about_me, bio, level, xp")
      .eq("id", userId)
      .single(),
    supabase
      .from("content_bookmarks")
      .select("title, external_rating, status, release_year, genre, content_type")
      .eq("user_id", userId)
      .limit(60),
    supabase
      .from("friendships")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", userId),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId),
    supabase
      .from("top_lists")
      .select("title")
      .eq("user_id", userId)
      .limit(3),
  ]);

  const p: any = profileRes.data || {};
  const media = (bookmarksRes.data || []).map((b: any, i: number) => ({
    title: b.title,
    year: Number(String(b.release_year || "0").slice(0, 4)) || 0,
    cat: TYPE_RU[b.content_type] || "Фильмы",
    status: STATUS_RU[b.status] || "Просмотрено",
    rating: Number(b.external_rating || 0),
    color: PALETTE[i % PALETTE.length],
    genre: b.genre || "",
  }));

  return {
    username: p.username || "user",
    display_name: p.display_name || p.username || "USER",
    avatar_url: p.avatar_url || null,
    bio: p.about_me || p.bio || "",
    level: p.level ?? 1,
    xp: p.xp ?? 0,
    stats: {
      bookmarks: bookmarksRes.data?.length || 0,
      followers: 0,
      following: followingRes.count || 0,
      comments: commentsRes.count || 0,
    },
    friendsCount: friendsRes.count || 0,
    media,
    topLists: listsRes.data || [],
  };
}

/**
 * Встраиваемый в профиль конструктор.
 *
 * Внутри — оригинальный движок reversex_profile_studio.html:
 * ▶ 3 режима (Блоки / Детали внутри / Текст)
 * ▶ перетаскивание ЛЮБОГО блока и каждой внутренней детали
 * ▶ 8 ручек ресайза, размеры до 2000px, привязка к сетке 8px
 * ▶ закрепление к экрану, Z-слои, вращение, скругление, прозрачность
 * ▶ фоны (цвет/картинка/аватарка) с blur/dim/zoom
 * ▶ 18 кириллических шрифтов, inline-форматирование текста
 * ▶ добавление новых блоков и кнопок, Undo, JSON, сброс
 *
 * Настройки НЕ остаются в localStorage: при открытии подтягиваются
 * с сервера (profiles.customization -> studio), а кнопка «Сохранить»
 * и автосохранение пишут результат обратно в Supabase.
 */
const ProfileStudioFrame = ({ userId, onExit }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stage = useRef<"load-studio" | "inject-data" | "done">("load-studio");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = async () => {
      const win = iframe.contentWindow;
      if (!win) return;

      if (stage.current === "load-studio") {
        stage.current = "inject-data";
        try {
          const { data } = await supabase
            .from("profiles")
            .select("customization")
            .eq("id", userId)
            .single();
          const studio = (data?.customization as any)?.studio;
          if (studio) {
            win.localStorage.setItem(STORAGE_KEY, JSON.stringify(studio));
            setLastSaved(new Date().toISOString());
          } else {
            win.localStorage.removeItem(STORAGE_KEY);
          }
        } catch (e) {
          console.error("Studio settings load error:", e);
        }
        win.location.reload();
        return;
      }

      if (stage.current === "inject-data") {
        stage.current = "done";
        try {
          const payload = await loadProfileData(userId);
          win.postMessage({ type: "RX_PROFILE_DATA", payload }, "*");
        } catch (e) {
          console.error("Profile data load error:", e);
        }
      }
    };

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [userId]);

  const saveToServer = async () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    setSaving(true);
    try {
      const raw = win.localStorage.getItem(STORAGE_KEY);
      const studio = raw ? JSON.parse(raw) : null;

      const { data: row } = await supabase
        .from("profiles")
        .select("customization")
        .eq("id", userId)
        .single();
      const customization = ((row?.customization as any) || {}) as Record<string, any>;
      if (studio) customization.studio = studio;
      else delete customization.studio;

      const { error } = await supabase
        .from("profiles")
        .update({ customization })
        .eq("id", userId);
      if (error) throw error;
      setLastSaved(new Date().toISOString());
      toast.success("Профиль сохранён на сервере");
    } catch (e: any) {
      toast.error("Ошибка сохранения: " + (e?.message || "неизвестная"));
    } finally {
      setSaving(false);
    }
  };

  // Автосохранение каждые 12 секунд, пока открыт конструктор
  useEffect(() => {
    const timer = window.setInterval(() => {
      void saveToServer();
    }, 12000);
    return () => window.clearInterval(timer);
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col bg-[#090a0f]">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0b0d13] px-4">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Назад в профиль
        </button>
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" />
          Полный контроль над профилем
        </span>
        <Link
          to="/bookmarks"
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-white/10"
        >
          <Bookmark className="h-3.5 w-3.5" /> Закладки
        </Link>
        <Link
          to="/friends"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-white/10"
        >
          <Users className="h-3.5 w-3.5" /> Друзья
        </Link>
        <span className="hidden text-[11px] text-zinc-500 lg:block">
          {lastSaved ? `Сохранено: ${new Date(lastSaved).toLocaleTimeString("ru-RU")}` : "Есть несохранённые изменения"}
        </span>
        <button
          onClick={saveToServer}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-[#04161c] hover:bg-cyan-300 disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Сохраняем..." : "Сохранить на сервере"}
        </button>
      </div>

      <iframe
        ref={iframeRef}
        src="/profile-studio.html"
        title="Конструктор профиля ReverseX"
        className="min-h-0 w-full flex-1 border-0 bg-[#090a0f]"
      />
    </div>
  );
};

export default ProfileStudioFrame;
