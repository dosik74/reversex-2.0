import { useEffect, useRef, useState } from "react";
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
      .select("title, poster_url, status, release_year, genre, content_type")
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
      .select("id, title")
      .eq("user_id", userId)
      .limit(3),
  ]);

  const listIds = (listsRes.data || []).map((l: any) => l.id);
  const listItemsRes = listIds.length
    ? await supabase
        .from("top_list_items")
        .select("top_list_id, item_id, title, poster_url, metadata")
        .in("top_list_id", listIds)
        .order("rank", { ascending: true })
    : { data: [] as any[] };

  const p: any = profileRes.data || {};
  const media = (bookmarksRes.data || []).map((b: any, i: number) => ({
    title: b.title,
    year: Number(String(b.release_year || "0").slice(0, 4)) || 0,
    cat: TYPE_RU[b.content_type] || "Фильмы",
    status: STATUS_RU[b.status] || "Просмотрено",
    poster: b.poster_url || "",
    color: PALETTE[i % PALETTE.length],
    genre: b.genre || "",
  }));

  const topLists = (listsRes.data || []).map((l: any) => {
    const items = (listItemsRes.data || []).filter((it: any) => it.top_list_id === l.id);
    return {
      title: l.title,
      poster: items[0]?.poster_url || "",
      items: items.slice(0, 10).map((it: any) => ({
        id: it.item_id,
        title: it.title,
        poster: it.poster_url || (it.metadata as any)?.poster_url || "",
      })),
    };
  });

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
    topLists,
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

  // Команды из встроенного редактора
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const type = e.data?.type;
      if (type === "RX_NAV" && typeof e.data.path === "string") {
        window.location.href = e.data.path;
      } else if (type === "RX_SAVE") {
        void saveToServer();
      } else if (type === "RX_OPEN_TOP50") {
        window.location.href = "/tier-lists";
      } else if (type === "RX_SHARE") {
        navigator.clipboard?.writeText(window.location.href).then(() =>
          toast.success("Ссылка на профиль скопирована")
        );
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [saveToServer]);

  // Автосохранение каждые 12 секунд, пока открыт конструктор
  useEffect(() => {
    const timer = window.setInterval(() => {
      void saveToServer();
    }, 12000);
    return () => window.clearInterval(timer);
  }, [userId]);

  return (
    <div className="relative min-h-screen w-full bg-[#090a0f]">
      <iframe
        ref={iframeRef}
        src="/profile-studio.html"
        title="Конструктор профиля ReverseX"
        className="block w-full border-0 bg-[#090a0f]"
        style={{ minHeight: "calc(100vh - 70px)" }}
      />

    </div>
  );
};

export default ProfileStudioFrame;
