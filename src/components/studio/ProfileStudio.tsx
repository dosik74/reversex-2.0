import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Move, MousePointer2, Type, Plus, Undo2, Save, FileJson, RotateCcw, Check,
  X, Settings2, Image as ImageIcon, Sparkles, ChevronUp, ChevronDown, Trash2,
  Eye, EyeOff, Layers, Link2, Video, Star, Trophy, Upload, Loader2, GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import supabase from "@/lib/supabase";
import { FONTS, defaultBg, defaultPageBg, defaultPart, emptyData, getDefaultBlocks, normalizeData } from "./defaults";
import type { Block, EditorMode, PartCfg, StudioData, StudioProfile } from "./types";
import "./studio.css";

const STATUS_PILLS = ["Смотрю", "В планах", "Просмотрено", "Отложено", "Брошено", "Избранное"];
const STAT_LABELS = ["ЗАКЛАДКИ", "ПОДПИСЧИКИ", "ПОДПИСКИ", "КОММЕНТАРИИ"];
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

async function loadProfile(userId: string): Promise<StudioProfile> {
  const [p, bm, friends, following, comments, lists] = await Promise.all([
    supabase.from("profiles").select("username,display_name,avatar_url,about_me,bio,level,xp").eq("id", userId).single(),
    supabase.from("content_bookmarks").select("title,poster_url,status,release_year,genre,content_type").eq("user_id", userId).limit(60),
    supabase.from("friendships").select("id", { count: "exact", head: true }).eq("status", "accepted").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("author_id", userId),
    supabase.from("top_lists").select("id,title").eq("user_id", userId).limit(3),
  ]);

  const listIds = (lists.data || []).map((l: any) => l.id);
  const itemsRes = listIds.length
    ? await supabase.from("top_list_items").select("top_list_id,item_id,title,poster_url,metadata").in("top_list_id", listIds).order("rank", { ascending: true })
    : { data: [] as any[] };
  const row: any = p.data || {};
  const palette = ["#14b8a6", "#0ea5e9", "#ec4899", "#f59e0b", "#ef4444", "#22c55e", "#eab308", "#8b5cf6"];

  return {
    username: row.username || "user",
    display_name: row.display_name || row.username || "USER",
    avatar_url: row.avatar_url || "",
    bio: row.about_me || row.bio || "",
    level: row.level ?? 1,
    xp: row.xp ?? 0,
    stats: {
      bookmarks: bm.data?.length || 0,
      followers: 0,
      following: following.count || 0,
      comments: comments.count || 0,
    },
    friendsCount: friends.count || 0,
    media: (bm.data || []).map((b: any, i: number) => ({
      title: b.title,
      year: Number(String(b.release_year || "0").slice(0, 4)) || 0,
      cat: TYPE_RU[b.content_type] || "Фильмы",
      status: STATUS_RU[b.status] || "Просмотрено",
      poster: b.poster_url || "",
      genre: b.genre || "",
      color: palette[i % palette.length],
    })),
    topLists: (lists.data || []).map((l: any) => {
      const items = (itemsRes.data || []).filter((it: any) => it.top_list_id === l.id);
      return {
        title: l.title,
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

interface Props { userId: string; onExit?: () => void; }

const ProfileStudio = ({ userId }: Props) => {
  const [editing, setEditing] = useState(true);
  const [isOwn, setIsOwn] = useState(false);
  const [data, setData] = useState<StudioData>(emptyData);
  const [mode, setMode] = useState<EditorMode>("blocks");
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [snap, setSnap] = useState(false);
  const [activeTab, setActiveTab] = useState("ЗАКЛАДКИ");
  const [activeStatus, setActiveStatus] = useState("Просмотрено");
  const [activeCat, setActiveCat] = useState("Все");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
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
    let active = true;
    (async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const own = authData.user?.id === userId;
        if (!active) return;
        setIsOwn(own);
        if (!own) setEditing(false);
        const [{ data: row }, profile] = await Promise.all([
          supabase.from("profiles").select("customization").eq("id", userId).single(),
          loadProfile(userId),
        ]);
        if (!active) return;
        const studio = normalizeData((row?.customization as any)?.studio);
        studio.profile = profile;
        studio.avatarSrc = profile.avatar_url || studio.avatarSrc;
        // Реальные значения statistics
        studio.blocks = studio.blocks.map((b) => {
          if (b.type !== "stat" || !b.meta) return b;
          const idx = STAT_LABELS.indexOf(b.meta.label);
          const values = [profile.stats.bookmarks, profile.stats.followers, profile.stats.following, profile.stats.comments];
          if (idx >= 0) {
            b.meta = { ...b.meta, val: String(values[idx]) };
            studio.texts[`${b.id}_val`] = String(values[idx]);
          }
          return b;
        });
        studio.texts["blk_header_username"] = (profile.display_name || profile.username).toUpperCase();
        studio.texts["blk_header_handle"] = "@" + profile.username;
        studio.texts["blk_header_lv"] = `✦ LV.${profile.level}`;
        studio.texts["blk_header_xp"] = `${profile.xp}/500 XP`;
        studio.texts["blk_level_num"] = String(profile.level);
        studio.texts["blk_level_pill"] = `LV.${profile.level}`;
        studio.texts["blk_level_xp"] = `${profile.xp}/500 XP`;
        studio.texts["blk_level_next"] = `-${Math.max(0, 500 - profile.xp)} NEXT`;
        studio.texts["blk_friends_count"] = String(profile.friendsCount);
        studio.texts["blk_bio_bio"] = profile.bio || "...";
        profile.topLists.slice(0, 3).forEach((l, i) => {
          studio.texts[`blk_toplists_i${i + 1}`] = l.title;
        });
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
  }, [userId, commit]);

  // ── Сохранение ──
  const saveToServer = useCallback(async (silent = false) => {
    if (!isOwn) return;
    try {
      const { data: row } = await supabase.from("profiles").select("customization").eq("id", userId).single();
      const customization = ((row?.customization as any) || {}) as Record<string, any>;
      const { profile, ...rest } = dataRef.current;
      customization.studio = rest;
      const { error } = await supabase.from("profiles").update({ customization }).eq("id", userId);
      if (error) throw error;
      if (!silent) toast.success("Профиль сохранён на сервере");
    } catch (e: any) {
      toast.error("Ошибка сохранения: " + (e?.message || "неизвестная"));
    }
  }, [userId, isOwn]);

  useEffect(() => {
    if (loading || !isOwn) return;
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
  }, [loading, saveToServer]);

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
    if (!file) return;
    toast.info("Загружаем файл...");
    uploadFile(file).then((url) => { cb(url); toast.success("Файл загружен"); })
      .catch((e) => toast.error("Ошибка загрузки: " + e.message));
  };

  const handleAvatarUpload = (file: File | undefined) => {
    if (!file) return;
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
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const d = dataRef.current;

      if (drag.kind === "block" || drag.kind === "resize-block") {
        const b = d.blocks.find((x) => x.id === drag.id);
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
        commit({ ...d, blocks: d.blocks.map((x) => (x.id === b.id ? next : x)) }, false);
      } else if (drag.kind === "part" || drag.kind === "resize-part") {
        const map = { ...d.parts, [drag.id]: { ...(d.parts[drag.id] || {}) } };
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
        commit({ ...d, parts: map }, false);
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
  }, [drag, snap, commit]);

  // ── Inline text ──
  useEffect(() => {
    if (loading) return;
    canvasRef.current?.querySelectorAll<HTMLElement>("[data-text-key]").forEach((el) => {
      el.contentEditable = editing && isOwn ? "true" : "false";
      el.classList.toggle("studio-text-editable", mode === "text");
      el.oninput = () => {
        const d = dataRef.current;
        commit({ ...d, texts: { ...d.texts, [el.dataset.textKey || ""]: el.innerHTML } }, false);
      };
    });
  }, [mode, loading, editing, isOwn, data.blocks, commit]);

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
    const texts = { ...dataRef.current.texts };
    canvasRef.current?.querySelectorAll<HTMLElement>("[data-text-key]").forEach((el) => {
      texts[el.dataset.textKey || ""] = el.innerHTML;
    });
    commit({ ...dataRef.current, texts }, false);
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
    commit({ ...d, blocks: d.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  };
  const patchPart = (blockId: string, partId: string, patch: Partial<PartCfg>) => {
    const d = dataRef.current;
    const map = { ...d.parts, [blockId]: { ...(d.parts[blockId] || {}) } };
    map[blockId][partId] = { ...defaultPart(), ...(map[blockId][partId] || {}), ...patch };
    commit({ ...d, parts: map });
  };
  const deleteBlock = (id: string) => {
    const d = dataRef.current;
    const removed = d.blocks.find((b) => b.id === id);
    if (!removed) return;
    commit({
      ...d,
      blocks: d.blocks.filter((b) => b.id !== id),
      trash: [removed, ...d.trash.filter((b) => b.id !== id)],
      parts: { ...d.parts, [id]: {} },
    });
    setSelectedBlock(null);
    toast.success("Блок удалён — его можно вернуть в меню «Добавить»");
  };

  const restoreBlock = (id: string) => {
    const d = dataRef.current;
    const block = d.trash.find((b) => b.id === id);
    if (!block) return;
    commit({
      ...d,
      trash: d.trash.filter((b) => b.id !== id),
      blocks: [...d.blocks, block],
    });
    setSelectedBlock(id);
    toast.success("Блок восстановлен");
  };

  const selectedBlockData = data.blocks.find((b) => b.id === selectedBlock) || null;
  const partCfg = selectedBlock && selectedPart ? data.parts[selectedBlock]?.[selectedPart] : null;

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
      id, type: kind, title: kind, x: 420, y: 240, w: 300, h: 180, z: 40,
      rotation: 0, radius: 18, opacity: 1, hidden: false, locked: false, pinned: false,
      overflowHidden: true, font: "", bg: defaultBg(),
    };
    if (kind === "stat") Object.assign(base, { type: "stat", w: 290, h: 86, meta: { icon: "bookmark", val: "99", label: "ЛЮБИМЫЕ" } });
    if (kind === "text") Object.assign(base, { type: "customText", title: "Текстовый блок", w: 340, h: 120 });
    if (kind === "image") Object.assign(base, { type: "customImage", title: "Картинка", w: 320, h: 400, meta: { src: url || "" } });
    if (kind === "video") Object.assign(base, { type: "customVideo", title: "Видео", w: 480, h: 280, meta: { src: url || "" } });
    const d = dataRef.current;
    commit({ ...d, blocks: [...d.blocks, base] });
    setSelectedBlock(id);
    setModal(null);
    toast.success("Блок добавлен");
  };

  const resetAll = () => {
    commit(emptyData(), false);
    history.current = [];
    historyIdx.current = -1;
    setModal(null);
    setSelectedBlock(null);
    void saveToServer(true);
    toast.success("Профиль сброшен");
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#090a0f] text-zinc-400"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Загрузка профиля...</div>;
  }

  // ── Рендер блоков ──
  const tx = (key: string, fallback: string) => (
    <span
      data-text-key={key}
      className="studio-t"
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: data.texts[key] ?? fallback }}
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
          if (mode !== "parts") return;
          e.stopPropagation();
          setSelectedBlock(b.id);
          setSelectedPart(id);
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const cfg = data.parts[b.id]?.[id] || defaultPart();
          setDrag({ kind: "part", id: b.id, partId: id, startX: e.clientX, startY: e.clientY, orig: { x: cfg.x, y: cfg.y } });
        }}
      >{children}</span>
    );

    switch (b.type) {
      case "avatar":
        return (
          <div className="flex h-full w-full items-center justify-center" onDoubleClick={(e) => { e.stopPropagation(); avatarInputRef.current?.click(); }} title="Двойной клик — заменить фото">
            <div className="h-full w-full rounded-full p-1.5 avatar-ring overflow-hidden">
              <img src={data.avatarSrc} alt="" className="h-full w-full rounded-full object-cover" />
            </div>
            <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full bg-emerald-400 border-[3px] border-[#090a0f]" />
          </div>
        );
      case "header":
        return (
          <div className="flex h-full flex-col justify-center gap-2 px-1">
            <div className="font-display text-[38px] font-black leading-none tracking-tight text-white">{tx("blk_header_username", "DOSIKTE")}</div>
            <div className="self-start rounded-full border border-teal-500/35 bg-teal-500/15 px-3 py-0.5 text-xs font-semibold text-cyan-300">{tx("blk_header_handle", "@user")}</div>
            <div className="mt-0.5 flex items-center gap-2.5">
              <div className="rounded-lg border border-sky-500/30 bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">{tx("blk_header_lv", "✦ LV.1")}</div>
              <div className="h-1.5 w-36 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-1/6 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500" /></div>
              <div className="font-mono text-[11px] text-slate-400">{tx("blk_header_xp", "0/500 XP")}</div>
            </div>
          </div>
        );
      case "actions":
        return (
          <div className="flex h-full w-full items-center justify-end gap-2">
            <button className="rounded-xl border border-[#1e222e] bg-[#10121a] px-3.5 text-xs font-semibold text-slate-200">{tx("blk_actions_btnBm", "🔖 Закладки")}</button>
            <button className="rounded-xl bg-cyan-400 px-4 text-xs font-extrabold text-[#04161c]">{tx("blk_actions_btnEdit", "✦ Редактировать")}</button>
            <button onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => toast.success("Ссылка скопирована"))} className="rounded-xl border border-[#1e222e] bg-[#10121a] px-3.5 text-xs font-semibold text-slate-200">{tx("blk_actions_btnShare", "↗ Поделиться")}</button>
          </div>
        );
      case "stat": {
        const m = b.meta || {};
        return (
          <div className="flex h-full w-full items-center gap-4 px-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10 text-teal-400"><Star className="h-5 w-5" /></div>
            <div className="flex min-w-0 flex-col">
              <div className="font-display text-[28px] font-extrabold leading-none text-white">{tx(`${b.id}_val`, m.val || "0")}</div>
              <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{tx(`${b.id}_label`, m.label || "")}</div>
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
                <div className="text-xs font-bold text-white"><span className="text-cyan-300">👑</span> Уровень</div>
                <div className="rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300">{tx("blk_level_pill", "LV.1")}</div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"><div className="h-full w-0 rounded-full bg-cyan-400" /></div>
              <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-500"><span>{tx("blk_level_xp", "0/500 XP")}</span><span>{tx("blk_level_next", "-500 NEXT")}</span></div>
            </div>
          </div>
        );
      case "friends":
        return (
          <div className="flex h-full w-full flex-col p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-bold text-white"><span className="text-cyan-300">👥</span> Друзья</div>
              <div className="font-mono text-xs text-cyan-300">{tx("blk_friends_count", "0")}</div>
            </div>
            <div className="flex flex-1 items-center justify-center text-xs italic text-slate-500">Друзей пока нет...</div>
          </div>
        );
      case "bmCard":
        return (
          <div className="flex h-full w-full items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/15 text-teal-400"><Star className="h-4 w-4" /></div>
              <div className="min-w-0"><div className="truncate text-xs font-bold text-white">Закладки пользователя</div><div className="truncate text-[11px] text-slate-400">Все фильмы, сериалы, игры</div></div>
            </div>
            <span className="text-slate-400">→</span>
          </div>
        );
      case "topLists":
        return (
          <div className="flex h-full w-full flex-col gap-2 p-4">
            <div className="mb-1 flex items-center justify-between"><div className="text-xs font-bold text-white"><span className="text-cyan-300">↗</span> Топ списки</div><div className="font-mono text-xs text-slate-500">{data.profile?.topLists.length || 0}</div></div>
            {(data.profile?.topLists || []).slice(0, 3).map((l, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 p-2.5">
                <span className="font-display text-xs font-bold text-cyan-300">#{i + 1}</span>
                {l.poster && <img src={l.poster} alt="" className="h-11 w-8 rounded object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}
                <div className="min-w-0"><div className="truncate text-xs font-semibold text-white">{l.title}</div><div className="text-[10px] text-cyan-300">Топ-50</div></div>
              </div>
            ))}
          </div>
        );
      case "bio":
        return <div className="flex h-full w-full items-center px-4 text-sm text-slate-200">{tx("blk_bio_bio", "...")}</div>;
      case "tabs":
        return (
          <div className="flex h-full w-full items-center gap-2 rounded-full bg-[#10121a] p-1.5">
            {["TOP50", "ЗАКЛАДКИ", "ACTIVITY", "THEME"].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`studio-tab flex-1 rounded-full py-2 text-[11px] font-bold tracking-wider ${activeTab === t ? "rx-btn-cyan" : "text-slate-400 hover:text-white"}`}>
                {t === "TOP50" ? "★ TOP50" : t === "ЗАКЛАДКИ" ? "🔖 ЗАКЛАДКИ" : t === "ACTIVITY" ? "📅 ACTIVITY" : "✦ THEME"}
              </button>
            ))}
          </div>
        );
      case "bmBanner":
        return (
          <div className="flex h-full w-full items-center justify-between px-4">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/15 text-teal-400"><Star className="h-4 w-4" /></div><div><div className="text-xs font-bold text-white">Закладки и списки пользователя</div><div className="text-[11px] text-slate-400">Всего в коллекции: {data.profile?.stats.bookmarks || 0} тайтлов</div></div></div>
            <button onClick={() => window.location.href = "/bookmarks"} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">Открыть отдельной страницей ↗</button>
          </div>
        );
      case "filters":
        return (
          <div className="flex h-full w-full flex-wrap items-center gap-2">
            {STATUS_PILLS.map((s, i) => (
              <button key={s} onClick={() => setActiveStatus(s)} className={`rounded-xl px-3.5 py-2 text-xs font-semibold ${activeStatus === s ? "bg-violet-600 text-white shadow-lg shadow-purple-600/35" : "border border-[#1e222e] bg-[#10121a] text-slate-300"}`}>
                {["▶", "◷", "✓", "⏸", "✕", "☆"][i]} {s}
                <span className="ml-2 rounded-md bg-black/25 px-1.5 py-0.5 text-[10px]">{[0, 2, data.profile?.stats.bookmarks || 0, 0, 0, 0][i]}</span>
              </button>
            ))}
          </div>
        );
      case "collection":
        return (
          <div className="flex h-full w-full flex-col gap-3 overflow-y-auto p-4">
            {activeTab === "TOP50" ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-3"><h2 className="font-display text-2xl font-black text-white">МОЙ ТОП 50</h2><span className="text-xs text-slate-400">{(data.profile?.topLists[0]?.items || []).length} / 50</span></div>
                  <button onClick={() => (window.location.href = "/tier-lists")} className="rounded-full bg-amber-400 px-4 py-2 text-xs font-black text-black">+ Добавить</button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {(data.profile?.topLists[0]?.items || []).map((it, i) => (
                    <div key={i} className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/80">
                      <div className="absolute left-1.5 top-0 z-10 font-display text-4xl italic font-black text-amber-300">{i + 1}</div>
                      <div className="aspect-[2/3] w-full bg-slate-800">{it.poster && <img src={it.poster} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}</div>
                      <div className="p-2 text-[11px] font-bold text-white truncate">{it.title}</div>
                    </div>
                  ))}
                  {!data.profile?.topLists[0]?.items.length && <div className="col-span-full py-10 text-center text-sm text-slate-400">Список пока пуст. Нажми «+ Добавить».</div>}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {["Все", "Фильмы", "Сериалы", "Аниме", "Игры"].map((c) => (
                      <button key={c} onClick={() => setActiveCat(c)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${activeCat === c ? "bg-white/10 text-white" : "text-slate-400"}`}>{c}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию..." className="w-44 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none">
                      <option value="date">По дате</option><option value="title">По названию</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  {media.map((m, i) => (
                    <div key={i} className="group flex min-h-[140px] items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#10121a]/85 p-3 transition hover:border-violet-400/50 sm:gap-5 sm:p-4">
                      <span className="w-5 shrink-0 text-center text-sm font-black tabular-nums text-slate-500 sm:w-8">{i + 1}</span>
                      <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-xl sm:w-20">
                        <img src={m.poster || "https://placehold.co/300x450/10121a/22d3ee?text=RX"} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex flex-wrap items-baseline gap-2"><h3 className="truncate font-display text-base font-black text-white sm:text-xl md:text-2xl">{m.title}</h3><span className="font-mono text-xs text-slate-400">{m.year}</span></div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-bold text-slate-200">{m.cat}</span>{m.genre && <span>· {m.genre}</span>}</div>
                        <div className="mt-2.5"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" />{m.status}</span></div>
                      </div>
                    </div>
                  ))}
                  {!media.length && <div className="py-10 text-center text-xs text-slate-500">В этом списке пока нет тайтлов</div>}
                </div>
              </>
            )}
          </div>
        );
      case "top50":
        return (
          <div className="flex h-full w-full flex-col p-4">
            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-black text-white"><span className="text-amber-300">🏆</span> МОЙ ТОП 50</div><button onClick={() => setActiveTab("TOP50")} className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-bold text-amber-300">Открыть →</button></div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {(data.profile?.topLists[0]?.items || []).map((it, i) => (
                <div key={i} className="w-[130px] shrink-0">
                  <div className="font-display text-4xl italic font-black leading-none text-amber-300">{i + 1}</div>
                  <div className="aspect-[2/3] w-full overflow-hidden rounded-xl border border-amber-400/30 bg-slate-800">{it.poster && <img src={it.poster} alt="" className="h-full w-full object-cover" />}</div>
                  <div className="mt-1.5 truncate text-[11px] font-bold text-white">{it.title}</div>
                </div>
              ))}
              {!data.profile?.topLists[0]?.items.length && <div className="py-10 text-slate-500">Нажми «Топ 50», чтобы открыть список</div>}
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

  const canvasWidth = Math.max(1360, ...data.blocks.map((b) => b.x + b.w + 80));
  const canvasHeight = Math.max(1180, ...data.blocks.map((b) => b.y + b.h + 180));

  return (
    <div className="studio-shell" style={{ fontFamily: data.globalFont ? `'${data.globalFont}', sans-serif` : undefined }}>
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { handleAvatarUpload(e.target.files?.[0]); e.target.value = ""; }}
      />
      {/* Фон страницы */}
      <div
        className={`studio-page-bg ${data.pageBg.layout === "banner" ? "banner" : "full"}`}
        style={{
          backgroundImage: data.pageBg.mode === "avatar" ? `url(${data.avatarSrc})` : data.pageBg.imageSrc ? `url(${data.pageBg.imageSrc})` : undefined,
          filter: `blur(${data.pageBg.blur}px)`,
          transform: `scale(${data.pageBg.zoom / 100})`,
          opacity: 1 - data.pageBg.dim / 100,
          display: data.pageBg.mode === "default" ? "none" : "block",
        }}
      />

      {/* Холст */}
      <div ref={canvasRef} className="studio-canvas relative mx-auto" style={{ width: canvasWidth, minHeight: canvasHeight }}>
        {data.blocks.map((b) => {
          const isSelected = selectedBlock === b.id;
          const partMap = data.parts[b.id] || {};
          return (
            <div
              key={b.id}
              data-block-id={b.id}
              className={`rx-block absolute ${isSelected ? "is-selected" : ""}`}
              style={{
                left: b.x, top: b.y, width: b.w, height: b.h, zIndex: b.z,
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
      {editing && isOwn && <div className="studio-toolbar studio-ui">
        {(["blocks", "parts", "text"] as EditorMode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`studio-tool ${mode === m ? "is-active" : ""}`}>
            {m === "blocks" ? <Move /> : m === "parts" ? <MousePointer2 /> : <Type />}
            {m === "blocks" ? "Блоки" : m === "parts" ? "Детали" : "Текст"}
          </button>
        ))}
        <span className="studio-divider" />
        <button className="studio-tool" onClick={() => setModal("add")}><Plus /> Добавить</button>
        <button className="studio-tool" onClick={() => setModal("fonts")}><Sparkles /> Шрифты</button>
        <button className="studio-tool" onClick={() => setModal("bg")}><ImageIcon /> Фон</button>
        <button className={`studio-tool ${snap ? "is-active" : ""}`} onClick={() => setSnap(!snap)}><Settings2 /> Сетка</button>
        <span className="studio-divider" />
        <button className="studio-tool" onClick={undo}><Undo2 /></button>
        <button className="studio-tool" onClick={() => { setJsonText(JSON.stringify(data, null, 2)); setModal("json"); }}><FileJson /> JSON</button>
        <button className="studio-tool" onClick={() => setModal("reset")}><RotateCcw /> Сброс</button>
        <button className="studio-tool studio-save" onClick={() => void saveToServer()} disabled={saving}><Save /> {saving ? "..." : "Сохранить"}</button>
        <button className="studio-tool studio-done" onClick={() => { void saveToServer(true); setEditing(false); setSelectedBlock(null); setSelectedPart(null); toast.success("Готово! Изменения сохранены"); }}><Check /> Готово</button>
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
                {selectedBlockData.pinned && <span className="text-[10px] text-cyan-300">Закреплён</span>}
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
          <Sparkles className="h-4 w-4" /> Редактировать профиль
        </button>
      )}

      {/* Modals */}
      {modal && (
        <div className="studio-modal-backdrop studio-ui" onClick={() => setModal(null)}>
          <div className="studio-modal" onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-head">
              <h3>{modal === "fonts" ? "Пак шрифтов на кириллице" : modal === "bg" ? "Фон всей страницы" : modal === "json" ? "Экспорт / Импорт JSON" : modal === "reset" ? "Сбросить профиль?" : "Добавить блок"}</h3>
              <button onClick={() => setModal(null)}><X /></button>
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
                        <button onClick={() => commit({ ...dataRef.current, globalFont: f })}>На профиль</button>
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
                  <button className="studio-chip" onClick={() => commit({ ...dataRef.current, pageBg: { ...data.pageBg, mode: data.pageBg.mode === "avatar" ? "default" : "avatar" } })}>🖼 Аватарка</button>
                  <button className="studio-chip" onClick={() => commit({ ...dataRef.current, pageBg: { ...data.pageBg, layout: "full" } })}>Весь экран</button>
                  <button className="studio-chip" onClick={() => commit({ ...dataRef.current, pageBg: { ...data.pageBg, layout: "banner" } })}>Только шапка</button>
                </div>
                <label className="studio-file">📁 Загрузить фон<input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0], (url) => commit({ ...dataRef.current, pageBg: { ...data.pageBg, mode: "image", imageSrc: url } }))} /></label>
                {(["blur", "dim", "zoom"] as const).map((k) => (
                  <label key={k} className="studio-range-label">{k}<input type="range" min={k === "zoom" ? 100 : 0} max={k === "zoom" ? 220 : k === "blur" ? 30 : 92} value={data.pageBg[k]} onChange={(e) => commit({ ...dataRef.current, pageBg: { ...data.pageBg, [k]: +e.target.value } })} /></label>
                ))}
                <button className="studio-chip" onClick={() => commit({ ...dataRef.current, pageBg: defaultPageBg() })}>Сбросить фон</button>
              </div>
            )}
            {modal === "json" && (
              <div className="studio-modal-body">
                <textarea className="studio-json" value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
                <div className="studio-row">
                  <button className="studio-chip" onClick={() => { navigator.clipboard?.writeText(jsonText); toast.success("Скопировано"); }}>Скопировать</button>
                  <button className="studio-chip" onClick={() => { try { commit(normalizeData(JSON.parse(jsonText))); toast.success("JSON применён"); } catch { toast.error("Неверный JSON"); } }}>Применить</button>
                </div>
              </div>
            )}
            {modal === "reset" && (
              <div className="studio-modal-body">
                <p>Все блоки, шрифты и фоны будут удалены.</p>
                <div className="studio-row"><button className="studio-chip" onClick={() => setModal(null)}>Отмена</button><button className="studio-chip studio-danger" onClick={resetAll}>Сбросить всё</button></div>
              </div>
            )}
            {modal === "add" && (
              <>
                <div className="studio-modal-body studio-add-grid">
                  <button onClick={() => addBlock("stat")}><b>Карточка статистики</b><small>Иконка + число + подпись</small></button>
                  <button onClick={() => addBlock("text")}><b>Текстовый блок</b><small>Заголовок и заметка</small></button>
                  <button onClick={() => addBlock("image")}><b>Картинка / Стикер</b><small>Своё фото можно загрузить ниже</small></button>
                  <label className="studio-add-upload"><b><Upload className="inline h-4 w-4" /> Своё фото</b><small>Загрузить с устройства</small><input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0], (url) => addBlock("image", url))} /></label>
                  <label className="studio-add-upload"><b><Video className="inline h-4 w-4" /> Своё видео</b><small>Любой ролик в профиль</small><input type="file" accept="video/*" onChange={(e) => handleFile(e.target.files?.[0], (url) => addBlock("video", url))} /></label>
                </div>

                {data.trash.length > 0 && (
                  <div className="studio-trash">
                    <p className="studio-label">Удалённые блоки — нажми, чтобы вернуть</p>
                    <div className="studio-trash-grid">
                      {data.trash.map((b) => (
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
                        commit({ ...d, blocks: [...d.blocks, ...d.trash], trash: [] });
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
