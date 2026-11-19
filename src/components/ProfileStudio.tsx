import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles, Move, MousePointer2, Type, Plus, Undo2, Save, FileJson,
  RotateCcw, Check, X, Settings2, Image as ImageIcon, Palette,
  ChevronUp, ChevronDown, Trash2, Eye, EyeOff, Layers, Link2,
} from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "reversex_profile_studio_site_v1";

const FONTS = [
  "Inter", "Unbounded", "Russo One", "Dela Gothic One", "Rubik Glitch",
  "Rubik Mono One", "Press Start 2P", "JetBrains Mono", "Oswald",
  "Montserrat", "Playfair Display", "Caveat", "Comfortaa", "Marck Script",
  "Kelly Slab", "Alumni Sans", "Poiret One", "Amatic SC",
];

type Bg = {
  mode: "default" | "color" | "image" | "avatar";
  color: string;
  alpha: number;
  imageSrc: string;
  blur: number;
  dim: number;
  zoom: number;
};

type BlockCfg = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  rotation: number;
  radius: number;
  opacity: number;
  hidden: boolean;
  font: string;
  bg: Bg;
};

type PartCfg = {
  font: string;
  fontSize: number;
  color: string;
  hidden: boolean;
  padding: number;
};

type Widget = {
  id: string;
  kind: "stat" | "text" | "image" | "button";
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  value: string;
  caption: string;
  url: string;
  src: string;
};

type StudioState = {
  blocks: Record<string, BlockCfg>;
  parts: Record<string, PartCfg>;
  pageBg: {
    mode: "default" | "avatar" | "image";
    imageSrc: string;
    layout: "full" | "banner";
    blur: number;
    dim: number;
    zoom: number;
  };
  globalFont: string;
  texts: Record<string, string>;
  widgets: Widget[];
};

const defaultBg = (): Bg => ({
  mode: "default", color: "#10121a", alpha: 92, imageSrc: "", blur: 0, dim: 45, zoom: 100,
});

const emptyState = (): StudioState => ({
  blocks: {},
  parts: {},
  pageBg: { mode: "default", imageSrc: "", layout: "full", blur: 6, dim: 65, zoom: 106 },
  globalFont: "Inter",
  texts: {},
  widgets: [],
});

const BLOCK_NAMES: Record<string, string> = {
  hero: "Шапка профиля",
  stat: "Карточка статистики",
  sidebar: "Сайдбар",
  content: "Основной контент",
  tabs: "Вкладки профиля",
};

const PART_NAMES: Record<string, string> = {
  avatar: "Аватарка",
  name: "Имя",
  handle: "Ник",
  "stat-value": "Число",
  "stat-label": "Подпись",
};

const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const readStored = (): StudioState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const data = JSON.parse(raw);
    return {
      ...emptyState(),
      ...data,
      pageBg: { ...emptyState().pageBg, ...(data.pageBg || {}) },
      blocks: data.blocks || {},
      parts: data.parts || {},
      texts: data.texts || {},
      widgets: data.widgets || [],
    };
  } catch {
    return emptyState();
  }
};

type Props = { enabled: boolean; onExit: () => void };

const ProfileStudio = ({ enabled, onExit }: Props) => {
  const [data, setData] = useState<StudioState>(readStored);
  const [mode, setMode] = useState<"blocks" | "parts" | "text">("blocks");
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [snap, setSnap] = useState(false);
  const [modal, setModal] = useState<"fonts" | "bg" | "json" | "reset" | "add" | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [fontSample, setFontSample] = useState("DOSIKTE — Закладки 37");
  const [drag, setDrag] = useState<null | {
    kind: "move" | "resize";
    target: string;
    dir?: string;
    startX: number;
    startY: number;
    orig: any;
  }>(null);
  const [inline, setInline] = useState<null | { x: number; y: number }>(null);
  const historyRef = useRef<StudioState[]>([]);
  const historyIdx = useRef(-1);

  const rootRef = useRef<HTMLElement | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const commit = useCallback((next: StudioState, record = true) => {
    setData(next);
    if (record) {
      historyRef.current = historyRef.current.slice(0, historyIdx.current + 1);
      historyRef.current.push(JSON.parse(JSON.stringify(next)));
      if (historyRef.current.length > 35) historyRef.current.shift();
      historyIdx.current = historyRef.current.length - 1;
    }
  }, []);

  const patchBlock = (id: string, patch: Partial<BlockCfg>) => {
    const cur = dataRef.current;
    commit({ ...cur, blocks: { ...cur.blocks, [id]: { ...cur.blocks[id], ...patch } } });
  };
  const patchPart = (id: string, patch: Partial<PartCfg>) => {
    const cur = dataRef.current;
    commit({ ...cur, parts: { ...cur.parts, [id]: { ...cur.parts[id], ...patch } } });
  };

  // Первый запуск: запоминаем исходную геометрию блоков
  useEffect(() => {
    if (!enabled) return;
    rootRef.current = document.querySelector<HTMLElement>("[data-studio-root]");
    const root = rootRef.current;
    if (!root) return;
    const cur = dataRef.current;
    const blocks = { ...cur.blocks };
    let changed = false;
    root.querySelectorAll<HTMLElement>("[data-studio-block]").forEach((el, i) => {
      const id = `${el.dataset.studioBlock}-${i}`;
      const r = el.getBoundingClientRect();
      if (!blocks[id]) {
        blocks[id] = {
          id, x: 0, y: 0, w: Math.round(r.width), h: Math.round(r.height),
          z: 10, rotation: 0, radius: 18, opacity: 100, hidden: false,
          font: "", bg: defaultBg(),
        };
        changed = true;
      }
    });
    if (changed) {
      const next = { ...cur, blocks };
      setData(next);
      historyRef.current = [JSON.parse(JSON.stringify(next))];
      historyIdx.current = 0;
    }
  }, [enabled]);

  // Применяем стили к блокам и деталям
  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;
    const d = data;

    root.style.fontFamily = d.globalFont ? `'${d.globalFont}', sans-serif` : "";
    root.querySelectorAll<HTMLElement>("[data-studio-block]").forEach((el, i) => {
      const id = `${el.dataset.studioBlock}-${i}`;
      const cfg = d.blocks[id];
      if (!cfg) return;
      el.style.transform = `translate(${cfg.x}px, ${cfg.y}px) rotate(${cfg.rotation}deg)`;
      el.style.width = `${cfg.w}px`;
      el.style.height = cfg.h ? `${cfg.h}px` : "";
      el.style.zIndex = String(cfg.z);
      el.style.borderRadius = `${cfg.radius}px`;
      el.style.opacity = String(cfg.opacity / 100);
      el.style.display = cfg.hidden ? "none" : "";
      if (cfg.font) el.style.fontFamily = `'${cfg.font}', sans-serif`;
      const bg = cfg.bg;
      if (bg.mode === "color") {
        el.style.background = hexToRgba(bg.color, bg.alpha / 100);
        el.style.backdropFilter = "";
      } else if (bg.mode === "image" && bg.imageSrc) {
        el.style.backgroundImage = `linear-gradient(rgba(9,10,15,${bg.dim / 100}), rgba(9,10,15,${bg.dim / 100})), url(${bg.imageSrc})`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.style.filter = bg.blur ? `blur(${bg.blur}px)` : "";
      } else {
        el.style.background = "";
        el.style.filter = "";
      }
    });

    root.querySelectorAll<HTMLElement>("[data-studio-part]").forEach((el, i) => {
      const key = el.dataset.studioPart || `part-${i}`;
      const fullKey = `${selectedBlock || "global"}:${key}`;
      const cfg = d.parts[fullKey] || d.parts[key];
      if (!cfg) return;
      el.style.fontFamily = cfg.font ? `'${cfg.font}', sans-serif` : "";
      el.style.fontSize = cfg.fontSize ? `${cfg.fontSize}px` : "";
      el.style.color = cfg.color || "";
      el.style.padding = cfg.padding ? `${cfg.padding}px` : "";
      el.style.display = cfg.hidden ? "none" : "";
    });

    Object.entries(d.texts).forEach(([key, html]) => {
      const el = root.querySelector<HTMLElement>(`[data-studio-text="${key}"]`);
      if (el && el.innerHTML !== html) el.innerHTML = html;
    });
  }, [data, enabled, selectedBlock]);

  // Фон всей страницы
  useEffect(() => {
    const el = document.getElementById("studio-page-bg");
    if (!el) return;
    const bg = data.pageBg;
    el.style.display = bg.mode === "default" ? "none" : "block";
    el.style.backgroundImage =
      bg.mode === "avatar"
        ? "url(https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80)"
        : bg.imageSrc ? `url(${bg.imageSrc})` : "";
    el.style.filter = `blur(${bg.blur}px)`;
    el.style.transform = `scale(${bg.zoom / 100})`;
    el.style.opacity = String(1 - bg.dim / 100);
    el.className =
      bg.layout === "banner"
        ? "fixed inset-x-0 top-0 h-[360px] pointer-events-none z-0"
        : "fixed inset-0 pointer-events-none z-0";
  }, [data.pageBg]);

  // Режим редактирования: выделение и перетаскивание
  useEffect(() => {
    if (!enabled || mode === "text") return;
    const root = rootRef.current;
    if (!root) return;

    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-studio-ui]")) return;
      if (mode === "parts") {
        const part = target.closest<HTMLElement>("[data-studio-part]");
        if (!part) return;
        setSelectedPart(part.dataset.studioPart || null);
        return;
      }
      const block = target.closest<HTMLElement>("[data-studio-block]");
      if (!block) {
        setSelectedBlock(null);
        return;
      }
      const id = Array.from(root.querySelectorAll<HTMLElement>("[data-studio-block]")).indexOf(block);
      const blkId = `${block.dataset.studioBlock}-${id}`;
      setSelectedBlock(blkId);
      const cfg = dataRef.current.blocks[blkId];
      if (!cfg || cfg.hidden) return;
      e.preventDefault();
      e.stopPropagation();
      setDrag({
        kind: "move", target: blkId, startX: e.clientX, startY: e.clientY,
        orig: { x: cfg.x, y: cfg.y },
      });
    };

    root.addEventListener("pointerdown", onDown, true);
    return () => root.removeEventListener("pointerdown", onDown, true);
  }, [enabled, mode]);

  // Перемещение / ресайз
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const cfg = dataRef.current.blocks[drag.target];
      if (!cfg) return;
      const snapV = (v: number) => (snap ? Math.round(v / 8) * 8 : Math.round(v));
      if (drag.kind === "move") {
        patchBlock(drag.target, { x: snapV(drag.orig.x + dx), y: snapV(drag.orig.y + dy) });
      } else {
        const dir = drag.dir || "";
        let { x, y, w, h } = drag.orig;
        if (dir.includes("e")) w = Math.max(40, snapV(w + dx));
        if (dir.includes("s")) h = Math.max(40, snapV(h + dy));
        if (dir.includes("w")) { w = Math.max(40, snapV(w - dx)); x = snapV(drag.orig.x + drag.orig.w - w); }
        if (dir.includes("n")) { h = Math.max(40, snapV(h - dy)); y = snapV(drag.orig.y + drag.orig.h - h); }
        patchBlock(drag.target, { x, y, w, h });
      }
    };
    const onUp = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, snap]);

  //contentEditable + inline toolbar
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>("[data-studio-text]").forEach((el) => {
      el.contentEditable = enabled && mode === "text" ? "true" : "false";
      el.classList.toggle("studio-text-editable", enabled && mode === "text");
    });
  }, [enabled, mode, data]);

  const captureTexts = useCallback(() => {
    const root = rootRef.current;
    if (!root) return dataRef.current;
    const texts = { ...dataRef.current.texts };
    root.querySelectorAll<HTMLElement>("[data-studio-text]").forEach((el) => {
      texts[el.dataset.studioText || ""] = el.innerHTML;
    });
    return { ...dataRef.current, texts };
  }, []);

  const saveAll = useCallback(() => {
    const next = captureTexts();
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    toast.success("Все изменения сохранены!");
  }, [captureTexts]);

  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return toast.info("Больше нет действий");
    historyIdx.current -= 1;
    const prev = historyRef.current[historyIdx.current];
    setData(prev);
    toast.info("Отменено");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!enabled) return;
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveAll(); }
      if (e.key === "Escape") { setModal(null); setInline(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, undo, saveAll]);

  // Inline-редактирование выделенного текста
  useEffect(() => {
    if (!enabled || mode !== "text") return;
    const onUp = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (!sel || !text || sel.rangeCount === 0) { setInline(null); return; }
      const range = sel.getRangeAt(0);
      const el = (range.commonAncestorContainer.nodeType === 1
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement) as HTMLElement;
      if (!el?.closest("[data-studio-text]")) { setInline(null); return; }
      const rect = range.getBoundingClientRect();
      setInline({ x: Math.min(window.innerWidth - 260, rect.left), y: Math.max(60, rect.top - 60) });
    };
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, [enabled, mode]);

  const execInline = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    const next = captureTexts();
    setData(next);
    historyRef.current.push(JSON.parse(JSON.stringify(next)));
    historyIdx.current = historyRef.current.length - 1;
  };

  const selectedCfg = selectedBlock ? data.blocks[selectedBlock] : null;
  const partKey = selectedBlock ? `${selectedBlock}:${selectedPart}` : selectedPart || "";
  const selectedPartCfg = data.parts[partKey] || (selectedPart ? data.parts[selectedPart] : null);

  const blockElements = useMemo(() => {
    const root = rootRef.current;
    if (!root || !enabled) return [];
    return Array.from(root.querySelectorAll<HTMLElement>("[data-studio-block]"));
  }, [enabled, data]);

  const selectedEl = selectedBlock ? blockElements.find((_, i) => `${_.dataset.studioBlock}-${i}` === selectedBlock) : null;
  const selRect = selectedEl?.getBoundingClientRect();

  const addWidget = (kind: Widget["kind"]) => {
    const id = `widget-${Date.now()}`;
    const widget: Widget = {
      id, kind, x: 80, y: 140, w: kind === "image" ? 240 : 300, h: kind === "image" ? 200 : 100,
      label: "Новая кнопка", value: "99", caption: "МОИ ЛЮБИМЫЕ",
      url: "", src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    };
    commit({ ...dataRef.current, widgets: [...dataRef.current.widgets, widget] });
    setModal(null);
    toast.success("Блок добавлен");
  };

  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(emptyState());
    historyRef.current = [];
    historyIdx.current = -1;
    setModal(null);
    setSelectedBlock(null);
    toast.success("Профиль сброшен");
  };

  if (!enabled) return null;

  return (
    <div data-studio-ui className="studio-root">
      <div id="studio-page-bg" />

      {/* Рамка и ручки выбранного блока */}
      {selectedCfg && selRect && (
        <>
          <div
            className="studio-selection"
            style={{
              left: selRect.left + window.scrollX,
              top: selRect.top + window.scrollY,
              width: selRect.width,
              height: selRect.height,
            }}
          />
          {mode === "blocks" && ["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((dir) => (
            <div
              key={dir}
              className={`studio-handle h-${dir}`}
              style={{
                left: selRect.left + window.scrollX + (dir.includes("e") ? selRect.width : 0),
                top: selRect.top + window.scrollY + (dir.includes("s") ? selRect.height : 0),
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDrag({
                  kind: "resize", target: selectedCfg.id, dir,
                  startX: e.clientX, startY: e.clientY,
                  orig: { x: selectedCfg.x, y: selectedCfg.y, w: selectedCfg.w, h: selectedCfg.h },
                });
              }}
            />
          ))}
        </>
      )}

      {/* Нижняя панель конструктора */}
      <div className="studio-toolbar" data-studio-ui>
        {(["blocks", "parts", "text"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); toast.info(m === "blocks" ? "Режим БЛОКИ" : m === "parts" ? "Режим ДЕТАЛИ ВНУТРИ" : "Режим ТЕКСТ"); }}
            className={`studio-tool ${mode === m ? "is-active" : ""}`}
          >
            {m === "blocks" ? <Move /> : m === "parts" ? <MousePointer2 /> : <Type />}
            {m === "blocks" ? "Блоки" : m === "parts" ? "Детали внутри" : "Текст"}
          </button>
        ))}
        <span className="studio-divider" />
        <button className="studio-tool" onClick={() => setModal("add")}><Plus /> Добавить</button>
        <button className="studio-tool" onClick={() => setModal("fonts")}><Sparkles /> Шрифты</button>
        <button className="studio-tool" onClick={() => setModal("bg")}><ImageIcon /> Фон</button>
        <button className={`studio-tool ${snap ? "is-active" : ""}`} onClick={() => { setSnap(!snap); toast.info(snap ? "Сетка выключена" : "Привязка к сетке 8px"); }}><Settings2 /> Сетка</button>
        <span className="studio-divider" />
        <button className="studio-tool" onClick={undo} title="Отменить (Ctrl+Z)"><Undo2 /></button>
        <button className="studio-tool" onClick={() => { setJsonText(JSON.stringify(data, null, 2)); setModal("json"); }}><FileJson /> JSON</button>
        <button className="studio-tool" onClick={() => setModal("reset")}><RotateCcw /> Сброс</button>
        <button className="studio-tool studio-save" onClick={saveAll}><Save /> Сохранить</button>
        <button className="studio-tool studio-done" onClick={onExit}><Check /> Готово</button>
      </div>

      {/* Инспектор */}
      {selectedCfg && mode !== "text" && (
        <div className="studio-inspector" data-studio-ui>
          <div className="studio-inspector-head">
            <div>
              <span className="studio-kbd">{selectedPart ? "ДЕТАЛЬ ВНУТРИ" : "БЛОК"}</span>
              <h3>{selectedPart ? PART_NAMES[selectedPart] || selectedPart : BLOCK_NAMES[selectedCfg.id.split("-")[0]] || selectedCfg.id}</h3>
            </div>
            <button onClick={() => { setSelectedBlock(null); setSelectedPart(null); }}><X /></button>
          </div>

          {!selectedPart ? (
            <>
              <p className="studio-label">Позиция и размер (px)</p>
              <div className="studio-grid4">
                {(["x", "y", "w", "h"] as const).map((k) => (
                  <label key={k}>{k.toUpperCase()}
                    <input
                      type="number"
                      value={Math.round(selectedCfg[k])}
                      onChange={(e) => patchBlock(selectedCfg.id, { [k]: Number(e.target.value) } as any)}
                    />
                  </label>
                ))}
              </div>
              <div className="studio-row">
                <button className="studio-chip" onClick={() => patchBlock(selectedCfg.id, { z: selectedCfg.z + 1 })}><ChevronUp /> Вверх</button>
                <button className="studio-chip" onClick={() => patchBlock(selectedCfg.id, { z: Math.max(1, selectedCfg.z - 1) })}><ChevronDown /> Вниз</button>
                <button className="studio-chip" onClick={() => patchBlock(selectedCfg.id, { hidden: !selectedCfg.hidden })}>
                  {selectedCfg.hidden ? <Eye /> : <EyeOff />} {selectedCfg.hidden ? "Показать" : "Скрыть"}
                </button>
              </div>
              <p className="studio-label">Вращение · Скругление · Прозрачность</p>
              <input type="range" min={-180} max={180} value={selectedCfg.rotation} onChange={(e) => patchBlock(selectedCfg.id, { rotation: Number(e.target.value) })} />
              <input type="range" min={0} max={100} value={selectedCfg.radius} onChange={(e) => patchBlock(selectedCfg.id, { radius: Number(e.target.value) })} />
              <input type="range" min={10} max={100} value={selectedCfg.opacity} onChange={(e) => patchBlock(selectedCfg.id, { opacity: Number(e.target.value) })} />
              <p className="studio-label">Шрифт блока</p>
              <select value={selectedCfg.font} onChange={(e) => patchBlock(selectedCfg.id, { font: e.target.value })}>
                <option value="">По умолчанию</option>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <p className="studio-label">Фон блока</p>
              <div className="studio-row">
                {(["default", "color", "image"] as const).map((m) => (
                  <button key={m} className={`studio-chip ${selectedCfg.bg.mode === m ? "is-on" : ""}`} onClick={() => patchBlock(selectedCfg.id, { bg: { ...selectedCfg.bg, mode: m } })}>{m === "default" ? "Нет" : m === "color" ? "Цвет" : "Картинка"}</button>
                ))}
              </div>
              {selectedCfg.bg.mode === "color" && (
                <>
                  <input type="color" value={selectedCfg.bg.color} onChange={(e) => patchBlock(selectedCfg.id, { bg: { ...selectedCfg.bg, color: e.target.value } })} />
                  <input type="range" min={0} max={100} value={selectedCfg.bg.alpha} onChange={(e) => patchBlock(selectedCfg.id, { bg: { ...selectedCfg.bg, alpha: Number(e.target.value) } })} />
                </>
              )}
              {selectedCfg.bg.mode === "image" && (
                <>
                  <label className="studio-file">📁 Загрузить картинку
                    <input type="file" accept="image/*" onChange={(e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      const r = new FileReader();
                      r.onload = () => patchBlock(selectedCfg.id, { bg: { ...selectedCfg.bg, imageSrc: String(r.result) } });
                      r.readAsDataURL(f);
                    }} />
                  </label>
                  <input type="range" min={0} max={30} value={selectedCfg.bg.blur} onChange={(e) => patchBlock(selectedCfg.id, { bg: { ...selectedCfg.bg, blur: Number(e.target.value) } })} />
                  <input type="range" min={0} max={95} value={selectedCfg.bg.dim} onChange={(e) => patchBlock(selectedCfg.id, { bg: { ...selectedCfg.bg, dim: Number(e.target.value) } })} />
                  <input type="range" min={100} max={250} value={selectedCfg.bg.zoom} onChange={(e) => patchBlock(selectedCfg.id, { bg: { ...selectedCfg.bg, zoom: Number(e.target.value) } })} />
                </>
              )}
              <button className="studio-chip" onClick={() => patchBlock(selectedCfg.id, { bg: defaultBg(), rotation: 0, radius: 18, opacity: 100, x: 0, y: 0, hidden: false })}><RotateCcw /> Сбросить блок</button>
            </>
          ) : (
            <>
              <p className="studio-label">Шрифт детали</p>
              <select value={selectedPartCfg?.font || ""} onChange={(e) => patchPart(partKey, { font: e.target.value })}>
                <option value="">По умолчанию</option>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <p className="studio-label">Размер шрифта</p>
              <input type="range" min={8} max={140} value={selectedPartCfg?.fontSize || 16} onChange={(e) => patchPart(partKey, { fontSize: Number(e.target.value) })} />
              <p className="studio-label">Цвет</p>
              <input type="color" value={selectedPartCfg?.color || "#ffffff"} onChange={(e) => patchPart(partKey, { color: e.target.value })} />
              <p className="studio-label">Отступ</p>
              <input type="range" min={0} max={60} value={selectedPartCfg?.padding || 0} onChange={(e) => patchPart(partKey, { padding: Number(e.target.value) })} />
              <button className="studio-chip" onClick={() => patchPart(partKey, { hidden: !selectedPartCfg?.hidden })}>
                {selectedPartCfg?.hidden ? <Eye /> : <EyeOff />} {selectedPartCfg?.hidden ? "Показать" : "Скрыть"}
              </button>
            </>
          )}

          <p className="studio-label">Детали внутри блока</p>
          <div className="studio-parts">
            {(Array.from(new Set(
              (rootRef.current?.querySelectorAll<HTMLElement>("[data-studio-part]") || []) as any
            )) as HTMLElement[]).map((el, i) => (
              <button key={i} onClick={() => { setMode("parts"); setSelectedPart(el.dataset.studioPart || null); }}>
                <Layers /> {PART_NAMES[el.dataset.studioPart || ""] || el.dataset.studioPart || `Деталь ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inline-панель текста */}
      {inline && mode === "text" && (
        <div className="studio-inline" style={{ left: inline.x, top: inline.y }} data-studio-ui>
          <select onChange={(e) => execInline("fontName", e.target.value)} defaultValue="">
            <option value="">Шрифт</option>
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <button onClick={() => execInline("bold")}><b>B</b></button>
          <button onClick={() => execInline("italic")}><i>I</i></button>
          <button onClick={() => execInline("underline")}><u>U</u></button>
          <input type="color" onChange={(e) => execInline("foreColor", e.target.value)} />
          <button onClick={() => execInline("fontSize", "5")}>A+</button>
          <button onClick={() => { setInline(null); window.getSelection()?.removeAllRanges(); }}><X /></button>
        </div>
      )}

      {/* Виджеты */}
      {data.widgets.map((w) => (
        <div
          key={w.id}
          className={`studio-widget studio-widget-${w.kind}`}
          style={{ left: w.x, top: w.y, width: w.w, height: w.h }}
          data-studio-ui
        >
          <button className="studio-widget-del" onClick={() => commit({ ...dataRef.current, widgets: dataRef.current.widgets.filter((x) => x.id !== w.id) })}><Trash2 /></button>
          {w.kind === "stat" && <><b>{w.value}</b><span>{w.caption}</span></>}
          {w.kind === "text" && <span contentEditable suppressContentEditableWarning onBlur={(e) => commit({ ...dataRef.current, widgets: dataRef.current.widgets.map((x) => x.id === w.id ? { ...x, label: e.currentTarget.textContent || "" } : x) })}>{w.label}</span>}
          {w.kind === "image" && <img src={w.src} alt="" />}
          {w.kind === "button" && (w.url ? <a href={w.url} target="_blank" rel="noreferrer">{w.label}</a> : <span>{w.label}</span>)}
        </div>
      ))}

      {/* Модальные окна */}
      {modal && (
        <div className="studio-modal-backdrop" data-studio-ui onClick={() => setModal(null)}>
          <div className="studio-modal" onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-head">
              <h3>{modal === "fonts" ? "Пак шрифтов на кириллице" : modal === "bg" ? "Фон всей страницы" : modal === "json" ? "Экспорт / Импорт JSON" : modal === "reset" ? "Сбросить весь профиль?" : "Добавить блок"}</h3>
              <button onClick={() => setModal(null)}><X /></button>
            </div>

            {modal === "fonts" && (
              <>
                <input className="studio-input" value={fontSample} onChange={(e) => setFontSample(e.target.value)} />
                <div className="studio-font-grid">
                  {FONTS.map((f) => (
                    <div key={f} className="studio-font-card">
                      <span style={{ fontFamily: `'${f}', sans-serif`, fontSize: f === "Press Start 2P" ? 11 : 18 }}>{fontSample || f}</span>
                      <small>{f}</small>
                      <div>
                        <button onClick={() => { const next = { ...dataRef.current, globalFont: f }; commit(next); toast.success(`Шрифт профиля: ${f}`); }}>На профиль</button>
                        {selectedCfg && <button onClick={() => patchBlock(selectedCfg.id, { font: f })}>На блок</button>}
                        {selectedPart && <button onClick={() => patchPart(partKey, { font: f })}>На деталь</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {modal === "bg" && (
              <div className="studio-modal-body">
                <div className="studio-row">
                  <button className="studio-chip" onClick={() => commit({ ...dataRef.current, pageBg: { ...data.pageBg, mode: data.pageBg.mode === "avatar" ? "default" : "avatar" } })}>🖼 Аватарка на фон</button>
                  <button className="studio-chip" onClick={() => commit({ ...dataRef.current, pageBg: { ...data.pageBg, layout: "full" } })}>Весь экран</button>
                  <button className="studio-chip" onClick={() => commit({ ...dataRef.current, pageBg: { ...data.pageBg, layout: "banner" } })}>Только шапка</button>
                </div>
                <label className="studio-file">📁 Загрузить фон
                  <input type="file" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const r = new FileReader();
                    r.onload = () => commit({ ...dataRef.current, pageBg: { ...data.pageBg, mode: "image", imageSrc: String(r.result) } });
                    r.readAsDataURL(f);
                  }} />
                </label>
                {(["blur", "dim", "zoom"] as const).map((k) => (
                  <label key={k} className="studio-range-label">{k}
                    <input type="range" min={k === "zoom" ? 100 : 0} max={k === "zoom" ? 220 : k === "blur" ? 30 : 92} value={data.pageBg[k]} onChange={(e) => commit({ ...dataRef.current, pageBg: { ...data.pageBg, [k]: Number(e.target.value) } })} />
                  </label>
                ))}
                <button className="studio-chip" onClick={() => commit({ ...dataRef.current, pageBg: { mode: "default", imageSrc: "", layout: "full", blur: 6, dim: 65, zoom: 106 } })}>Сбросить фон</button>
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
                      if (!parsed || typeof parsed !== "object") throw new Error();
                      commit({ ...emptyState(), ...parsed });
                      toast.success("JSON применён");
                    } catch { toast.error("Неверный JSON"); }
                  }}>Применить</button>
                </div>
              </div>
            )}

            {modal === "reset" && (
              <div className="studio-modal-body">
                <p>Все блоки, шрифты, фоны и тексты будут удалены.</p>
                <div className="studio-row">
                  <button className="studio-chip" onClick={() => setModal(null)}>Отмена</button>
                  <button className="studio-chip studio-danger" onClick={resetAll}>Сбросить всё</button>
                </div>
              </div>
            )}

            {modal === "add" && (
              <div className="studio-modal-body studio-add-grid">
                <button onClick={() => addWidget("stat")}><b>Карточка статистики</b><small>Иконка + число + подпись</small></button>
                <button onClick={() => addWidget("text")}><b>Текстовый блок</b><small>Заголовок и заметка</small></button>
                <button onClick={() => addWidget("image")}><b>Картинка / Стикер</b><small>Своё фото</small></button>
                <button onClick={() => addWidget("button")}><b>Кастомная кнопка</b><small>Ссылка на Telegram и др.</small></button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileStudio;
