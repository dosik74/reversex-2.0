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
  title: string;
  year: number;
  cat: string;
  status: string;
  poster: string;
  genre: string;
  color: string;
}

export interface StudioProfile {
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  level: number;
  xp: number;
  stats: { bookmarks: number; followers: number; following: number; comments: number };
  friendsCount: number;
  media: StudioMedia[];
  topLists: Array<{ title: string; poster: string; items: Array<{ id: string; title: string; poster: string }> }>;
}

export interface StudioData {
  avatarSrc: string;
  globalFont: string;
  pageBg: PageBg;
  blocks: Block[];
  parts: Record<string, Record<string, PartCfg>>;
  texts: Record<string, string>;
  profile: StudioProfile | null;
}

export type EditorMode = "blocks" | "parts" | "text";
