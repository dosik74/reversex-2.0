import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Move, MousePointer2, Type, Plus, Undo2, Save, FileJson, RotateCcw, Check,
  CaseSensitive, Pencil, Grid2X2, X, Settings2, Image as ImageIcon, Sparkles, ChevronUp, ChevronDown, Trash2,
  Bookmark, Users, UserPlus, MessageSquare, Eye, EyeOff, Layers, Link2, Video, Star, Trophy, Upload, Loader2, GripVertical, Send, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import supabase from "@/lib/supabase";
import { loadUserRatedItems } from "@/services/ratedService";
import { FONTS, MOBILE_CANVAS_WIDTH, defaultBg, defaultPageBg, defaultPart, emptyData, emptyMobileConfig, getDefaultBlocks, getDefaultMobileBlocks, normalizeData, normalizeVariant } from "./defaults";
import type { Block, EditorMode, PartCfg, StudioData, StudioProfile, StudioVariantConfig, StudioWallComment } from "./types";
import "./studio.css";

const STATUS_PILLS = ["Смотрю", "В планах", "Просмотрено", "Отложено", "Брошено", "Избранное"];
const STAT_LABELS = ["ЗАКЛАДКИ", "ПОДПИСЧИКИ", "ПОДПИСКИ", "КОММЕНТАРИИ"];
const modeLabels: Record<EditorMode, string> = { blocks: "Перемещение блоков", parts: "Редактирование деталей", text: "Редактирование текста" };
const DIRS = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;

const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const TYPE_RU: Record<string, string> = { movie: "Фильмы", series: "Сериалы", game: "Игры", anime: "Аниме" };
const STATUS_RU: Record<string, string> = {
  watched: "Просмотрено", watching: "Смотрю", planned: "В планах",
  postponed: "Отложено", dropped: "Брошено", favorite: "Избранное",
};

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  about_me?: string | null;
  bio: string | null;
  level: number;
  xp: number;
  customization?: { studio?: unknown } | null;
}

function getMediaPath(contentType?: string, id?: string): string {
  if (!id) return "#";
  if (contentType === "series") return `/series/${id}`;
  if (contentType === "game") return `/game/${id}`;
  return `/movie/${id}`;
}

async function loadProfile(row: ProfileRow): Promise<StudioProfile> {
  const userId = row.id;
  const [bm, friends, followers, following, titleCommentsRes, wallCommentsRes, lists, ratedItems] = await Promise.all([
    supabase
      .from("content_bookmarks")
      .select("content_id,title,poster_url,status,release_year,genre,content_type,user_rating,external_rating")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(120),
    supabase.from("friendships").select("id", { count: "exact", head: true }).eq("status", "accepted").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
    supabase.from("comments").select("id,movie_id,content,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
    supabase
      .from("profile_comments")
      .select("id,content,created_at,author_id,author:profiles(username,display_name,avatar_url)")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("top_lists").select("id,title,media_type").eq("user_id", userId).limit(3),
    loadUserRatedItems(userId).catch(() => []),
  ]);

  const listIds = (lists.data || []).map((l: any) => l.id);
  const itemsRes = listIds.length
    ? await supabase.from("top_list_items").select("top_list_id,item_id,title,poster_url,metadata").in("top_list_id", listIds).order("rank", { ascending: true })
    : { data: [] as any[] };
  const palette = ["#14b8a6", "#0ea5e9", "#ec4899", "#f59e0b", "#ef4444", "#22c55e", "#eab308", "#8b5cf6"];

  const bmRows = (bm.data || []) as any[];
  const statusCounts: Record<string, number> = {
    "Смотрю": 0,
    "В планах": 0,
    "Просмотрено": 0,
    "Отложено": 0,
    "Брошено": 0,
    "Избранное": 0,
  };
  const media = bmRows.map((b: any, i: number) => {
    const statusLabel = STATUS_RU[b.status] || "Просмотрено";
    statusCounts[statusLabel] = (statusCounts[statusLabel] || 0) + 1;
    return {
      id: String(b.content_id || ""),
      contentType: b.content_type || "movie",
      title: b.title,
      year: Number(String(b.release_year || "0").slice(0, 4)) || 0,
      cat: TYPE_RU[b.content_type] || "Фильмы",
      status: statusLabel,
      poster: b.poster_url || "",
      genre: b.genre || "",
      color: palette[i % palette.length],
      userRating: Number(b.user_rating || 0) || undefined,
      externalRating: b.external_rating != null ? Number(b.external_rating) : undefined,
    };
  });

  const titleComments = ((titleCommentsRes.data || []) as any[]).map((c) => ({
    id: String(c.id),
    movieId: String(c.movie_id),
    content: c.content || "",
    createdAt: c.created_at || "",
  }));

  const wallComments: StudioWallComment[] = ((wallCommentsRes.data || []) as any[]).map((c) => {
    const author = Array.isArray(c.author) ? c.author[0] : c.author;
    return {
      id: String(c.id),
      content: c.content || "",
      createdAt: c.created_at || "",
      authorId: String(c.author_id || ""),
      authorUsername: author?.username || "",
      authorDisplayName: author?.display_name || null,
      authorAvatar: author?.avatar_url || null,
    };
  });

  const rated = ratedItems
    .map((r) => ({
      id: r.contentId,
      contentType: r.contentType,
      title: r.title,
      poster: r.posterUrl || "",
      year: r.releaseYear || "",
      cat: TYPE_RU[r.contentType] || "Фильмы",
      userRating: r.userRating,
    }))
    .sort((a, b) => b.userRating - a.userRating);

  return {
    id: userId,
    username: row.username || "user",
    display_name: row.display_name || row.username || "USER",
    avatar_url: row.avatar_url || "",
    bio: row.about_me || row.bio || "",
    level: row.level ?? 1,
    xp: row.xp ?? 0,
    stats: {
      bookmarks: bmRows.length,
      followers: followers.count || 0,
      following: following.count || 0,
      comments: titleComments.length + wallComments.length,
      rated: rated.length,
    },
    statusCounts,
    friendsCount: friends.count || 0,
    media,
    rated,
    titleComments,
    wallComments,
    topLists: (lists.data || []).map((l: any) => {
      const items = (itemsRes.data || []).filter((it: any) => it.top_list_id === l.id);
      return {
        title: l.title,
        mediaType: l.media_type,
        poster: items[0]?.poster_url || (items[0] as any)?.metadata?.poster_url || "",
        items: items.slice(0, 10).map((it: any) => ({
          id: it.item_id,
          title: it.title,
          poster: it.poster_url || (it.metadata as any)?.poster_url || "",
        })),
      };
    }),
  };
}

type DragState = null | {
  kind: "block" | "part" | "resize-block" | "resize-part";
  id: string;
  partId?: string;
  dir?: string;
  startX: number;
  startY: number;
  orig: any;
};

interface StudioTextProps {
  textKey: string;
  html: string;
  editable: boolean;
  highlight: boolean;
  onEdit: (key: string, html: string) => void;
}

function StudioText({ textKey, html, editable, highlight, onEdit }: StudioTextProps) {
  const element = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    // Replacing the text nodes after native input would reset the browser selection.
    if (element.current && element.current.innerHTML !== html) {
      element.current.innerHTML = html;
    }
  }, [html]);

  return (
    <span
      ref={element}
      data-text-key={textKey}
      className={highlight ? "studio-t studio-text-editable" : "studio-t"}
      contentEditable={editable}
      onInput={editable ? (event) => onEdit(textKey, event.currentTarget.innerHTML) : undefined}
    />
  );
}

interface Props { row: ProfileRow | null; viewerId: string | null }

const ProfileStudio = ({ row, viewerId }: Props) => {
  const navigate = useNavigate();
  const userId = row?.id;
  const profileHandle = row?.username || userId || "";
  const isOwn = Boolean(userId && viewerId === userId);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<StudioData>(emptyData);
  const [mode, setMode] = useState<EditorMode>("blocks");
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [snap, setSnap] = useState(false);
  const [activeTab, setActiveTab] = useState("ЗАКЛАДКИ");
  const [activeStatus, setActiveStatus] = useState("Просмотрено");
  const [activeCat, setActiveCat] = useState("Все");
  const [ratedCat, setRatedCat] = useState("Все");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [wallComments, setWallComments] = useState<StudioWallComment[]>([]);
  const [wallInput, setWallInput] = useState("");
  const [postingWall, setPostingWall] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 900px)").matches : false
  );
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : MOBILE_CANVAS_WIDTH
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 900px)");
    const onChange = () => {
      setIsMobile(mq.matches);
      setViewportWidth(window.innerWidth);
    };
    onChange();
    mq.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  const getVariant = useCallback(
    (d: StudioData, mobile = isMobile): StudioVariantConfig =>
      mobile
        ? d.mobile || emptyMobileConfig()
        : {
            globalFont: d.globalFont,
            pageBg: d.pageBg,
            blocks: d.blocks,
            parts: d.parts,
            texts: d.texts,
            trash: d.trash,
          },
    [isMobile]
  );

  const withVariant = useCallback(
    (d: StudioData, patch: Partial<StudioVariantConfig>, mobile = isMobile): StudioData =>
      mobile
        ? { ...d, mobile: { ...(d.mobile || emptyMobileConfig()), ...patch } }
        : { ...d, ...patch },
    [isMobile]
  );

  const getBlocksFor = useCallback(
    (d: StudioData, mobile = isMobile): Block[] => getVariant(d, mobile).blocks,
    [getVariant, isMobile]
  );

  const withBlocksFor = useCallback(
    (d: StudioData, nextBlocks: Block[], mobile = isMobile): StudioData =>
      withVariant(d, { blocks: nextBlocks }, mobile),
    [withVariant, isMobile]
  );

  const activeScale = isMobile
    ? Math.min(1.15, Math.max(0.75, viewportWidth / MOBILE_CANVAS_WIDTH))
    : 1;
  const [modal, setModal] = useState<"fonts" | "bg" | "json" | "reset" | "add" | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [fontSample, setFontSample] = useState("DOSIKTE — Закладки 37");
  const [drag, setDrag] = useState<DragState>(null);
  const [inline, setInline] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const history = useRef<StudioData[]>([]);
  const historyIdx = useRef(-1);

  const commit = useCallback((next: StudioData, record = true) => {
    setData(next);
    dataRef.current = next;
    if (record) {
      history.current = history.current.slice(0, historyIdx.current + 1);
      history.current.push(JSON.parse(JSON.stringify(next)));
      if (history.current.length > 35) history.current.shift();
      historyIdx.current = history.current.length - 1;
    }
  }, []);

  // ── Загрузка с сервера ──
  useEffect(() => {
    if (!row) return;
    let active = true;
    (async () => {
      try {
        const profile = await loadProfile(row);
        if (!active) return;
        const studio = normalizeData(row.customization?.studio);
        studio.profile = profile;
        studio.avatarSrc = profile.avatar_url || studio.avatarSrc;
        // Синхронизируем живые данные аккаунта в оба независимых макета (десктоп и мобайл)
        const hydrateVariant = (variant: StudioVariantConfig): StudioVariantConfig => {
          const texts = { ...variant.texts };
          const blocks = variant.blocks.map((b) => {
            if (b.type !== "stat" || !b.meta) return b;
            const idx = STAT_LABELS.indexOf(b.meta.label);
            const values = [profile.stats.bookmarks, profile.stats.followers, profile.stats.following, profile.stats.comments];
            if (idx >= 0) {
              const nextMeta = { ...b.meta, val: String(values[idx]) };
              texts[`${b.id}_val`] = String(values[idx]);
              return { ...b, meta: nextMeta };
            }
            return b;
          });
          texts["blk_header_username"] = (profile.display_name || profile.username).toUpperCase();
          texts["blk_header_handle"] = "@" + profile.username;
          texts["blk_header_lv"] = `✦ LV.${profile.level}`;
          texts["blk_header_xp"] = `${profile.xp}/500 XP`;
          texts["blk_level_num"] = String(profile.level);
          texts["blk_level_pill"] = `LV.${profile.level}`;
          texts["blk_level_xp"] = `${profile.xp}/500 XP`;
          texts["blk_level_next"] = `-${Math.max(0, 500 - profile.xp)} NEXT`;
          texts["blk_friends_count"] = String(profile.friendsCount);
          texts["blk_bio_bio"] = profile.bio || "...";
          profile.topLists.slice(0, 3).forEach((l, i) => {
            texts[`blk_toplists_i${i + 1}`] = l.title;
          });
          return { ...variant, blocks, texts };
        };
        const hydratedDesktop = hydrateVariant({
          globalFont: studio.globalFont,
          pageBg: studio.pageBg,
          blocks: studio.blocks,
          parts: studio.parts,
          texts: studio.texts,
          trash: studio.trash,
        });
        Object.assign(studio, hydratedDesktop);
        studio.mobile = hydrateVariant(studio.mobile);
        setWallComments(profile.wallComments);
        if ((profile.statusCounts["Просмотрено"] || 0) === 0) {
          const firstNonEmpty = STATUS_PILLS.find((s) => (profile.statusCounts[s] || 0) > 0);
          if (firstNonEmpty) setActiveStatus(firstNonEmpty);
        }
        commit(studio, false);
        history.current = [JSON.parse(JSON.stringify(studio))];
        historyIdx.current = 0;
      } catch (e) {
        console.error("Studio load error:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [row, commit]);

  // ── Сохранение (изолированно для десктопа и мобайла) ──
  const saveToServer = useCallback(async (silent = false) => {
    if (!isOwn || !editing || !userId) return false;
    try {
      const { data: row, error: readError } = await supabase.from("profiles").select("customization").eq("id", userId).single();
      if (readError) throw readError;
      const customization = ((row?.customization as any) || {}) as Record<string, any>;
      const existingStudio = normalizeData(customization.studio);
      const { profile, mobileBlocks: _legacy, ...current } = dataRef.current;
      if (isMobile) {
        customization.studio = {
          ...existingStudio,
          profile: undefined,
          avatarSrc: current.avatarSrc,
          mobile: current.mobile,
        };
      } else {
        customization.studio = {
          ...current,
          mobile: existingStudio.mobile || current.mobile,
        };
      }
      const { error } = await supabase.from("profiles").update({ customization }).eq("id", userId);
      if (error) throw error;
      if (!silent) toast.success("Профиль сохранён на сервере");
      return true;
    } catch (e: any) {
      toast.error("Ошибка сохранения: " + (e?.message || "неизвестная"));
    }
  }, [userId, isOwn, editing, isMobile]);

  const saveEdits = async (finish = false) => {
    setSaving(true);
    const saved = await saveToServer();
    setSaving(false);
    if (saved && finish) {
      setEditing(false);
      setSelectedBlock(null);
      setSelectedPart(null);
      setDrag(null);
      setInline(null);
      setMode("blocks");
    }
  };

  useEffect(() => {
    if (loading || !editing || !isOwn) return;
    const timer = window.setInterval(() => void saveToServer(true), 4000);
    const onHide = () => { if (document.visibilityState === "hidden") void saveToServer(true); };
    const onPageHide = () => void saveToServer(true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [loading, isOwn, editing, saveToServer]);

  // ── Загрузка файлов ──
  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/studio/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from("profile-media").upload(path, file, {
      contentType: file.type || "application/octet-stream", upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFile = (file: File | undefined, cb: (url: string) => void) => {
    if (!file || !editing || !isOwn) return;
    toast.info("Загружаем файл...");
    uploadFile(file).then((url) => { cb(url); toast.success("Файл загружен"); })
      .catch((e) => toast.error("Ошибка загрузки: " + e.message));
  };

  const handleAvatarUpload = (file: File | undefined) => {
    if (!file || !editing || !isOwn) return;
    handleFile(file, (url) => {
      const d = dataRef.current;
      commit({ ...d, avatarSrc: url });
      void supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    });
  };

  // ── Undo / hotkeys ──
  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return toast.info("Больше нет действий");
    historyIdx.current -= 1;
    commit(history.current[historyIdx.current], false);
    toast.info("Отменено");
  }, [commit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOwn || !editing) return;
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void saveToServer(); }
      if (e.key === "Escape") { setModal(null); setInline(null); setSelectedBlock(null); setSelectedPart(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, saveToServer, isOwn, editing]);

  // ── Drag & Resize ──
  useEffect(() => {
    if (!drag) return;
    const snapV = (v: number) => (snap ? Math.round(v / 8) * 8 : Math.round(v));
    const onMove = (e: PointerEvent) => {
      const dx = (e.clientX - drag.startX) / activeScale;
      const dy = (e.clientY - drag.startY) / activeScale;
      const d = dataRef.current;

      if (drag.kind === "block" || drag.kind === "resize-block") {
        const list = getBlocksFor(d);
        const b = list.find((x) => x.id === drag.id);
        if (!b) return;
        const next = { ...b };
        if (drag.kind === "block") {
          next.x = snapV(drag.orig.x + dx);
          next.y = snapV(drag.orig.y + dy);
        } else {
          const dir = drag.dir || "";
          let { x, y, w, h } = drag.orig;
          if (dir.includes("e")) w = Math.max(40, Math.min(2000, snapV(w + dx)));
          if (dir.includes("s")) h = Math.max(40, Math.min(2000, snapV(h + dy)));
          if (dir.includes("w")) { w = Math.max(40, Math.min(2000, snapV(w - dx))); x = snapV(drag.orig.x + drag.orig.w - w); }
          if (dir.includes("n")) { h = Math.max(40, Math.min(2000, snapV(h - dy))); y = snapV(drag.orig.y + drag.orig.h - h); }
          // Аватарки, картинки и счётчики меняют размер пропорционально
          if (["avatar", "customImage", "stat", "customVideo"].includes(b.type) && dir.length === 2) {
            const ratio = drag.orig.w / drag.orig.h;
            if (w / h > ratio) w = Math.round(h * ratio);
            else h = Math.round(w / ratio);
          }
          Object.assign(next, { x, y, w, h });
        }
        commit(withBlocksFor(d, list.map((x) => (x.id === b.id ? next : x))), false);
      } else if (drag.kind === "part" || drag.kind === "resize-part") {
        const variant = getVariant(d);
        const map = { ...variant.parts, [drag.id]: { ...(variant.parts[drag.id] || {}) } };
        const key = drag.partId || "";
        const p: PartCfg = { ...defaultPart(), ...(map[drag.id][key] || {}) };
        p.detached = true;
        if (drag.kind === "part") {
          p.x = snapV(drag.orig.x + dx);
          p.y = snapV(drag.orig.y + dy);
        } else {
          const dir = drag.dir || "";
          let { w, h } = drag.orig;
          if (dir.includes("e")) w = Math.max(16, Math.min(2000, snapV(w + dx)));
          if (dir.includes("s")) h = Math.max(16, Math.min(2000, snapV(h + dy)));
          if (dir.includes("w")) w = Math.max(16, Math.min(2000, snapV(w - dx)));
          if (dir.includes("n")) h = Math.max(16, Math.min(2000, snapV(h - dy)));
          p.w = w; p.h = h;
        }
        map[drag.id][key] = p;
        commit(withVariant(d, { parts: map }), false);
      }
    };
    const onUp = () => {
      if (drag) {
        commit(dataRef.current, true);
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, snap, commit, activeScale, getVariant, withVariant, getBlocksFor, withBlocksFor]);

  // ── Inline text ──
  const updateText = (key: string, html: string) => {
    const current = dataRef.current;
    const v = getVariant(current);
    commit(withVariant(current, { texts: { ...v.texts, [key]: html } }), false);
  };

  useEffect(() => {
    if (!editing || !isOwn) return;
    const onUp = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (!sel || !text || !sel.rangeCount) { setInline(null); return; }
      const node = sel.getRangeAt(0).commonAncestorContainer;
      const el = (node.nodeType === 1 ? node : node.parentElement) as HTMLElement | null;
      if (!el?.closest("[data-text-key]")) { setInline(null); return; }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      setInline({ x: Math.min(window.innerWidth - 280, r.left), y: Math.max(60, r.top - 64) });
    };
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, [editing, isOwn]);

  const saveInlineTexts = () => {
    const d = dataRef.current;
    const texts = { ...getVariant(d).texts };
    canvasRef.current?.querySelectorAll<HTMLElement>("[data-text-key]").forEach((el) => {
      texts[el.dataset.textKey || ""] = el.innerHTML;
    });
    commit(withVariant(d, { texts }), false);
  };

  const execInline = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    saveInlineTexts();
  };

  const applyInlineFont = (font: string) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) {
      toast.info("Сначала выдели текст");
      return;
    }
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontFamily = `'${font}', sans-serif`;
    try {
      range.surroundContents(span);
    } catch {
      span.appendChild(range.extractContents());
      range.insertNode(span);
    }
    sel.removeAllRanges();
    saveInlineTexts();
    toast.success(`Шрифт: ${font}`);
  };

  // ── Панель ──
  const patchBlock = (id: string, patch: Partial<Block>) => {
    const d = dataRef.current;
    commit(withBlocksFor(d, getBlocksFor(d).map((b) => (b.id === id ? { ...b, ...patch } : b))));
  };
  const patchPart = (blockId: string, partId: string, patch: Partial<PartCfg>) => {
    const d = dataRef.current;
    const v = getVariant(d);
    const map = { ...v.parts, [blockId]: { ...(v.parts[blockId] || {}) } };
    map[blockId][partId] = { ...defaultPart(), ...(map[blockId][partId] || {}), ...patch };
    commit(withVariant(d, { parts: map }));
  };
  const deleteBlock = (id: string) => {
    const d = dataRef.current;
    const v = getVariant(d);
    const removed = v.blocks.find((b) => b.id === id);
    if (!removed) return;
    commit(
      withVariant(d, {
        blocks: v.blocks.filter((b) => b.id !== id),
        trash: [removed, ...v.trash.filter((b) => b.id !== id)],
        parts: { ...v.parts, [id]: {} },
      })
    );
    setSelectedBlock(null);
    toast.success("Блок удалён — его можно вернуть в меню «Добавить»");
  };

  const restoreBlock = (id: string) => {
    const d = dataRef.current;
    const v = getVariant(d);
    const block = v.trash.find((b) => b.id === id);
    if (!block) return;
    const restored = isMobile
      ? {
          ...block,
          w: Math.min(block.w, MOBILE_CANVAS_WIDTH - 24),
          x: Math.max(12, Math.min(MOBILE_CANVAS_WIDTH - Math.min(block.w, MOBILE_CANVAS_WIDTH - 24) - 12, block.x)),
        }
      : block;
    commit(
      withVariant(d, {
        blocks: [...v.blocks, restored],
        trash: v.trash.filter((b) => b.id !== id),
      })
    );
    setSelectedBlock(id);
    toast.success("Блок восстановлен");
  };

  const activeVariant = getVariant(data);
  const activeBlocks = activeVariant.blocks;
  const selectedBlockData = activeBlocks.find((b) => b.id === selectedBlock) || null;
  const partCfg = selectedBlock && selectedPart ? activeVariant.parts[selectedBlock]?.[selectedPart] : null;

  const media = useMemo(() => {
    let items = data.profile?.media || [];
    items = items.filter((m) => {
      const sOk = m.status === activeStatus;
      const cOk = activeCat === "Все" || m.cat === activeCat;
      const qOk = !search || m.title.toLowerCase().includes(search.toLowerCase());
      return sOk && cOk && qOk;
    });
    return [...items].sort((a, b) => (sortBy === "title" ? a.title.localeCompare(b.title) : b.year - a.year));
  }, [data.profile, activeStatus, activeCat, search, sortBy]);

  const addBlock = (kind: string, url?: string) => {
    const id = `blk_custom_${Date.now()}`;
    const base: Block = {
      id,
      type: kind,
      title: kind,
      x: isMobile ? 12 : 420,
      y: isMobile ? 140 : 240,
      w: isMobile ? 352 : 300,
      h: isMobile ? 140 : 180,
      z: 40,
      rotation: 0,
      radius: 18,
      opacity: 1,
      hidden: false,
      locked: false,
      pinned: false,
      overflowHidden: true,
      font: "",
      bg: defaultBg(),
    };
    if (kind === "stat") Object.assign(base, { type: "stat", w: isMobile ? 171 : 290, h: isMobile ? 78 : 86, meta: { icon: "bookmark", val: "99", label: "ЛЮБИМЫЕ" } });
    if (kind === "text") Object.assign(base, { type: "customText", title: "Текстовый блок", w: isMobile ? 352 : 340, h: 120 });
    if (kind === "image") Object.assign(base, { type: "customImage", title: "Картинка", w: isMobile ? 352 : 320, h: isMobile ? 260 : 400, meta: { src: url || "" } });
    if (kind === "video") Object.assign(base, { type: "customVideo", title: "Видео", w: isMobile ? 352 : 480, h: isMobile ? 210 : 280, meta: { src: url || "" } });
    const d = dataRef.current;
    commit(withBlocksFor(d, [...getBlocksFor(d), base]));
    setSelectedBlock(id);
    setModal(null);
    toast.success("Блок добавлен");
  };

  const resetAll = () => {
    const d = dataRef.current;
    const freshVariant: StudioVariantConfig = isMobile
      ? emptyMobileConfig()
      : {
          globalFont: "Inter",
          pageBg: defaultPageBg(),
          blocks: getDefaultBlocks(),
          parts: {},
          texts: {},
          trash: [],
        };
    const p = d.profile;
    if (p) {
      freshVariant.texts["blk_header_username"] = (p.display_name || p.username).toUpperCase();
      freshVariant.texts["blk_header_handle"] = "@" + p.username;
      freshVariant.texts["blk_header_lv"] = `✦ LV.${p.level}`;
      freshVariant.texts["blk_header_xp"] = `${p.xp}/500 XP`;
      freshVariant.texts["blk_level_num"] = String(p.level);
      freshVariant.texts["blk_level_pill"] = `LV.${p.level}`;
      freshVariant.texts["blk_level_xp"] = `${p.xp}/500 XP`;
      freshVariant.texts["blk_level_next"] = `-${Math.max(0, 500 - p.xp)} NEXT`;
      freshVariant.texts["blk_friends_count"] = String(p.friendsCount);
      freshVariant.texts["blk_bio_bio"] = p.bio || "...";
      p.topLists.slice(0, 3).forEach((l, i) => {
        freshVariant.texts[`blk_toplists_i${i + 1}`] = l.title;
      });
      freshVariant.blocks = freshVariant.blocks.map((b) => {
        if (b.type !== "stat" || !b.meta) return b;
        const idx = STAT_LABELS.indexOf(b.meta.label);
        const values = [p.stats.bookmarks, p.stats.followers, p.stats.following, p.stats.comments];
        if (idx >= 0) {
          freshVariant.texts[`${b.id}_val`] = String(values[idx]);
          return { ...b, meta: { ...b.meta, val: String(values[idx]) } };
        }
        return b;
      });
    }
    commit(withVariant(d, freshVariant), false);
    history.current = [];
    historyIdx.current = -1;
    setModal(null);
    setSelectedBlock(null);
    void saveToServer(true);
    toast.success(isMobile ? "Мобильный профиль сброшен" : "Десктопный профиль сброшен");
  };

  if (loading) {
    return <div className="studio-loading" role="status" aria-label="Загрузка профиля"><Loader2 aria-hidden="true" /></div>;
  }

  const handlePostWallComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewerId || !userId || !wallInput.trim() || postingWall) return;
    setPostingWall(true);
    try {
      const { data: inserted, error } = await supabase
        .from("profile_comments")
        .insert({
          profile_id: userId,
          author_id: viewerId,
          content: wallInput.trim(),
        })
        .select("id,content,created_at,author_id,author:profiles(username,display_name,avatar_url)")
        .single();
      if (error) throw error;
      const author = Array.isArray((inserted as any)?.author) ? (inserted as any).author[0] : (inserted as any)?.author;
      setWallComments((prev) => [
        {
          id: String((inserted as any).id),
          content: (inserted as any).content,
          createdAt: (inserted as any).created_at,
          authorId: String((inserted as any).author_id),
          authorUsername: author?.username || "",
          authorDisplayName: author?.display_name || null,
          authorAvatar: author?.avatar_url || null,
        },
        ...prev,
      ]);
      setWallInput("");
      toast.success("Комментарий добавлен");
    } catch {
      toast.error("Не удалось отправить комментарий");
    } finally {
      setPostingWall(false);
    }
  };

  const handleDeleteWallComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from("profile_comments").delete().eq("id", commentId);
      if (error) throw error;
      setWallComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Комментарий удалён");
    } catch {
      toast.error("Не удалось удалить комментарий");
    }
  };

  // ── Рендер блоков ──
  const tx = (key: string, fallback: string) => (
    <StudioText
      textKey={key}
      html={activeVariant.texts[key] ?? fallback}
      editable={editing && isOwn}
      highlight={editing && isOwn && mode === "text"}
      onEdit={updateText}
    />
  );

  const renderBlockContent = (b: Block) => {
    const part = (id: string, name: string, children: React.ReactNode, cls = "", style?: React.CSSProperties) => (
      <span
        data-part-id={id}
        data-part-name={name}
        className={`rx-part ${cls}`}
        style={style}
        onPointerDown={(e) => {
          if (!isOwn || !editing || mode !== "parts") return;
          e.stopPropagation();
          setSelectedBlock(b.id);
          setSelectedPart(id);
          const cfg = activeVariant.parts[b.id]?.[id] || defaultPart();
          setDrag({ kind: "part", id: b.id, partId: id, startX: e.clientX, startY: e.clientY, orig: { x: cfg.x, y: cfg.y } });
        }}
      >{children}</span>
    );

    switch (b.type) {
      case "avatar":
        return (
          <div className="flex h-full w-full items-center justify-center" onDoubleClick={editing && isOwn ? () => avatarInputRef.current?.click() : undefined} title={editing && isOwn ? "Заменить фото двойным нажатием" : undefined}>
            <div className="h-full w-full rounded-full p-1.5 avatar-ring overflow-hidden">
              <img src={data.avatarSrc} alt="" className="h-full w-full rounded-full object-cover" />
            </div>
            <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full bg-emerald-400 border-[3px] border-[#090a0f]" />
          </div>
        );
      case "header": {
        const centered = b.meta?.align === "center";
        return (
          <div className={`flex h-full min-w-0 flex-col justify-center gap-1.5 sm:gap-2 px-3 ${centered ? "items-center text-center" : ""}`}>
            <div className="font-display text-2xl sm:text-[38px] font-black leading-tight tracking-tight text-white break-words">{tx("blk_header_username", "DOSIKTE")}</div>
            <div className={`${centered ? "self-center" : "self-start"} rounded-full border border-amber-500/35 bg-amber-500/15 px-3 py-0.5 text-xs font-semibold text-amber-300`}>{tx("blk_header_handle", "@user")}</div>
            <div className={`mt-0.5 flex flex-wrap items-center gap-2 sm:gap-2.5 ${centered ? "justify-center" : ""}`}>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">{tx("blk_header_lv", "✦ LV.1")}</div>
              <div className="h-1.5 w-24 sm:w-36 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-1/6 rounded-full bg-gradient-to-r from-amber-400 to-amber-500" /></div>
              <div className="font-mono text-[11px] text-slate-400">{tx("blk_header_xp", "0/500 XP")}</div>
            </div>
          </div>
        );
      }
      case "actions": {
        const centered = b.meta?.align === "center";
        return (
          <div className={`flex h-full w-full flex-wrap items-center gap-2 ${centered ? "justify-center" : "justify-start sm:justify-end"}`}>
            <button
              type="button"
              onClick={() => navigate(profileHandle ? `/bookmarks/${profileHandle}` : "/bookmarks")}
              className="rounded-xl border border-[#1e222e] bg-[#10121a] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors"
            >
              {tx("blk_actions_btnBm", "🔖 Закладки")}
            </button>
            <button
              type="button"
              onClick={() => navigate(profileHandle ? `/rated/${profileHandle}` : "/rated")}
              className="rounded-xl border border-[#1e222e] bg-[#10121a] px-3.5 py-2 text-xs font-semibold text-amber-300 hover:border-amber-500/50 transition-colors"
            >
              ★ Оценки
            </button>
            {isOwn && <button type="button" onClick={() => setEditing(true)} className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-[#04161c]">{tx("blk_actions_btnEdit", "Редактировать")}</button>}
            <button type="button" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/${profileHandle}`).then(() => toast.success("Ссылка на профиль скопирована"))} className="rounded-xl border border-[#1e222e] bg-[#10121a] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/30 transition-colors">{tx("blk_actions_btnShare", "↗ Поделиться")}</button>
          </div>
        );
      }
      case "stat": {
        const m = b.meta || {};
        const statIcons = { bookmark: Bookmark, users: Users, userPlus: UserPlus, message: MessageSquare };
        const Icon = statIcons[m.icon as keyof typeof statIcons] || Star;
        const onStatClick =
          m.label === "ЗАКЛАДКИ"
            ? () => setActiveTab("ЗАКЛАДКИ")
            : m.label === "КОММЕНТАРИИ"
            ? () => setActiveTab("КОММЕНТАРИИ")
            : undefined;
        return (
          <div
            onClick={onStatClick}
            className={`flex h-full w-full items-center gap-2.5 sm:gap-4 px-3 sm:px-5 py-2.5 ${onStatClick ? "cursor-pointer hover:bg-white/[0.03] transition-colors" : ""}`}
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400"><Icon className="h-4 w-4 sm:h-5 sm:w-5" /></div>
            <div className="flex min-w-0 flex-col">
              <div className="font-display text-xl sm:text-[28px] font-extrabold leading-none text-white">{tx(`${b.id}_val`, m.val || "0")}</div>
              <div className="mt-1 sm:mt-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{tx(`${b.id}_label`, m.label || "")}</div>
            </div>
          </div>
        );
      }
      case "level":
        return (
          <div className="flex h-full w-full items-center gap-3.5 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-900 text-sm font-bold text-white">{tx("blk_level_num", "1")}</div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex justify-between gap-2">
                <div className="text-xs font-bold text-white"><span className="text-amber-300">👑</span> Уровень</div>
                <div className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">{tx("blk_level_pill", "LV.1")}</div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"><div className="h-full w-0 rounded-full bg-amber-400" /></div>
              <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-500"><span>{tx("blk_level_xp", "0/500 XP")}</span><span>{tx("blk_level_next", "-500 NEXT")}</span></div>
            </div>
          </div>
        );
      case "friends":
        return (
          <div className="flex h-full w-full flex-col p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-bold text-white"><span className="text-amber-300">👥</span> Друзья</div>
              <div className="font-mono text-xs text-amber-300">{tx("blk_friends_count", "0")}</div>
            </div>
            <div className="flex flex-1 items-center justify-center text-xs italic text-slate-500">Друзей пока нет...</div>
          </div>
        );
      case "bmCard":
        return (
          <Link
            to={profileHandle ? `/bookmarks/${profileHandle}` : "/bookmarks"}
            className="flex h-full w-full items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400"><Bookmark className="h-4 w-4" /></div>
              <div className="min-w-0"><div className="truncate text-xs font-bold text-white">Закладки пользователя</div><div className="truncate text-[11px] text-slate-400">Все фильмы, сериалы, игры ({data.profile?.stats.bookmarks || 0})</div></div>
            </div>
            <span className="text-slate-400">→</span>
          </Link>
        );
      case "topLists":
        return (
          <div className="flex h-full w-full flex-col gap-2 p-4">
            <div className="mb-1 flex items-center justify-between"><div className="text-xs font-bold text-white"><span className="text-amber-300">↗</span> Топ списки</div><div className="font-mono text-xs text-slate-500">{data.profile?.topLists.length || 0}</div></div>
            {(data.profile?.topLists || []).slice(0, 3).map((l, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 p-2.5">
                <span className="font-display text-xs font-bold text-amber-300">#{i + 1}</span>
                {l.poster && <img src={l.poster} alt="" className="h-11 w-8 rounded object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}
                <div className="min-w-0"><div className="truncate text-xs font-semibold text-white">{l.title}</div><div className="text-[10px] text-amber-300">Топ-50</div></div>
              </div>
            ))}
          </div>
        );
      case "bio":
        return <div className="flex h-full w-full items-center px-4 text-sm text-slate-200">{tx("blk_bio_bio", "...")}</div>;
      case "tabs":
        return (
          <div className="grid grid-cols-2 sm:flex h-full w-full items-center gap-1.5 rounded-2xl sm:rounded-full bg-[#10121a] p-1.5">
            {[
              { id: "ЗАКЛАДКИ", label: `🔖 ЗАКЛАДКИ (${data.profile?.stats.bookmarks || 0})` },
              { id: "ОЦЕНКИ", label: `★ ОЦЕНКИ (${data.profile?.stats.rated || 0})` },
              { id: "КОММЕНТАРИИ", label: `💬 КОММЕНТЫ (${(data.profile?.titleComments.length || 0) + wallComments.length})` },
              { id: "TOP50", label: "🏆 TOP50" },
            ].map((t) => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={`studio-tab sm:flex-1 rounded-xl sm:rounded-full py-2 px-2 text-[11px] font-bold tracking-wider truncate ${activeTab === t.id ? "rx-btn-cyan" : "text-slate-400 hover:text-white"}`}>
                {t.label}
              </button>
            ))}
          </div>
        );
      case "bmBanner":
        return (
          <div className="flex h-full w-full flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4">
            <div className="flex items-center gap-3 min-w-0"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400"><Star className="h-4 w-4" /></div><div className="min-w-0"><div className="text-xs font-bold text-white truncate">Закладки и оценки пользователя</div><div className="text-[11px] text-slate-400 truncate">В закладках: {data.profile?.stats.bookmarks || 0} · Оценок: {data.profile?.stats.rated || 0}</div></div></div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => navigate(profileHandle ? `/rated/${profileHandle}` : "/rated")} className="rounded-full border border-amber-500/35 bg-amber-500/15 px-3.5 py-2 text-[11px] font-bold text-amber-300 hover:bg-amber-500/25 transition-colors">Оценки ↗</button>
              <button type="button" onClick={() => navigate(profileHandle ? `/bookmarks/${profileHandle}` : "/bookmarks")} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] font-bold text-slate-200 hover:bg-white/10 transition-colors">Закладки ↗</button>
            </div>
          </div>
        );
      case "filters":
        return (
          <div className="flex h-full w-full flex-wrap items-center gap-2">
            {STATUS_PILLS.map((s, i) => (
              <button key={s} type="button" onClick={() => { setActiveTab("ЗАКЛАДКИ"); setActiveStatus(s); }} className={`rounded-xl px-3.5 py-2 text-xs font-semibold ${activeStatus === s && activeTab === "ЗАКЛАДКИ" ? "bg-amber-600 text-white shadow-lg shadow-purple-600/35" : "border border-[#1e222e] bg-[#10121a] text-slate-300"}`}>
                {["▶", "◷", "✓", "⏸", "✕", "☆"][i]} {s}
                <span className="ml-2 rounded-md bg-black/25 px-1.5 py-0.5 text-[10px]">{data.profile?.statusCounts?.[s] ?? 0}</span>
              </button>
            ))}
          </div>
        );
      case "collection": {
        const filteredRated = (data.profile?.rated || []).filter(
          (r) => (ratedCat === "Все" || r.cat === ratedCat) && (!search || r.title.toLowerCase().includes(search.toLowerCase()))
        );
        const titleComments = data.profile?.titleComments || [];
        return (
          <div className="flex h-full w-full flex-col gap-3 overflow-y-auto p-4">
            {activeTab === "TOP50" ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-3"><h2 className="font-display text-2xl font-black text-white">ТОП 50</h2><span className="text-xs text-slate-400">{(data.profile?.topLists[0]?.items || []).length} / 50</span></div>
                  {isOwn && <button type="button" onClick={() => navigate("/tier-lists")} className="rounded-full bg-amber-400 px-4 py-2 text-xs font-black text-black">+ Добавить</button>}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {(data.profile?.topLists[0]?.items || []).map((it, i) => {
                    const mt = data.profile?.topLists[0]?.mediaType;
                    const to = getMediaPath(mt === "game" ? "game" : "movie", it.id);
                    return (
                      <Link key={i} to={to} className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 hover:border-amber-400/50 transition-colors">
                        <div className="absolute left-1.5 top-0 z-10 font-display text-4xl italic font-black text-amber-300">{i + 1}</div>
                        <div className="aspect-[2/3] w-full bg-slate-800">{it.poster && <img src={it.poster} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" onError={(e) => (e.currentTarget.style.display = "none")} />}</div>
                        <div className="p-2 text-[11px] font-bold text-white truncate">{it.title}</div>
                      </Link>
                    );
                  })}
                  {!data.profile?.topLists[0]?.items.length && <div className="col-span-full py-10 text-center text-sm text-slate-400">Список пока пуст.</div>}
                </div>
              </>
            ) : activeTab === "ОЦЕНКИ" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {["Все", "Фильмы", "Сериалы", "Аниме", "Игры"].map((c) => (
                      <button key={c} type="button" onClick={() => setRatedCat(c)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${ratedCat === c ? "bg-amber-400/20 text-amber-300 border border-amber-400/40" : "text-slate-400 hover:text-white"}`}>{c}</button>
                    ))}
                  </div>
                  <Link
                    to={profileHandle ? `/rated/${profileHandle}` : "/rated"}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:underline"
                  >
                    Открыть по категориям <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="flex flex-col gap-2">
                  {filteredRated.map((r, i) => (
                    <Link
                      key={`${r.contentType}:${r.id}`}
                      to={getMediaPath(r.contentType, r.id)}
                      className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#10121a]/85 p-3 transition hover:border-amber-400/50"
                    >
                      <span className="w-6 shrink-0 text-center text-xs font-black tabular-nums text-slate-500">{i + 1}</span>
                      <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-slate-800">
                        <img src={r.poster || "https://placehold.co/300x450/10121a/f59e0b?text=RX"} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <h3 className="truncate font-display text-sm font-bold text-white group-hover:text-amber-300 transition-colors">{r.title}</h3>
                          {r.year && <span className="font-mono text-[11px] text-slate-400">{r.year}</span>}
                        </div>
                        <span className="inline-block mt-1 rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">{r.cat}</span>
                      </div>
                      <div className="shrink-0 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-black text-black flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-black" />
                        {Number(r.userRating).toFixed(1).replace(/\.0$/, "")}
                      </div>
                    </Link>
                  ))}
                  {!filteredRated.length && <div className="py-10 text-center text-xs text-slate-500">В этой категории пока нет оценок</div>}
                </div>
              </>
            ) : activeTab === "КОММЕНТАРИИ" ? (
              <div className="space-y-5">
                {viewerId && (
                  <form onSubmit={handlePostWallComment} className="flex gap-2">
                    <input
                      value={wallInput}
                      onChange={(e) => setWallInput(e.target.value)}
                      placeholder="Оставить комментарий в профиле..."
                      maxLength={500}
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={postingWall || !wallInput.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-black disabled:opacity-40"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Отправить
                    </button>
                  </form>
                )}

                {titleComments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Комментарии к фильмам ({titleComments.length})
                    </p>
                    {titleComments.map((c) => (
                      <Link
                        key={c.id}
                        to={`/movie/${c.movieId}`}
                        className="block rounded-xl border border-white/[0.06] bg-[#10121a]/85 p-3 hover:border-cyan-400/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] text-cyan-300 mb-1">
                          <span>Фильм #{c.movieId} →</span>
                          <span className="text-slate-500">{new Date(c.createdAt).toLocaleDateString("ru-RU")}</span>
                        </div>
                        <p className="text-xs text-slate-200 whitespace-pre-wrap break-words">{c.content}</p>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Стена профиля ({wallComments.length})
                  </p>
                  {wallComments.map((c) => {
                    const authorTo = c.authorUsername ? `/${c.authorUsername}` : `/profile/${c.authorId}`;
                    return (
                      <div key={c.id} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#10121a]/85 p-3">
                        <Link to={authorTo} className="shrink-0">
                          <img
                            src={c.authorAvatar || "https://placehold.co/64x64/10121a/ffffff?text=U"}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover border border-white/10"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <Link to={authorTo} className="text-xs font-bold text-white hover:text-amber-300 truncate">
                              {c.authorDisplayName || c.authorUsername || "Пользователь"}
                            </Link>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500">
                                {new Date(c.createdAt).toLocaleDateString("ru-RU")}
                              </span>
                              {(isOwn || viewerId === c.authorId) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWallComment(c.id)}
                                  className="text-rose-400 hover:text-rose-300"
                                  title="Удалить"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-slate-300 whitespace-pre-wrap break-words">{c.content}</p>
                        </div>
                      </div>
                    );
                  })}
                  {wallComments.length === 0 && titleComments.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-500">Комментариев пока нет</div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {["Все", "Фильмы", "Сериалы", "Аниме", "Игры"].map((c) => (
                      <button key={c} type="button" onClick={() => setActiveCat(c)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${activeCat === c ? "bg-white/10 text-white" : "text-slate-400"}`}>{c}</button>
                    ))}
                  </div>
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию..." className="flex-1 min-w-0 sm:w-44 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="shrink-0 rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none">
                      <option value="date">По дате</option><option value="title">По названию</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  {media.map((m, i) => (
                    <Link
                      key={i}
                      to={getMediaPath(m.contentType, m.id)}
                      className="group flex min-h-[120px] items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#10121a]/85 p-3 transition hover:border-amber-400/50 sm:gap-5 sm:p-4"
                    >
                      <span className="w-5 shrink-0 text-center text-sm font-black tabular-nums text-slate-500 sm:w-8">{i + 1}</span>
                      <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-xl sm:w-20">
                        <img src={m.poster || "https://placehold.co/300x450/10121a/22d3ee?text=RX"} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex flex-wrap items-baseline gap-2"><h3 className="truncate font-display text-base font-black text-white sm:text-xl md:text-2xl group-hover:text-amber-300 transition-colors">{m.title}</h3>{m.year > 0 && <span className="font-mono text-xs text-slate-400">{m.year}</span>}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-bold text-slate-200">{m.cat}</span>{m.genre && <span>· {m.genre}</span>}</div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{m.status}</span>
                          {m.userRating != null && m.userRating > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[11px] font-black text-amber-300">
                              <Star className="h-3 w-3 fill-amber-300" /> {m.userRating}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {!media.length && <div className="py-10 text-center text-xs text-slate-500">В этом списке пока нет тайтлов</div>}
                </div>
              </>
            )}
          </div>
        );
      }
      case "top50":
        return (
          <div className="flex h-full w-full flex-col p-4">
            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-black text-white"><span className="text-amber-300">🏆</span> ТОП 50</div><button type="button" onClick={() => setActiveTab("TOP50")} className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-bold text-amber-300">Открыть →</button></div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {(data.profile?.topLists[0]?.items || []).map((it, i) => {
                const mt = data.profile?.topLists[0]?.mediaType;
                return (
                  <Link key={i} to={getMediaPath(mt === "game" ? "game" : "movie", it.id)} className="w-[130px] shrink-0 group">
                    <div className="font-display text-4xl italic font-black leading-none text-amber-300">{i + 1}</div>
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-xl border border-amber-400/30 bg-slate-800">{it.poster && <img src={it.poster} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />}</div>
                    <div className="mt-1.5 truncate text-[11px] font-bold text-white group-hover:text-amber-300">{it.title}</div>
                  </Link>
                );
              })}
              {!data.profile?.topLists[0]?.items.length && <div className="py-10 text-slate-500">Список Топ 50 пока пуст</div>}
            </div>
          </div>
        );
      case "customImage":
        return <img src={b.meta?.src || "https://placehold.co/600x400/10121a/22d3ee?text=Image"} alt="" className="h-full w-full rounded-2xl object-cover" />;
      case "customVideo":
        return <video src={b.meta?.src || ""} controls playsInline className="h-full w-full rounded-2xl bg-black object-contain" />;
      case "customText":
        return <div className="flex h-full flex-col justify-center gap-1 p-4"><div className="text-base font-bold text-white">Новый заголовок</div><div className="text-xs leading-relaxed text-slate-300">Выделите слово в режиме «Текст»</div></div>;
      default:
        return <div className="p-4 text-xs">Блок</div>;
    }
  };

  const canvasWidth = isMobile
    ? MOBILE_CANVAS_WIDTH
    : Math.max(1360, ...activeBlocks.map((b) => b.x + b.w + 80));
  const canvasHeight = Math.max(
    isMobile ? 1600 : 1180,
    ...activeBlocks.filter((b) => !b.hidden).map((b) => b.y + b.h + (editing ? 180 : 120))
  );

  return (
    <div className="studio-shell" style={{ fontFamily: activeVariant.globalFont ? `'${activeVariant.globalFont}', sans-serif` : undefined }}>
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { handleAvatarUpload(e.target.files?.[0]); e.target.value = ""; }}
      />
      {/* Фон страницы (независимый для мобайла и десктопа) */}
      <div
        className={`studio-page-bg ${activeVariant.pageBg.layout === "banner" ? "banner" : "full"}`}
        style={{
          backgroundImage: activeVariant.pageBg.mode === "avatar" ? `url(${data.avatarSrc})` : activeVariant.pageBg.imageSrc ? `url(${activeVariant.pageBg.imageSrc})` : undefined,
          filter: `blur(${activeVariant.pageBg.blur}px)`,
          transform: `scale(${activeVariant.pageBg.zoom / 100})`,
          opacity: 1 - activeVariant.pageBg.dim / 100,
          display: activeVariant.pageBg.mode === "default" ? "none" : "block",
        }}
      />

      {/* Холст (единый редактируемый холст: на мобиле масштабируется в ширину экрана 376px → 100%) */}
      <div
        style={{
          width: isMobile ? "100%" : undefined,
          height: isMobile ? Math.ceil(canvasHeight * activeScale) : undefined,
          overflow: isMobile ? "hidden" : undefined,
        }}
      >
      <div
        ref={canvasRef}
        data-grid={editing && isOwn && snap}
        className="studio-canvas relative mx-auto"
        style={{
          width: canvasWidth,
          minHeight: canvasHeight,
          transform: isMobile && activeScale !== 1 ? `scale(${activeScale})` : undefined,
          transformOrigin: "top left",
          margin: isMobile ? 0 : undefined,
        }}
      >
        {activeBlocks.map((b) => {
          const isSelected = selectedBlock === b.id;
          const partMap = activeVariant.parts[b.id] || {};
          return (
            <div
              key={b.id}
              data-block-id={b.id}
              data-surface={b.bg.mode}
              className={`rx-block absolute ${isSelected ? "is-selected" : ""}`}
              style={{
                left: b.x, top: b.y, width: b.w, height: b.h, zIndex: b.z,
                fontFamily: b.font ? `'${b.font}', sans-serif` : undefined,
                transform: b.rotation ? `rotate(${b.rotation}deg)` : undefined,
                borderRadius: b.radius, opacity: b.opacity, display: b.hidden ? "none" : undefined,
                overflow: b.overflowHidden ? "hidden" : "visible",
                background: b.bg.mode === "color" ? hexToRgba(b.bg.color, b.bg.alpha / 100) : undefined,
                backgroundImage: b.bg.mode === "image" && b.bg.imageSrc
                  ? `linear-gradient(rgba(9,10,15,${b.bg.dim / 100}),rgba(9,10,15,${b.bg.dim / 100})),url(${b.bg.imageSrc})`
                  : b.bg.mode === "avatar" ? `url(${data.avatarSrc})` : undefined,
                backgroundSize: "cover", backgroundPosition: "center",
                filter: b.bg.blur ? `blur(${b.bg.blur}px)` : undefined,
              }}
              onPointerDown={(e) => {
                if (!editing || !isOwn || mode !== "blocks" || b.locked) return;
                if ((e.target as HTMLElement).closest(".studio-ui, [data-text-key], button, input, select")) return;
                e.preventDefault();
                setSelectedBlock(b.id);
                setSelectedPart(null);
                setDrag({ kind: "block", id: b.id, startX: e.clientX, startY: e.clientY, orig: { x: b.x, y: b.y } });
              }}
            >
              <div className="rx-block-inner relative h-full w-full">
                {Object.entries(partMap).map(([pid, cfg]) => cfg.detached && (
                  <div key={pid} style={{ position: "absolute", left: cfg.x, top: cfg.y, zIndex: cfg.z }} />
                ))}
                {renderBlockContent(b)}
              </div>

              {editing && isOwn && isSelected && mode === "blocks" && DIRS.map((dir) => (
                <div
                  key={dir}
                  className={`studio-handle h-${dir}`}
                  onPointerDown={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    setDrag({ kind: "resize-block", id: b.id, dir, startX: e.clientX, startY: e.clientY, orig: { x: b.x, y: b.y, w: b.w, h: b.h } });
                  }}
                />
              ))}
              {editing && isOwn && isSelected && (
                <div className="studio-size-badge">{Math.round(b.w)}×{Math.round(b.h)} | {Math.round(b.x)},{Math.round(b.y)}</div>
              )}
            </div>
          );
        })}
      </div>
      </div>

      {/* Inline toolbar */}
      {editing && isOwn && inline && (
        <div className="studio-inline studio-ui" style={{ left: inline.x, top: inline.y }}>
          <select onChange={(e) => applyInlineFont(e.target.value)} defaultValue=""><option value="">Шрифт</option>{FONTS.map((f) => <option key={f}>{f}</option>)}</select>
          <button onClick={() => execInline("bold")}><b>B</b></button>
          <button onClick={() => execInline("italic")}><i>I</i></button>
          <button onClick={() => execInline("underline")}><u>U</u></button>
          <input type="color" onChange={(e) => execInline("foreColor", e.target.value)} />
          <button onClick={() => execInline("fontSize", "5")}>A+</button>
          <button onClick={() => setInline(null)}><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* Toolbar */}
      {editing && isOwn && <div className="studio-toolbar studio-ui" role="group" aria-label="Инструменты конструктора">
        {(["blocks", "parts", "text"] as EditorMode[]).map((m) => (
          <button key={m} title={modeLabels[m]} aria-label={modeLabels[m]} aria-pressed={mode === m} onClick={() => setMode(m)} className={`studio-tool ${mode === m ? "is-active" : ""}`}>
            {m === "blocks" ? <Move /> : m === "parts" ? <MousePointer2 /> : <Type />}
          </button>
        ))}
        <span className="studio-divider" />
        <button className="studio-tool" title="Добавить блок" aria-label="Добавить блок" onClick={() => setModal("add")}><Plus /></button>
        <button className="studio-tool" title="Шрифты" aria-label="Шрифты" onClick={() => setModal("fonts")}><CaseSensitive /></button>
        <button className="studio-tool" title="Фон профиля" aria-label="Фон профиля" onClick={() => setModal("bg")}><ImageIcon /></button>
        <button className={`studio-tool ${snap ? "is-active" : ""}`} title="Привязка к сетке" aria-label="Привязка к сетке" aria-pressed={snap} onClick={() => setSnap(!snap)}><Grid2X2 /></button>
        <span className="studio-divider" />
        <button className="studio-tool" title="Отменить действие" aria-label="Отменить действие" onClick={undo}><Undo2 /></button>
        <button className="studio-tool" title="Импорт и экспорт JSON" aria-label="Импорт и экспорт JSON" onClick={() => { setJsonText(JSON.stringify(activeVariant, null, 2)); setModal("json"); }}><FileJson /></button>
        <button className="studio-tool" title={isMobile ? "Сбросить мобильный профиль" : "Сбросить профиль"} aria-label={isMobile ? "Сбросить мобильный профиль" : "Сбросить профиль"} onClick={() => setModal("reset")}><RotateCcw /></button>
        <button className="studio-tool studio-save" title="Сохранить" aria-label="Сохранить" disabled={saving} onClick={() => void saveEdits()}><Save /></button>
        <button className="studio-tool studio-done" title="Сохранить и выйти" disabled={saving} onClick={() => void saveEdits(true)}><Check /> Готово</button>
      </div>}

      {/* Inspector */}
      {editing && isOwn && selectedBlockData && mode !== "text" && (
        <div className="studio-inspector studio-ui">
          <div className="studio-inspector-head">
            <div><span className="studio-kbd">{selectedPart ? "ДЕТАЛЬ" : "БЛОК"}</span><h3>{selectedPart || selectedBlockData.title}</h3></div>
            <button onClick={() => { setSelectedBlock(null); setSelectedPart(null); }}><X className="h-4 w-4" /></button>
          </div>

          {!selectedPart ? (
            <>
              <p className="studio-label">Позиция и размер (px)</p>
              <div className="studio-grid4">
                {(["x", "y", "w", "h"] as const).map((k) => (
                  <label key={k}>{k.toUpperCase()}<input type="number" min={k === "w" || k === "h" ? 40 : undefined} max={2000} value={Math.round(selectedBlockData[k])} onChange={(e) => patchBlock(selectedBlockData.id, { [k]: Number(e.target.value) } as any)} /></label>
                ))}
              </div>
              <div className="studio-row">
                <button className="studio-chip" onClick={() => patchBlock(selectedBlockData.id, { z: selectedBlockData.z + 1 })}><ChevronUp /> Вверх</button>
                <button className="studio-chip" onClick={() => patchBlock(selectedBlockData.id, { z: Math.max(1, selectedBlockData.z - 1) })}><ChevronDown /> Вниз</button>
                <button className="studio-chip" onClick={() => patchBlock(selectedBlockData.id, { hidden: !selectedBlockData.hidden })}>{selectedBlockData.hidden ? <Eye /> : <EyeOff />}</button>
                <button className="studio-chip" onClick={() => patchBlock(selectedBlockData.id, { pinned: !selectedBlockData.pinned })}><Link2 /> Закрепить</button>
                <button className="studio-chip" onClick={() => patchBlock(selectedBlockData.id, { locked: !selectedBlockData.locked })}><Settings2 /> {selectedBlockData.locked ? "Разблок." : "Блокир."}</button>
                {selectedBlockData.pinned && <span className="text-[10px] text-amber-300">Закреплён</span>}
              </div>
              <p className="studio-label">Вращение · Скругление · Прозрачность</p>
              <input type="range" min={-180} max={180} value={selectedBlockData.rotation} onChange={(e) => patchBlock(selectedBlockData.id, { rotation: +e.target.value })} />
              <input type="range" min={0} max={100} value={selectedBlockData.radius} onChange={(e) => patchBlock(selectedBlockData.id, { radius: +e.target.value })} />
              <input type="range" min={10} max={100} value={selectedBlockData.opacity * 100} onChange={(e) => patchBlock(selectedBlockData.id, { opacity: +e.target.value / 100 })} />
              <p className="studio-label">Шрифт блока</p>
              <select value={selectedBlockData.font} onChange={(e) => patchBlock(selectedBlockData.id, { font: e.target.value })}><option value="">По умолчанию</option>{FONTS.map((f) => <option key={f}>{f}</option>)}</select>
              <p className="studio-label">Фон блока</p>
              <div className="studio-row">
                {(["default", "color", "image", "avatar"] as const).map((m) => (
                  <button key={m} className={`studio-chip ${selectedBlockData.bg.mode === m ? "is-on" : ""}`} onClick={() => patchBlock(selectedBlockData.id, { bg: { ...selectedBlockData.bg, mode: m } })}>{m === "default" ? "Нет" : m === "color" ? "Цвет" : m === "image" ? "Фото" : "Аватар"}</button>
                ))}
              </div>
              {selectedBlockData.bg.mode === "color" && <><input type="color" value={selectedBlockData.bg.color} onChange={(e) => patchBlock(selectedBlockData.id, { bg: { ...selectedBlockData.bg, color: e.target.value } })} /><input type="range" min={0} max={100} value={selectedBlockData.bg.alpha} onChange={(e) => patchBlock(selectedBlockData.id, { bg: { ...selectedBlockData.bg, alpha: +e.target.value } })} /></>}
              {selectedBlockData.bg.mode === "image" && (
                <>
                  <label className="studio-file">📁 Загрузить фото<input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0], (url) => patchBlock(selectedBlockData.id, { bg: { ...selectedBlockData.bg, imageSrc: url } }))} /></label>
                  <input type="range" min={0} max={30} value={selectedBlockData.bg.blur} onChange={(e) => patchBlock(selectedBlockData.id, { bg: { ...selectedBlockData.bg, blur: +e.target.value } })} />
                  <input type="range" min={0} max={95} value={selectedBlockData.bg.dim} onChange={(e) => patchBlock(selectedBlockData.id, { bg: { ...selectedBlockData.bg, dim: +e.target.value } })} />
                  <input type="range" min={100} max={250} value={selectedBlockData.bg.zoom} onChange={(e) => patchBlock(selectedBlockData.id, { bg: { ...selectedBlockData.bg, zoom: +e.target.value } })} />
                </>
              )}
              <button className="studio-chip" onClick={() => patchBlock(selectedBlockData.id, { bg: defaultBg(), rotation: 0, radius: 18, opacity: 1, x: 0, y: 0, hidden: false })}><RotateCcw /> Сбросить блок</button>
              <button className="studio-chip studio-danger" onClick={() => deleteBlock(selectedBlockData.id)}><Trash2 /> Удалить блок</button>
            </>
          ) : (
            <>
              <p className="studio-label">Шрифт детали</p>
              <select value={partCfg?.font || ""} onChange={(e) => patchPart(selectedBlockData.id, selectedPart, { font: e.target.value })}><option value="">По умолчанию</option>{FONTS.map((f) => <option key={f}>{f}</option>)}</select>
              <p className="studio-label">Размер шрифта</p>
              <input type="range" min={8} max={140} value={partCfg?.fontSize || 16} onChange={(e) => patchPart(selectedBlockData.id, selectedPart, { fontSize: +e.target.value })} />
              <p className="studio-label">Цвет</p>
              <input type="color" value={partCfg?.color || "#ffffff"} onChange={(e) => patchPart(selectedBlockData.id, selectedPart, { color: e.target.value })} />
              <p className="studio-label">Отступ</p>
              <input type="range" min={0} max={60} value={partCfg?.padding || 0} onChange={(e) => patchPart(selectedBlockData.id, selectedPart, { padding: +e.target.value })} />
              <button className="studio-chip" onClick={() => patchPart(selectedBlockData.id, selectedPart, { hidden: !partCfg?.hidden })}>{partCfg?.hidden ? <Eye /> : <EyeOff />}</button>
              <button className="studio-chip" onClick={() => patchPart(selectedBlockData.id, selectedPart, { detached: !partCfg?.detached })}><GripVertical /> {partCfg?.detached ? "Прикрепить" : "Открепить"}</button>
            </>
          )}

          <p className="studio-label">Детали внутри блока</p>
          <div className="studio-parts">
            {Array.from(canvasRef.current?.querySelectorAll<HTMLElement>(`[data-block-id="${selectedBlockData.id}"] [data-part-id]`) || []).map((el, i) => (
              <button key={i} onClick={() => { setMode("parts"); setSelectedPart(el.dataset.partId || null); }}><Layers /> {el.dataset.partName || el.dataset.partId}</button>
            ))}
          </div>
        </div>
      )}

      {!editing && isOwn && (
        <button
          className="studio-reenter studio-ui"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-4 w-4" /> Редактировать
        </button>
      )}

      {/* Modals */}
      {modal && (
        <div className="studio-modal-backdrop studio-ui" onClick={() => setModal(null)}>
          <div className="studio-modal" onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-head">
              <h3>{modal === "fonts" ? "Шрифты" : modal === "bg" ? "Фон профиля" : modal === "json" ? "Экспорт / Импорт JSON" : modal === "reset" ? (isMobile ? "Сбросить мобильный профиль?" : "Сбросить десктопный профиль?") : "Добавить блок"}</h3>
              <button aria-label="Закрыть" onClick={() => setModal(null)}><X /></button>
            </div>
            {modal === "fonts" && (
              <>
                <input className="studio-input" value={fontSample} onChange={(e) => setFontSample(e.target.value)} />
                <div className="studio-font-grid">
                  {FONTS.map((f) => (
                    <div key={f} className="studio-font-card">
                      <span style={{ fontFamily: `'${f}',sans-serif`, fontSize: f === "Press Start 2P" ? 11 : 18 }}>{fontSample || f}</span>
                      <small>{f}</small>
                      <div>
                        <button onClick={() => commit(withVariant(dataRef.current, { globalFont: f }))}>На профиль</button>
                        {selectedBlockData && <button onClick={() => patchBlock(selectedBlockData.id, { font: f })}>На блок</button>}
                        {selectedPart && <button onClick={() => patchPart(selectedBlockData.id, selectedPart, { font: f })}>На деталь</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {modal === "bg" && (
              <div className="studio-modal-body">
                <div className="studio-row">
                  <button className="studio-chip" onClick={() => { const v = getVariant(dataRef.current); commit(withVariant(dataRef.current, { pageBg: { ...v.pageBg, mode: v.pageBg.mode === "avatar" ? "default" : "avatar" } })); }}>🖼 Аватарка</button>
                  <button className="studio-chip" onClick={() => { const v = getVariant(dataRef.current); commit(withVariant(dataRef.current, { pageBg: { ...v.pageBg, layout: "full" } })); }}>Весь экран</button>
                  <button className="studio-chip" onClick={() => { const v = getVariant(dataRef.current); commit(withVariant(dataRef.current, { pageBg: { ...v.pageBg, layout: "banner" } })); }}>Только шапка</button>
                </div>
                <label className="studio-file">📁 Загрузить фон<input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0], (url) => { const v = getVariant(dataRef.current); commit(withVariant(dataRef.current, { pageBg: { ...v.pageBg, mode: "image", imageSrc: url } })); })} /></label>
                {(["blur", "dim", "zoom"] as const).map((k) => (
                  <label key={k} className="studio-range-label">{k}<input type="range" min={k === "zoom" ? 100 : 0} max={k === "zoom" ? 220 : k === "blur" ? 30 : 92} value={activeVariant.pageBg[k]} onChange={(e) => { const v = getVariant(dataRef.current); commit(withVariant(dataRef.current, { pageBg: { ...v.pageBg, [k]: +e.target.value } })); }} /></label>
                ))}
                <button className="studio-chip" onClick={() => commit(withVariant(dataRef.current, { pageBg: defaultPageBg() }))}>Сбросить фон</button>
              </div>
            )}
            {modal === "json" && (
              <div className="studio-modal-body">
                <textarea className="studio-json" value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
                <div className="studio-row">
                  <button className="studio-chip" onClick={() => { navigator.clipboard?.writeText(jsonText); toast.success("Скопировано"); }}>Скопировать</button>
                  <button className="studio-chip" onClick={() => {
                    try {
                      const parsed = JSON.parse(jsonText);
                      if (parsed && parsed.mobile && !isMobile) {
                        commit(normalizeData(parsed));
                      } else {
                        const fallback = isMobile ? emptyMobileConfig() : getVariant(emptyData(), false);
                        commit(withVariant(dataRef.current, normalizeVariant(parsed, fallback)));
                      }
                      toast.success("JSON применён");
                    } catch {
                      toast.error("Неверный JSON");
                    }
                  }}>Применить</button>
                </div>
              </div>
            )}
            {modal === "reset" && (
              <div className="studio-modal-body">
                <p>{isMobile ? "Сбросится только мобильный вид профиля. Десктопная версия останется нетронутой." : "Сбросится только десктопный вид профиля. Мобильная версия останется нетронутой."}</p>
                <div className="studio-row"><button className="studio-chip" onClick={() => setModal(null)}>Отмена</button><button className="studio-chip studio-danger" onClick={resetAll}>Сбросить всё</button></div>
              </div>
            )}
            {modal === "add" && (
              <>
                <div className="studio-modal-body studio-add-grid">
                  <button onClick={() => addBlock("stat")}><b><Bookmark /> Статистика</b></button>
                  <button onClick={() => addBlock("text")}><b><Type /> Текст</b></button>
                  <button onClick={() => addBlock("image")}><b><ImageIcon /> Изображение</b></button>
                  <label className="studio-add-upload"><b><Upload className="inline h-4 w-4" /> Загрузить фото</b><input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0], (url) => addBlock("image", url))} /></label>
                  <label className="studio-add-upload"><b><Video className="inline h-4 w-4" /> Загрузить видео</b><input type="file" accept="video/*" onChange={(e) => handleFile(e.target.files?.[0], (url) => addBlock("video", url))} /></label>
                </div>

                {activeVariant.trash.length > 0 && (
                  <div className="studio-trash">
                    <p className="studio-label">Удалённые блоки</p>
                    <div className="studio-trash-grid">
                      {activeVariant.trash.map((b) => (
                        <button key={b.id} onClick={() => restoreBlock(b.id)}>
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>{b.title || b.type}</span>
                          <small>Вернуть</small>
                        </button>
                      ))}
                    </div>
                    <button
                      className="studio-chip"
                      onClick={() => {
                        const d = dataRef.current;
                        const v = getVariant(d);
                        commit(withVariant(d, { blocks: [...v.blocks, ...v.trash], trash: [] }));
                        setModal(null);
                        toast.success("Все блоки восстановлены");
                      }}
                    >
                      <RotateCcw /> Вернуть все
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileStudio;
