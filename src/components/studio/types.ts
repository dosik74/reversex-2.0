export type FontName =
  | "Inter" | "Unbounded" | "Russo One" | "Dela Gothic One" | "Rubik Glitch"
  | "Rubik Mono One" | "Press Start 2P" | "JetBrains Mono" | "Oswald"
  | "Montserrat" | "Playfair Display" | "Caveat" | "Comfortaa" | "Marck Script"
  | "Kelly Slab" | "Alumni Sans" | "Poiret One" | "Amatic SC";

export type BgMode = "default" | "color" | "image" | "avatar";

export interface BlockBg {
  mode: BgMode;
  color: string;
  alpha: number;
  imageSrc: string;
  blur: number;
  dim: number;
  zoom: number;
}

export interface Block {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  rotation: number;
  radius: number;
  opacity: number;
  hidden: boolean;
  locked: boolean;
  pinned: boolean;
  overflowHidden: boolean;
  font: string;
  bg: BlockBg;
  meta?: Record<string, any>;
}

export interface PartCfg {
  detached: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  rotation: number;
  opacity: number;
  radius: number;
  fontSize: number;
  padding: number;
  font: string;
  color: string;
  hidden: boolean;
  bg?: BlockBg;
}

export interface PageBg {
  mode: "default" | "avatar" | "image";
  imageSrc: string;
  layout: "full" | "banner";
  blur: number;
  dim: number;
  zoom: number;
}

export interface StudioMedia {
  id?: string;
  contentType?: string;
  title: string;
  year: number;
  cat: string;
  status: string;
  poster: string;
  genre: string;
  color: string;
  userRating?: number;
  externalRating?: number;
}

export interface StudioRatedItem {
  id: string;
  contentType: string;
  title: string;
  poster: string;
  year: string;
  cat: string;
  userRating: number;
}

export interface StudioTitleComment {
  id: string;
  movieId: string;
  content: string;
  createdAt: string;
}

export interface StudioWallComment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string | null;
  authorAvatar: string | null;
}

export interface StudioProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  level: number;
  xp: number;
  stats: { bookmarks: number; followers: number; following: number; comments: number; rated: number };
  statusCounts: Record<string, number>;
  friendsCount: number;
  media: StudioMedia[];
  rated: StudioRatedItem[];
  titleComments: StudioTitleComment[];
  wallComments: StudioWallComment[];
  topLists: Array<{ title: string; mediaType?: string; poster: string; items: Array<{ id: string; title: string; poster: string }> }>;
}

export interface StudioVariantConfig {
  globalFont: string;
  pageBg: PageBg;
  blocks: Block[];
  parts: Record<string, Record<string, PartCfg>>;
  texts: Record<string, string>;
  /** удалённые блоки — доступны в меню «Добавить» для восстановления */
  trash: Block[];
}

export interface StudioData {
  avatarSrc: string;
  globalFont: string;
  pageBg: PageBg;
  blocks: Block[];
  /** Полностью независимая мобильная конфигурация (блоки, тексты, детали, фон, шрифт, корзина) */
  mobile: StudioVariantConfig;
  /** Legacy-поле, сохраняется только для миграции старых профилей */
  mobileBlocks?: Block[];
  parts: Record<string, Record<string, PartCfg>>;
  texts: Record<string, string>;
  /** удалённые блоки — доступны в меню «Добавить» для восстановления */
  trash: Block[];
  profile: StudioProfile | null;
}

export type EditorMode = "blocks" | "parts" | "text";
