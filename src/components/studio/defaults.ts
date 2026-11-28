import type { Block, BlockBg, PageBg, PartCfg, StudioData, StudioVariantConfig } from "./types";

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

export const MOBILE_CANVAS_WIDTH = 376;

export function getDefaultMobileBlocks(): Block[] {
  return [
    blk("blk_avatar", "avatar", "Аватарка", 136, 18, 104, 104, { z: 25, radius: 500, overflowHidden: false, bg: { ...defaultBg(), mode: "color", alpha: 0 } }),
    blk("blk_header", "header", "Шапка профиля", 12, 128, 352, 108, {
      z: 20, radius: 24, overflowHidden: false, font: "Unbounded",
      bg: { ...defaultBg(), mode: "color", color: "#12101c", alpha: 78 },
      meta: { align: "center" },
    }),
    blk("blk_actions", "actions", "Кнопки действий", 12, 244, 352, 86, {
      z: 22, radius: 20, overflowHidden: false,
      bg: { ...defaultBg(), mode: "color", alpha: 0 },
      meta: { align: "center" },
    }),

    blk("blk_bio", "bio", "Статус / Био", 12, 338, 352, 68, {
      radius: 22,
      bg: { ...defaultBg(), mode: "color", color: "#19140e", alpha: 88 },
    }),

    blk("blk_stat_1", "stat", "Закладки", 12, 416, 171, 80, {
      z: 12, radius: 22, font: "JetBrains Mono",
      bg: { ...defaultBg(), mode: "color", color: "#0b1c1a", alpha: 94 },
      meta: { icon: "bookmark", val: "0", label: "ЗАКЛАДКИ" },
    }),
    blk("blk_stat_2", "stat", "Подписчики", 193, 416, 171, 80, {
      z: 12, radius: 22, font: "JetBrains Mono",
      bg: { ...defaultBg(), mode: "color", color: "#161124", alpha: 94 },
      meta: { icon: "users", val: "0", label: "ПОДПИСЧИКИ" },
    }),
    blk("blk_stat_3", "stat", "Подписки", 12, 504, 171, 80, {
      z: 12, radius: 22, font: "JetBrains Mono",
      bg: { ...defaultBg(), mode: "color", color: "#0f1726", alpha: 94 },
      meta: { icon: "userPlus", val: "0", label: "ПОДПИСКИ" },
    }),
    blk("blk_stat_4", "stat", "Комментарии", 193, 504, 171, 80, {
      z: 12, radius: 22, font: "JetBrains Mono",
      bg: { ...defaultBg(), mode: "color", color: "#1c160c", alpha: 94 },
      meta: { icon: "message", val: "0", label: "КОММЕНТАРИИ" },
    }),

    blk("blk_tabs", "tabs", "Вкладки профиля", 12, 594, 352, 88, { z: 11, radius: 22 }),
    blk("blk_filters", "filters", "Фильтры статусов", 12, 692, 352, 100, { overflowHidden: false, bg: { ...defaultBg(), mode: "color", alpha: 0 } }),
    blk("blk_collection", "collection", "Коллекция", 12, 802, 352, 420, {
      radius: 24,
      bg: { ...defaultBg(), mode: "color", color: "#0e1018", alpha: 92 },
    }),

    blk("blk_bm_banner", "bmBanner", "Баннер закладок", 12, 1232, 352, 102, {
      radius: 22,
      bg: { ...defaultBg(), mode: "color", color: "#131622", alpha: 94 },
    }),
    blk("blk_level", "level", "Уровень", 12, 1344, 352, 84, { radius: 22 }),
    blk("blk_friends", "friends", "Друзья", 12, 1438, 352, 110, { radius: 22 }),
    blk("blk_bm_card", "bmCard", "Закладки пользователя", 12, 1558, 352, 72, { radius: 22, bg: { ...defaultBg(), mode: "color", color: "#0a1917", alpha: 95 } }),
    blk("blk_toplists", "topLists", "Топ списки", 12, 1640, 352, 210, { radius: 22 }),
    blk("blk_top50", "top50", "Мой Топ 50", 12, 1860, 352, 290, {
      radius: 24,
      bg: { ...defaultBg(), mode: "color", color: "#14101c", alpha: 94 },
    }),
  ];
}

export const emptyMobileConfig = (): StudioVariantConfig => ({
  globalFont: "Montserrat",
  pageBg: { mode: "avatar", imageSrc: "", layout: "banner", blur: 16, dim: 72, zoom: 130 },
  blocks: getDefaultMobileBlocks(),
  parts: {},
  texts: {},
  trash: [],
});

export const emptyData = (): StudioData => ({
  avatarSrc: DEFAULT_AVATAR,
  globalFont: "Inter",
  pageBg: defaultPageBg(),
  blocks: getDefaultBlocks(),
  mobile: emptyMobileConfig(),
  parts: {},
  texts: {},
  trash: [],
  profile: null,
});

export function normalizeVariant(input: any, fallback: StudioVariantConfig): StudioVariantConfig {
  if (!input || !Array.isArray(input.blocks) || !input.blocks.length) return fallback;
  return {
    globalFont: input.globalFont || fallback.globalFont,
    pageBg: { ...fallback.pageBg, ...(input.pageBg || {}) },
    blocks: [...input.blocks],
    parts: input.parts || {},
    texts: input.texts || {},
    trash: Array.isArray(input.trash) ? input.trash : [],
  };
}

export function normalizeData(input: any): StudioData {
  const base = emptyData();
  if (!input || !Array.isArray(input.blocks) || !input.blocks.length) return base;
  // Сохранённые блоки — единственный источник правды: удалённые остаются удалёнными
  const blocks = [...input.blocks];
  const mobileBase = emptyMobileConfig();
  const mobile = input.mobile
    ? normalizeVariant(input.mobile, mobileBase)
    : Array.isArray(input.mobileBlocks) && input.mobileBlocks.length
    ? { ...mobileBase, blocks: [...input.mobileBlocks] }
    : mobileBase;

  return {
    avatarSrc: input.avatarSrc || base.avatarSrc,
    globalFont: input.globalFont || base.globalFont,
    pageBg: { ...base.pageBg, ...(input.pageBg || {}) },
    blocks,
    mobile,
    parts: input.parts || {},
    texts: input.texts || {},
    trash: Array.isArray(input.trash) ? input.trash : [],
    profile: input.profile || null,
  };
}
