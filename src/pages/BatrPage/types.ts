export interface BackgroundTheme {
  name: string;
  value: string;
  textColor: string;
  svgId?: string;
}

export interface AppSettings {
  blurAmount: number;
  isAnimationEnabled: boolean;
  timeFormat: '12h' | '24h';
  searchEngine: 'google' | 'bing' | 'duckduckgo' | 'yahoo';
  lockBackground: boolean;
  customBackground: string | null;
  customVideo: boolean;
  customSvg: string | null;
  themeColor: string;
  language: 'en' | 'ru';
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  initials: string;
  favicon?: string;
}

export interface AppItem {
  id: string;
  name: string;
  url: string;
  icon: string | React.ReactNode;
}
