import type { Block, BlockBg, PageBg, PartCfg, StudioData } from "./types";

export const FONTS = [
  "Inter", "Unbounded", "Russo One", "Dela Gothic One", "Rubik Glitch",
  "Rubik Mono One", "Press Start 2P", "JetBrains Mono", "Oswald",
  "Montserrat", "Playfair Display", "Caveat", "Comfortaa", "Marck Script",
  "Kelly Slab", "Alumni Sans", "Poiret One", "Amatic SC",
];

export const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=85";

export const defaultBg = (): BlockBg => ({
  mode: "default", color: "#10121a", alpha: 92, imageSrc: "", blur: 0, dim: 45, zoom: 100,
});

export const defaultPageBg = (): PageBg => ({
  mode: "default", imageSrc: "", layout: "full", blur: 6, dim: 65, zoom: 106,
});

export const defaultPart = (): PartCfg => ({
  detached: false, x: 0, y: 0, w: 0, h: 0, z: 1, rotation: 0, opacity: 100,
  radius: 0, fontSize: 0, padding: 0, font: "", color: "", hidden: false,
});

const blk = (
  id: string, type: string, title: string,
  x: number, y: number, w: number, h: number,
  extra: Partial<Block> = {}
): Block => ({
  id, type, title, x, y, w, h, z: 10, rotation: 0, radius: 18, opacity: 1,
  hidden: false, locked: false, pinned: false, overflowHidden: true, font: "", bg: defaultBg(), ...extra,
});

export function getDefaultBlocks(): Block[] {
  return [
    blk("blk_avatar", "avatar", "Аватарка", 24, 148, 132, 132, { z: 25, radius: 500, overflowHidden: false, bg: { ...defaultBg(), mode: "color", alpha: 0 } }),
    blk("blk_header", "header", "Шапка профиля", 174, 156, 430, 118, { z: 20, radius: 16, overflowHidden: false, bg: { ...defaultBg(), mode: "color", alpha: 0 } }),
    blk("blk_actions", "actions", "Кнопки действий", 938, 228, 400, 46, { z: 22, radius: 14, overflowHidden: false, bg: { ...defaultBg(), mode: "color", alpha: 0 } }),

    blk("blk_stat_1", "stat", "Закладки", 24, 300, 318, 86, { z: 12, meta: { icon: "bookmark", val: "0", label: "ЗАКЛАДКИ" } }),
    blk("blk_stat_2", "stat", "Подписчики", 356, 300, 318, 86, { z: 12, meta: { icon: "users", val: "0", label: "ПОДПИСЧИКИ" } }),
    blk("blk_stat_3", "stat", "Подписки", 688, 300, 318, 86, { z: 12, meta: { icon: "userPlus", val: "0", label: "ПОДПИСКИ" } }),
    blk("blk_stat_4", "stat", "Комментарии", 1020, 300, 318, 86, { z: 12, meta: { icon: "message", val: "0", label: "КОММЕНТАРИИ" } }),

    blk("blk_level", "level", "Уровень", 24, 404, 318, 86),
    blk("blk_friends", "friends", "Друзья", 24, 506, 318, 132),
    blk("blk_bm_card", "bmCard", "Закладки пользователя", 24, 654, 318, 74, { bg: { ...defaultBg(), color: "#0a1917", alpha: 95 } }),
    blk("blk_toplists", "topLists", "Топ списки", 24, 744, 318, 222),

    blk("blk_bio", "bio", "Статус / Био", 356, 404, 982, 86),
    blk("blk_tabs", "tabs", "Вкладки профиля", 356, 506, 982, 62, { z: 11, radius: 22 }),
    blk("blk_bm_banner", "bmBanner", "Баннер закладок", 356, 584, 982, 74),
    blk("blk_filters", "filters", "Фильтры статусов", 356, 672, 982, 52, { overflowHidden: false, bg: { ...defaultBg(), mode: "color", alpha: 0 } }),
    blk("blk_collection", "collection", "Коллекция", 356, 736, 982, 380),
    blk("blk_top50", "top50", "Мой Топ 50", 24, 1130, 1314, 320),
  ];
}

export const emptyData = (): StudioData => ({
  avatarSrc: DEFAULT_AVATAR,
  globalFont: "Inter",
  pageBg: defaultPageBg(),
  blocks: getDefaultBlocks(),
  parts: {},
  texts: {},
  trash: [],
  profile: null,
});

export function normalizeData(input: any): StudioData {
  const base = emptyData();
  if (!input || !Array.isArray(input.blocks) || !input.blocks.length) return base;
  // Сохранённые блоки — единственный источник правды: удалённые остаются удалёнными
  const blocks = [...input.blocks];
  return {
    avatarSrc: input.avatarSrc || base.avatarSrc,
    globalFont: input.globalFont || base.globalFont,
    pageBg: { ...base.pageBg, ...(input.pageBg || {}) },
    blocks,
    parts: input.parts || {},
    texts: input.texts || {},
    trash: Array.isArray(input.trash) ? input.trash : [],
    profile: input.profile || null,
  };
}
