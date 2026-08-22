// Status categories with Material Design 3 colors
export type ContentStatus = 'favorite' | 'watching' | 'planned' | 'watched' | 'postponed' | 'dropped';
export type ContentType = 'anime' | 'movie' | 'series' | 'game';

// Universal bookmark for any content type
export interface ContentBookmark {
  id: string;
  userId: string;
  contentType: ContentType;
  contentId: string; // External ID from API (TMDB ID, game ID, etc.)
  title: string;
  posterUrl?: string;
  status: ContentStatus;
  userRating?: number; // User's rating 0-10
  externalRating?: number; // From API (IMDb, TMDB, etc.)
  progress?: number; // Episodes watched / game completion %
  totalItems?: number; // Total episodes / chapters
  isFavorite: boolean;
  notes?: string;
  synopsis?: string; // Description/overview
  genre?: string;
  releaseYear?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentStatusConfig {
  status: ContentStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const CONTENT_STATUS_CONFIG: Record<ContentStatus, ContentStatusConfig> = {
  favorite: {
    status: 'favorite',
    label: 'Избранное',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500',
    icon: '⭐',
  },
  watching: {
    status: 'watching',
    label: 'Смотрю',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500',
    icon: '▶️',
  },
  planned: {
    status: 'planned',
    label: 'В планах',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500',
    icon: '📋',
  },
  watched: {
    status: 'watched',
    label: 'Просмотрено',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500',
    icon: '✓',
  },
  postponed: {
    status: 'postponed',
    label: 'Отложено',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500',
    icon: '⏸️',
  },
  dropped: {
    status: 'dropped',
    label: 'Брошено',
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
    borderColor: 'border-red-600',
    icon: '✗',
  },
};

export interface ContentStats {
  total: number;
  favorite: number;
  watching: number;
  planned: number;
  watched: number;
  postponed: number;
  dropped: number;
  byType: {
    anime: number;
    movie: number;
    series: number;
    game: number;
  };
}

// Alias for backward compatibility
export type AnimeStatus = ContentStatus;
export type AnimeBookmark = ContentBookmark;
export const ANIME_STATUS_CONFIG = CONTENT_STATUS_CONFIG;
export type AnimeBookmarkStats = ContentStats;
