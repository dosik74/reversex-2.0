import React from 'react';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon?: React.ReactNode; 
  initials?: string;
}

export interface AppItem {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
}

export interface BackgroundTheme {
  name: string;
  value: string; // CSS background value (color or gradient)
  textColor: string;
}

export interface AppSettings {
  blurAmount: number; // px
  isAnimationEnabled: boolean;
  timeFormat: '12h' | '24h';
  searchEngine: 'google' | 'bing' | 'duckduckgo' | 'yahoo';
  lockBackground: boolean;
  customBackground: string | null; // Base64 string of uploaded image
  customVideo: boolean; // Flag to indicate if a video from IDB should be used
  themeColor: string; // Hex color
  language: 'en' | 'ru';
}