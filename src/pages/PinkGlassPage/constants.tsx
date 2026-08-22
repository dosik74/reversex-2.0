import React from 'react';
import { BackgroundTheme, AppItem, Bookmark, AppSettings } from './types';

// New Pink/Gradient Backgrounds
export const BACKGROUNDS: BackgroundTheme[] = [
  {
    name: "White Wave Grid",
    value: "#ffffff",
    textColor: "text-gray-900",
    svgId: "white-wave"
  },
  {
    name: "Dark Wave Grid",
    value: "#000000",
    textColor: "text-white",
    svgId: "dark-wave"
  },
  {
    name: "3D Dot Waves",
    value: "#050505",
    textColor: "text-white",
    svgId: "dot-waves"
  },
  {
    name: "Carbon Texture",
    value: "#121212",
    textColor: "text-white",
    svgId: "carbon"
  },
  {
    name: "Circuit Board",
    value: "#121212",
    textColor: "text-white",
    svgId: "circuit"
  },
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
  customSvg: null,
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
    profile: "Profile",
    appearance: "Appearance",
    functionality: "Functionality",
    dataManagement: "Data Management",
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
    googleApps: "Google Apps",
    login: "Login",
    logout: "Logout",
    email: "Email",
    password: "Password",
    authTitle: "Cloud Sync",
    downloadSettings: "Download Settings (JSON)",
    uploadSettings: "Import Settings (JSON)",
    syncSuccess: "Data synced with Cloud",
    importSuccess: "Settings imported successfully!",
    importError: "Invalid JSON file",
    lastSynced: "Last Synced",
    notLoggedIn: "You are not logged in",
    loginDescription: "Log in to sync your settings and bookmarks across devices.",
    never: "Never",
  },
  ru: {
    searchPlaceholder: "Поиск или URL...",
    settings: "Настройки",
    profile: "Профиль",
    appearance: "Внешний вид",
    functionality: "Функционал",
    dataManagement: "Управление данными",
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
    googleApps: "Приложения",
    login: "Войти",
    logout: "Выйти",
    email: "Email",
    password: "Пароль",
    authTitle: "Синхронизация",
    downloadSettings: "Скачать настройки (JSON)",
    uploadSettings: "Загрузить настройки (JSON)",
    syncSuccess: "Данные синхронизированы",
    importSuccess: "Настройки успешно загружены!",
    importError: "Неверный файл JSON",
    lastSynced: "Последняя синхронизация",
    notLoggedIn: "Вы не вошли в систему",
    loginDescription: "Войдите, чтобы синхронизировать настройки между устройствами.",
    never: "Никогда",
  }
};

export const DEFAULT_TOP_LINKS: Bookmark[] = [
    { id: 't1', title: 'News', url: 'https://news.google.com', initials: 'N' },
    { id: 't2', title: 'Twitter', url: 'https://twitter.com', initials: 'X' },
    { id: 't3', title: 'Instagram', url: 'https://instagram.com', initials: 'IG' },
];

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: '1', title: 'YouTube', url: 'https://youtube.com', initials: 'YT' },
  { id: '2', title: 'Reddit', url: 'https://reddit.com', initials: 'RD' },
  { id: '3', title: 'GitHub', url: 'https://github.com', initials: 'GH' },
  { id: '4', title: 'Twitter', url: 'https://twitter.com', initials: 'X' },
];

// --- 2026 Comprehensive Google Apps Suite ---
// Using stable Google/Gstatic URLs where possible

// Core & Productivity
export const INITIAL_FAVORITES: AppItem[] = [
  { id: 'g-search', name: 'Search', url: 'https://google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png' },
  { id: 'g-youtube', name: 'YouTube', url: 'https://youtube.com', icon: 'https://www.gstatic.com/youtube/img/branding/favicon/favicon_144x144.png' },
  { id: 'g-maps', name: 'Maps', url: 'https://maps.google.com', icon: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSItNTUuNSAwIDM2NyAzNjciIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNzAuNTg1Mzk3NiwyNzEuODY1MjU0IEM4MS4xOTk1NTk2LDI4NS4zOTEzNzggOTAuODU5ODU5NCwyOTkuNjM5NTM3IDk5LjQ5NjMzMzgsMzE0LjUwNjU0IEMxMDYuODcwMTc0LDMyOC40ODk0MTkgMTA5Ljk0MzgxLDMzNy45NzAwNyAxMTUuMzMzNDk1LDM1NC44MTczNDYgQzExOC42MzgwMTQsMzY0LjEyNDgzNSAxMjEuNjI1MDY5LDM2Ni45MDI2NTIgMTI4LjA0NjUxNSwzNjYuOTAyNjUyIEMxMzUuMDQ1MTY5LDM2Ni45MDI2NTIgMTM4LjIxOTgxNiwzNjIuMTc2NzU2IDE0MC42NzI5NTMsMzU0Ljg2Nzg1MiBDMTQ1Ljc2NjgxOSwzMzguOTU4NTQgMTQ5Ljc2Mzk4OCwzMjYuODE1NTE0IDE1Ni4wNjk5OTIsMzE1LjM0MzQ5MyBDMTY4LjQ0MzkwMiwyOTMuMTkzMTEyIDE4My44MTkyOTYsMjczLjUxMDI5OSAxOTguOTI3NzMyLDI1NC41OTIyODcgQzIwMy4wMTg2OTgsMjQ5LjIzODY3NyAyMjkuNDYyMDY3LDIxOC4wNDc3NjcgMjQxLjM2Njk5NCwxOTMuNDM3MDM1IEMyNDEuMzY2OTk0LDE5My40MzcwMzUgMjU1Ljk5OTIzMywxNjYuNDAyMDI3IDI1NS45OTkyMzMsMTI4LjY0NTM2OCBDMjU1Ljk5OTIzMyw5My4zMjc0MTY4IDI0MS41NjkwMTcsNjguODMyMTI2NSAyNDEuNTY5MDE3LDY4LjgzMjEyNjUgTDIwMC4wMjQ0MjgsNzkuOTU3ODIyNCBMMTc0Ljc5MzE5NywxNDYuNDA4OTYzIEwxNjguNTUyMTI5LDE1NS41NzIxNSBMMTY3LjMwMzkxNSwxNTcuMjMxNjI1IEwxNjUuNjQ0NDQsMTU5LjMwOTU3NiBMMTYyLjcyOTUzNywxNjIuNjI4NTI1IEwxNTguNTY2NDIsMTY2Ljc5MTY0MiBMMTM2LjA5ODU3NSwxODUuMDk2MzcgTDc5LjkyODk2MiwyMTcuNTI4Mjc5IEw3MC41ODUzOTc2LDI3MS44NjUyNTQgWiIgZmlsbD0iIzM0QTg1MyIvPjxwYXRoIGQ9Ik0xMi42MTIwMDgxLDE4OC44OTE1MTcgQzI2LjMyMDcxMjUsMjIwLjIwNTA4NCA1Mi43NTY4NjY4LDI0Ny43MzA3MTkgNzAuNjQzMTE4NSwyNzEuODg2OSBMMTY1LjY0NDQ0LDE1OS4zNTI4NjYgQzE2NS42NDQ0NCwxNTkuMzA1Mjg2NiAxNTIuMjYwNDE2LDE3Ni44NTY3MTcgMTI3Ljk4MTU3OSwxNzYuODU2NzE3IEMxMDAuOTM5MzU1LDE3Ni44NTY3MTcgNzkuMDkyMDA5NSwxNTUuMjYxOSA3OS4wOTIwMDk1LDEyOC4wMzIwODQgQzc5LjA5MjAwOTUsMTA5LjM1OTM4NiA5MC4zMjU5MzIsOTYuNTMwOTI0NSA5MC4zMjU5MzIsOTYuNTMwOTI0NSBMMjUuODM3MzAwMywxMTMuODExMTA3IEwxMi42MTIwMDgxLDE4OC44OTE1MTcgWiIgZmlsbD0iI0ZCQkMwNCIvPjxwYXRoIGQ9Ik0xNjYuNzA1MDYxLDUuNzg2NTE2MjkgQzE5OC4yNTY3MjcsMTUuOTU5ODE4IDIyNS4yNjI4NzQsMzcuMzE2NTM2NSAyNDEuNTk3ODc4LDY4LjgxMDQ4MTIgTDE2NS42NzMzMDEsMTU5LjI4NzkzIEMxNjUuNjczMzAxLDE1OS4yODc5MyAxNzYuOTA3MjIzLDE0Ni4yMjg1ODYgMTc2LjkwNzIyMywxMjcuNjcxMzI5IEMxNzYuOTA3MjIzLDk5LjgwNjU4MzQgMTUzLjQ0MzY5Myw3OC45OTA5OTggMTI4LjA5NzAyLDc4Ljk5MDk5OCBDMTA0LjEyODQzMyw3OC45OTA5OTggOTAuMzYyMDA3Niw5Ni40NjU5ODg2IDkwLjM2MjAwNzYsOTYuNDY1OTg4NiBMMTkwLjM2MjAwNzYsMzkuNDY2NjM4NiBMMTY2LjcwNTA2MSw1Ljc4NjUxNjI5IFoiIGZpbGw9IiM0Mjg1RjQiLz48cGF0aCBkPSJNMzAuMDE0ODQ3Niw0NS43NjU0Mjc1IEM0OC44NjA3MDg3LDIzLjIxODIxNjIgODIuMDIxMzQzMiwwIDEyNy43MzYyNjUsMCBDMTQ5LjkxNTUwNiwwIDE2Ni42MjU2OTUsNS44MjI1OTE4MyAxNjYuNjI1Njk1LDUuODIyNTkxODMgTDkwLjI4OTg1NjUsOTYuNTE2NDk0MyBMMzYuMjA1NDA5OSw5Ni41MTY0OTQzIEwzMC4wMTQ4NDc2LDQ1Ljc2NTQyNzUgWiIgZmlsbD0iIzFBNzNFOCIvPjxwYXRoIGQ9Ik0xMi42MTIwMDgxLDE4OC44OTE1MTcgQzEyLjYxMjAwODEsMTg4Ljg5MTUxNyAwLDE2NC4xOTQyMDQgMCwxMjguNDE0NDg1IEMwLDk0LjU5NzI3NTcgMTMuMTQ1OTI2LDY1LjAzNjk3OTkgMzAuMDE0ODQ3Niw0NS43NjU0Mjc1IEw5MC4zMzMxNDcxLDk2LjUyMzcwOTQgTDEyLjYxMjAwODEsMTg4Ljg5MTUxNyBaIiBmaWxsPSIjRUE0MzM1Ii8+PC9zdmc+' },
  { id: 'g-gmail', name: 'Gmail', url: 'https://mail.google.com', icon: 'https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png' },
  { id: 'g-play', name: 'Play', url: 'https://play.google.com', icon: 'https://www.gstatic.com/images/branding/product/2x/play_prism_96in128dp.png' },
  { id: 'g-news', name: 'News', url: 'https://news.google.com', icon: 'https://www.gstatic.com/images/branding/product/2x/news_96in128dp.png' },
  { id: 'g-meet', name: 'Meet', url: 'https://meet.google.com', icon: 'https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-96dp/logo.png' },
  { id: 'g-drive', name: 'Drive', url: 'https://drive.google.com', icon: 'https://www.google.com/images/branding/product/2x/drive_2020q4_48dp.png' },
  { id: 'g-calendar', name: 'Calendar', url: 'https://calendar.google.com', icon: 'https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png' },
  { id: 'g-translate', name: 'Translate', url: 'https://translate.google.com', icon: 'https://www.gstatic.com/images/branding/product/2x/translate_96in128dp.png' },
  { id: 'g-photos', name: 'Photos', url: 'https://photos.google.com', icon: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjU2IDI1NiIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik02NCw1OC4xNDg1NzE0IEM5OS4zMjgsNTguMTQ4NTcxNCAxMjgsODYuODIwNTcxNCAxMjgsMTIyLjE0ODU3MSBMMTI4LDEyMi4xNDg1NzEgTDEyOCwxMjggTDUuODUxNDI4NTcsMTI4IEMyLjYzMzE0Mjg2LDEyOCAwLDEyNS4zNjY4NTcgMCwxMjIuMTQ4NTcxIEMwLDg2LjgyMDU3MTQgMjguNjcyLDU4LjE0ODU3MTQgNjQsNTguMTQ4NTcxNCBMNjQsNTguMTQ4NTcxNCBaIiBmaWxsPSIjRkJCQjA1Ii8+PHBhdGggZD0iTTE5Ny44NTE0MjksNjQgQzE5Ny44NTE0MjksOTkuMzI4IDE2OS4xNzk0MjksMTI4IDEzMy44NTE0MjksMTI4IEwxMjgsMTI4IEwxMjgsNS44NTE0Mjg1NyBDMTI4LDIuNjMzMTQyODYgMTMwLjYzMzE0MywwIDEzMy44NTE0MjksMCBMMTMzLjg1MTQyOSwwIEMxNjkuMTc5NDI5LDAgMTk3Ljg1MTQyOSwyOC42NzIgMTk3Ljg1MTQyOSw2NCBaIiBmaWxsPSIjRTk0MzM1Ii8+PHBhdGggZD0iTTE5MiwxOTcuODUxNDI5IEMxNTYuNjcyLDE5Ny44NTE0MjkgMTI4LDE2OS4xNzk0MjkgMTI4LDEzMy44NTE0MjkgTDEyOCwxMzMuODUxNDI5IEwxMjgsMTI4IEwyNTAuMTQ4NTcxLDEyOCBDMjUzLjM2Njg1NywxMjggMjU2LDEzMC42MzMxNDMgMjU2LDEzMy44NTE0MjkgTDI1NiwxMzMuODUxNDI5IEMyNTYsMTY5LjE3OTQyOSAyMjcuMzI4LDE5Ny44NTE0MjkgMTkyLDE5Ny44NTE0MjkgTDE5MiwxOTcgMTk3Ljg1MTQyOSBaIiBmaWxsPSIjNDI4NUY0Ii8+PHBhdGggZD0iTTU4LjE0ODU3MTQsMTkyIEM1OC4xNDg1NzE0LDE1Ni42NzIgODYuODIwNTcxNCwxMjggMTIyLjE0ODU3MSwxMjggTDEyOCwxMjggTDEyOCwyNTAuMTQ4NTcxIEMxMjgsMjUzLjM2Njg1NyAxMjUuMzY2ODU3LDI1NiAxMjIuMTQ4NTcxLDI1NiBMMTIyLjE0ODU3MSwyNTYgQzg2LjgyMDU3MTQsMjU2IDU4LjE0ODU3MTQsMjI3LjMyOCA1OC4xNDg1NzE0LDE5MiBaIiBmaWxsPSIjMEY5RDU4Ii8+PC9zdmc+' },
  { id: 'g-contacts', name: 'Contacts', url: 'https://contacts.google.com', icon: 'https://www.gstatic.com/images/branding/product/2x/contacts_2022_96in128dp.png' },
];

// AI, Office, Utility & Others
export const INITIAL_OTHERS: AppItem[] = [
  { id: 'g-gemini', name: 'Gemini', url: 'https://gemini.google.com', icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg' },
  { id: 'g-notebooklm', name: 'NotebookLM', url: 'https://notebooklm.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Google_NotebookLM_Logo.svg/512px-Google_NotebookLM_Logo.svg.png' },
  { id: 'g-docs', name: 'Docs', url: 'https://docs.google.com', icon: 'https://www.gstatic.com/images/branding/product/2x/docs_2020q4_48dp.png' },
  { id: 'g-sheets', name: 'Sheets', url: 'https://sheets.google.com', icon: 'https://www.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png' },
  { id: 'g-slides', name: 'Slides', url: 'https://slides.google.com', icon: 'https://www.gstatic.com/images/branding/product/2x/slides_2020q4_48dp.png' },
  { id: 'g-keep', name: 'Keep', url: 'https://keep.google.com', icon: 'https://www.gstatic.com/images/branding/product/2x/keep_2020q4_48dp.png' },
  { id: 'g-forms', name: 'Forms', url: 'https://forms.google.com', icon: 'https://www.gstatic.com/images/branding/product/2x/forms_2020q4_48dp.png' },
  { id: 'g-ytmusic', name: 'YT Music', url: 'https://music.youtube.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Youtube_Music_icon.svg' },
  { id: 'g-chromestore', name: 'Chrome Store', url: 'https://chrome.google.com/webstore', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg' },
  { id: 'g-travel', name: 'Travel', url: 'https://www.google.com/travel', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Google_Travel_icon.svg' },
  { id: 'g-earth', name: 'Earth', url: 'https://earth.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_Earth_icon.svg' },
  { id: 'g-passwords', name: 'Password Mgr', url: 'https://passwords.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Google_Password_Manager_logo.svg' },
  { id: 'g-one', name: 'Google One', url: 'https://one.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Google_One_icon_%282020%29.svg' },
  { id: 'g-classroom', name: 'Classroom', url: 'https://classroom.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Google_Classroom_Logo.svg' },
  { id: 'g-ads', name: 'Ads', url: 'https://ads.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Ads_logo.svg' }
];

export const ALL_APPS = [...INITIAL_FAVORITES, ...INITIAL_OTHERS];