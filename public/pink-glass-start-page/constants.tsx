import React from 'react';
import { BackgroundTheme, AppItem, Bookmark, AppSettings } from './types';

// New Pink/Gradient Backgrounds
export const BACKGROUNDS: BackgroundTheme[] = [
  {
    name: "Deep Space Mesh",
    value: "linear-gradient(-45deg, #09090b, #1e1b4b, #312e81, #18181b)",
    textColor: "text-white"
  },
  {
    name: "Midnight Magenta",
    value: "linear-gradient(135deg, #2a0845 0%, #6441A5 50%, #fe5196 100%)",
    textColor: "text-white"
  },
  {
    name: "Deep Rose",
    value: "#9f1239", 
    textColor: "text-white"
  },
  {
    name: "Cotton Candy",
    value: "linear-gradient(to right, #ffc3a0 0%, #ffafbd 100%)",
    textColor: "text-gray-900"
  },
  {
    name: "Neon City",
    value: "radial-gradient(circle at center, #f50057 0%, #1a1a2e 100%)",
    textColor: "text-white"
  },
  {
    name: "Soft Lilac",
    value: "#e879f9", 
    textColor: "text-white"
  },
  {
    name: "Sunset Vibes",
    value: "linear-gradient(to top, #09203f 0%, #537895 100%)", 
    textColor: "text-white"
  },
  {
    name: "Dark Velvet",
    value: "#1a1a1a", 
    textColor: "text-white"
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  blurAmount: 24,
  isAnimationEnabled: true,
  timeFormat: '24h',
  searchEngine: 'google',
  lockBackground: false,
  customBackground: null,
  customVideo: false,
  themeColor: '#ff69b4', // Hot Pink default
  language: 'ru' // Default to Russian as requested
};

export const SEARCH_ENGINES = {
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  yahoo: "https://search.yahoo.com/search?p="
};

export const TRANSLATIONS = {
  en: {
    searchPlaceholder: "Search or type a URL...",
    settings: "Settings",
    appearance: "Appearance",
    functionality: "Functionality",
    lockBackground: "Lock Background",
    customWallpaper: "Custom Wallpaper (Image)",
    customVideo: "Live Wallpaper (Video)",
    uploadImage: "Upload Image",
    uploadVideo: "Upload Video",
    reset: "Reset",
    glassBlur: "Glass Blur",
    animations: "Animations",
    timeFormat: "Time Format",
    searchEngine: "Search Engine",
    language: "Language",
    themeColor: "Theme Color",
    addShortcut: "Add Shortcut",
    name: "Name",
    url: "URL",
    cancel: "Cancel",
    done: "Done",
    moreApps: "More",
    moreFromGoogle: "More from Google",
    gmail: "Gmail",
    images: "Images",
    dropFavorites: "Drop Favorites Here",
    googleApps: "Google Apps"
  },
  ru: {
    searchPlaceholder: "Поиск или URL...",
    settings: "Настройки",
    appearance: "Внешний вид",
    functionality: "Функционал",
    lockBackground: "Зафиксировать фон",
    customWallpaper: "Свой фон (Картинка)",
    customVideo: "Живые обои (Видео)",
    uploadImage: "Загрузить",
    uploadVideo: "Загрузить видео",
    reset: "Сброс",
    glassBlur: "Размытие",
    animations: "Анимация",
    timeFormat: "Формат времени",
    searchEngine: "Поисковик",
    language: "Язык",
    themeColor: "Цвет темы",
    addShortcut: "Добавить закладку",
    name: "Название",
    url: "Ссылка",
    cancel: "Отмена",
    done: "Готово",
    moreApps: "Еще",
    moreFromGoogle: "Другие сервисы Google",
    gmail: "Почта",
    images: "Картинки",
    dropFavorites: "Перетащите сюда",
    googleApps: "Приложения"
  }
};

// --- Official Colored SVG Icons (2024/2025 Modern) ---
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#FF0000" d="M23.5 6.2c-.3-1-1.1-1.8-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5c-1 .3-1.8 1.1-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1.1 1.8 2.1 2.1 1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8z" />
    <path fill="#FFFFFF" d="M9.6 15.6L16.2 12 9.6 8.4z" />
  </svg>
);

const GmailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#EA4335" d="M24 5.4v13.2c0 2-1.6 3.6-3.6 3.6H3.6C1.6 22.2 0 20.6 0 18.6V5.4c0-2 1.6-3.6 3.6-3.6 1 0 1.9.4 2.5 1.1L12 10.2l5.9-7.3C18.5 2.2 19.4 1.8 20.4 1.8c2 0 3.6 1.6 3.6 3.6z" />
    <path fill="#C5221F" d="M24 5.4v13.2c0 2-1.6 3.6-3.6 3.6H20V9.3L24 6.2v-.8z" />
    <path fill="#E0E0E0" d="M20 18.6V9.3l-5.6 4.3L20 18.6z" />
    <path fill="#E0E0E0" d="M4 18.6l5.6-5-5.6-4.3v9.3z" />
    <path fill="#C5221F" d="M0 5.4v.8l4 3.1v12.9H3.6C1.6 22.2 0 20.6 0 18.6V5.4z" />
    <path fill="#F2F2F2" d="M3.6 1.8c-1 0-1.9.4-2.5 1.1L12 11.2l10.9-8.3c-.6-.7-1.5-1.1-2.5-1.1H3.6z" />
  </svg>
);

const DriveIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#FFC000" d="M16.9 8.6L12.5 1 4.9 1l7.5 13.1 4.5-5.5z" />
    <path fill="#4688F1" d="M17.4 9.5l-5 8.7h10l1.6-2.8-5-8.7-1.6 2.8z" />
    <path fill="#00A95D" d="M11.9 18.2L4.4 5.2 0 12.8l7.5 13h9l-4.6-7.6z" />
  </svg>
);

const MapsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#34A853" d="M18.5 11.5c-1.3 0-2.6-.4-3.7-1L18.6 4c.6.4 1.2.9 1.7 1.5 2 2.4 2.3 5.3 1.2 8.2l-3-2.2z" />
    <path fill="#EA4335" d="M12.4 1.6C10.7.6 8.8 0 6.9 0 4.1 0 1.6 1.2 0 3.3l5.8 4.8 6.6-6.5z" />
    <path fill="#4285F4" d="M6.9 0c-1.9 0-3.8.6-5.5 1.6l6.6 5.5L14.8 10.5c1.1.7 2.4 1 3.7 1 2.3 0 4.5-1.2 5.7-3.2-1.7-4.1-5.1-7.3-9.2-8.3C13.8.5 12.4 0 10.9 0H6.9z" opacity=".2"/> 
    <path fill="#FBBC05" d="M5.8 8.1l-5.8-4.8C-.9 6 .3 9.4 2.6 12.1c1.5 1.7 3.5 3 5.8 3.5l3.5-4.1c-1.2.7-2.6 1.1-3.9 1.1-2.3 0-4.4-1.2-5.5-3.1L5.8 8.1z" />
    <path fill="#4285F4" d="M11.9 15.6c1.3 0 2.7-.4 3.9-1.1l3 2.2c-.8 2.2-2.5 3.9-4.7 4.9L8.4 15.6c1.1 0 2.3 0 3.5 0z" />
    <path fill="#EA4335" d="M14.1 21.6c2.2-1 3.9-2.7 4.7-4.9l-3.5-2.6c-1.1 1.9-3.2 3.1-5.5 3.1-1.3 0-2.6-.4-3.8-1.1L2.6 12.1c.5 5.5 4.8 10 10 10.4v-.9z" />
  </svg>
);

const PhotosIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#4285F4" d="M6 17c0 3.31 2.69 6 6 6v-6H6z" />
    <path fill="#EA4335" d="M17 18c3.31 0 6-2.69 6-6h-6v6z" />
    <path fill="#FBBC05" d="M18 7c0-3.31-2.69-6-6-6v6h6z" />
    <path fill="#34A853" d="M7 6c-3.31 0-6 2.69-6 6h6V6z" />
  </svg>
);

const MeetIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#00832D" d="M0 10.5v8l6.3-2.3 2.5-1.5v-8.2l-2.4-1.6L0 2.7v7.8z"/>
    <path fill="#0066DA" d="M18 16.2v-8.4l-5.1 4.2L18 16.2z"/>
    <path fill="#EAC400" d="M8.8 2.3L0 10.5V2.7c0-1.5 1.2-2.7 2.7-2.7h6.1L8.8 2.3z"/>
    <path fill="#2684FC" d="M18 2.7v18.6c0 1.5-1.2 2.7-2.7 2.7H2.7C1.2 24 0 22.8 0 21.3V10.5l8.8 8.1 9.2-2.4z"/>
    <path fill="#00AC47" d="M24 6.8L18 12l6 5.3V6.8z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#4285F4" d="M21.33 4H18V1.33h-2.67V4H8.67V1.33H6V4H2.67C1.2 4 0 5.2 0 6.67V21.33C0 22.8 1.2 24 2.67 24H21.33C22.8 24 24 22.8 24 21.33V6.67C24 5.2 22.8 4 21.33 4z" />
    <path fill="#FFF" d="M5 20h14v-9H5v9zm0-11h14V7H5v2z" />
    <text x="12" y="19" fontSize="10" fontWeight="bold" fill="#4285F4" textAnchor="middle">31</text>
  </svg>
);

const DocsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#2684FC" d="M14.5 0H2.5C1.1 0 0 1.1 0 2.5v19C0 22.9 1.1 24 2.5 24h13c1.4 0 2.5-1.1 2.5-2.5V6L14.5 0z" />
    <path fill="#FFF" d="M13 5.5h3.5L13 2V5.5z" />
    <path fill="#FFF" d="M4 11h10v2H4zm0 4h10v2H4zm0 4h6v2H4z" opacity="0.7" />
  </svg>
);

const SheetsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#0F9D58" d="M14.5 0H2.5C1.1 0 0 1.1 0 2.5v19C0 22.9 1.1 24 2.5 24h13c1.4 0 2.5-1.1 2.5-2.5V6L14.5 0z" />
    <path fill="#FFF" d="M13 5.5h3.5L13 2V5.5z" />
    <path fill="#FFF" d="M4 11h10v1H4zm0 3h10v1H4zm0 3h10v1H4zM4 8h10v1H4z" opacity="0.7"/>
    <rect x="8" y="8" width="2" height="10" fill="white" opacity="0.5"/>
  </svg>
);

const SlidesIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#F4B400" d="M14.5 0H2.5C1.1 0 0 1.1 0 2.5v19C0 22.9 1.1 24 2.5 24h13c1.4 0 2.5-1.1 2.5-2.5V6L14.5 0z" />
    <path fill="#FFF" d="M13 5.5h3.5L13 2V5.5z" />
    <path fill="#FFF" d="M3.5 10.5h11v7h-11z" opacity="0.8"/>
  </svg>
);

const NewsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#F50057" d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    <path fill="#FFF" d="M6 6h12v2H6zm0 4h12v2H6zm0 4h8v2H6z" />
  </svg>
);

const ContactsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
     <circle cx="12" cy="12" r="10" fill="#4285F4"/>
     <path d="M12 5c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3zm0 14.2c-2.5 0-4.7-1.3-5.9-3.2.1-2 4-3 5.9-3s5.8 1.1 5.9 3.2c-1.2 1.9-3.4 3.2-5.9 3.2z" fill="#FFF"/>
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#00AC47" d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
    <path fill="#FFF" d="M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
  </svg>
);

const TranslateIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <path fill="#4285F4" d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    <path fill="#FFF" d="M10 14.5l-1.5-1.5L11 10.5h1.5l1.5 1.5-1.5 1.5H10zM12.8 6h-2.6l-1 2H8L6.5 6H4v12h2.5v-2.5h2L9.5 18h2.6l-2-4H11l1.8 4z"/>
    <path fill="#FFF" d="M7 6h10v2H7z" opacity="0.5"/>
    <text x="12" y="16" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">G</text>
  </svg>
);

const AccountIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <circle cx="12" cy="12" r="10" fill="#EA4335" />
    <path fill="#FFF" d="M12 6c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3zm0 14.2c-2.5 0-4.7-1.3-5.9-3.2.1-2 4-3 5.9-3s5.8 1.1 5.9 3.2c-1.2 1.9-3.4 3.2-5.9 3.2z"/>
  </svg>
);

const GeminiIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10">
    <defs>
      <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: '#4E9AF1'}} />
        <stop offset="100%" style={{stopColor: '#F06292'}} />
      </linearGradient>
    </defs>
    <path fill="url(#geminiGrad)" d="M12 2C9.5 8 5 11 2 12c3 1 7.5 4 10 10 2.5-6 7-9 10-10-3-1-7.5-4-10-10z"/>
  </svg>
);

const KeepIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10">
        <rect width="24" height="24" rx="3" fill="#FDD835" />
        <path d="M16 11c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4z" fill="#FFF" opacity="0.5"/>
        <path d="M12 6c-2.76 0-5 2.24-5 5 0 1.98 1.25 3.66 3 4.4V17h4v-1.6c1.75-.74 3-2.42 3-4.4 0-2.76-2.24-5-5-5z" fill="#FFF"/>
    </svg>
);


// Expanded Google Apps List
export const INITIAL_FAVORITES: AppItem[] = [
  { id: 'g-search', name: 'Search', url: 'https://google.com', icon: <GoogleIcon /> },
  { id: 'g-youtube', name: 'YouTube', url: 'https://youtube.com', icon: <YoutubeIcon /> },
  { id: 'g-mail', name: 'Gmail', url: 'https://mail.google.com', icon: <GmailIcon /> },
  { id: 'g-drive', name: 'Drive', url: 'https://drive.google.com', icon: <DriveIcon /> },
  { id: 'g-maps', name: 'Maps', url: 'https://maps.google.com', icon: <MapsIcon /> },
  { id: 'g-photos', name: 'Photos', url: 'https://photos.google.com', icon: <PhotosIcon /> },
];

export const INITIAL_OTHERS: AppItem[] = [
  { id: 'g-meet', name: 'Meet', url: 'https://meet.google.com', icon: <MeetIcon /> },
  { id: 'g-calendar', name: 'Calendar', url: 'https://calendar.google.com', icon: <CalendarIcon /> },
  { id: 'g-docs', name: 'Docs', url: 'https://docs.google.com', icon: <DocsIcon /> },
  { id: 'g-sheets', name: 'Sheets', url: 'https://sheets.google.com', icon: <SheetsIcon /> },
  { id: 'g-slides', name: 'Slides', url: 'https://slides.google.com', icon: <SlidesIcon /> },
  { id: 'g-keep', name: 'Keep', url: 'https://keep.google.com', icon: <KeepIcon /> },
  { id: 'g-contacts', name: 'Contacts', url: 'https://contacts.google.com', icon: <ContactsIcon /> },
  { id: 'g-translate', name: 'Translate', url: 'https://translate.google.com', icon: <TranslateIcon /> },
  { id: 'g-chat', name: 'Chat', url: 'https://chat.google.com', icon: <ChatIcon /> },
  { id: 'g-news', name: 'News', url: 'https://news.google.com', icon: <NewsIcon /> },
  { id: 'g-gemini', name: 'Gemini', url: 'https://gemini.google.com', icon: <GeminiIcon /> },
  { id: 'g-account', name: 'Account', url: 'https://myaccount.google.com', icon: <AccountIcon /> },
];

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: '1', title: 'YouTube', url: 'https://youtube.com', initials: 'YT' },
  { id: '2', title: 'Reddit', url: 'https://reddit.com', initials: 'RD' },
  { id: '3', title: 'GitHub', url: 'https://github.com', initials: 'GH' },
  { id: '4', title: 'Twitter', url: 'https://twitter.com', initials: 'X' },
];

export const ALL_APPS = [...INITIAL_FAVORITES, ...INITIAL_OTHERS];