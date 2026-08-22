# 📚 Bookmarks Feature - Complete Guide

## Overview

The Bookmarks feature is a universal content tracking system that allows users to organize movies, series, games, and anime content into personalized categories. It's built with Material Design 3 for a modern, responsive interface.

## ✨ Features

### 📋 Status Categories
- **Favorite (⭐)** - Mark your favorite content
- **Watching (▶️)** - Currently watching
- **Planned (📋)** - Planning to watch later
- **Watched (✓)** - Already completed
- **Postponed (⏸️)** - Temporarily on hold
- **Dropped (✗)** - Dropped content

### 🎬 Content Types
- Anime
- Movies
- TV Series
- Video Games

### 🎯 Core Functionality
- ✅ Add/remove bookmarks with status selection
- ✅ Track progress (episodes watched, game completion %)
- ✅ Personal ratings (0-10 stars)
- ✅ Mark as favorite with visual indicator
- ✅ Add personal notes and comments
- ✅ Search and filter bookmarks
- ✅ Sort by date, rating, or progress
- ✅ Dark/Light theme support
- ✅ Responsive Mobile Design (Material Design 3)
- ✅ Real-time synchronization with Supabase

## 🏗️ Architecture

### File Structure

```
src/
├── pages/
│   └── Bookmarks.tsx                 # Main bookmarks page with tabs
├── components/
│   ├── ContentCard.tsx               # Individual content card
│   ├── AddToBookmarks.tsx            # Dropdown menu for adding to bookmarks
│   └── SettingsPanel.tsx             # Theme toggle integration
├── services/
│   └── bookmarkService.ts            # CRUD operations with Supabase
├── hooks/
│   └── useBookmark.ts                # Custom hook for bookmark state
├── types/
│   └── anime.ts                      # TypeScript interfaces
├── context/
│   └── ThemeContext.tsx              # Theme management
└── examples/
    └── bookmarkExample.tsx           # Integration example
```

### Database Schema

```sql
content_bookmarks:
- id (UUID) - Primary key
- user_id (UUID) - Reference to auth user
- content_type (TEXT) - anime, movie, series, game
- content_id (TEXT) - External content ID
- title (TEXT) - Content title
- poster_url (TEXT) - Image URL
- status (TEXT) - One of the 6 status categories
- user_rating (INT) - User's rating 0-10
- external_rating (DECIMAL) - From TMDB/external API
- progress (INT) - Episodes watched/completion %
- total_items (INT) - Total episodes/chapters
- is_favorite (BOOLEAN) - Favorite flag
- notes (TEXT) - User notes
- genre (TEXT) - Genre information
- release_year (TEXT) - Release year
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🚀 Getting Started

### 1. Database Setup

First, create the required Supabase table. See [BOOKMARKS_SETUP.md](./BOOKMARKS_SETUP.md) for SQL migration.

### 2. Access the Feature

Navigate to `/bookmarks` to see your bookmarks collection.

### 3. Add Content to Bookmarks

Use the `AddToBookmarks` component in any detail page:

```tsx
import AddToBookmarks from "@/components/AddToBookmarks";
import { useBookmark } from "@/hooks/useBookmark";

export const MovieDetail = ({ movie }) => {
  const [userId, setUserId] = useState<string | null>(null);
  
  const { isBookmarked } = useBookmark({
    contentId: movie.id,
    contentType: "movie",
    userId,
  });

  const handleAddToBookmark = async (status) => {
    // Implementation
  };

  return (
    <AddToBookmarks
      contentId={movie.id}
      contentType="movie"
      title={movie.title}
      posterUrl={movie.posterUrl}
      externalRating={movie.rating}
      genre={movie.genre}
      releaseYear={movie.year}
      onAdd={handleAddToBookmark}
      isBookmarked={isBookmarked}
    />
  );
};
```

## 🎨 Theme Integration

The bookmarks feature includes full theme support:

```tsx
import { useTheme } from "@/context/ThemeContext";

const YourComponent = () => {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {isDark ? "Light Mode" : "Dark Mode"}
    </button>
  );
};
```

Toggle theme in Settings → Display → Theme

## 📱 Responsive Design

The feature is fully responsive:

**Mobile (< 640px):**
- Single column grid
- Compact headers
- Touch-friendly buttons

**Tablet (640px - 1024px):**
- 2 column grid
- Readable text sizes

**Desktop (> 1024px):**
- 3-4 column grid
- Full navigation bar
- Advanced filtering options

## 🔒 Security

- Row-Level Security (RLS) enabled in Supabase
- Users can only access their own bookmarks
- Authentication required for all operations
- Data encrypted in transit

## ⚡ Performance

- Indexed database queries for fast filtering
- Lazy loading for images
- Efficient state management with React hooks
- Query caching with React Query
- Pagination-ready structure

## 🛠️ API Reference

### Service Functions

#### `addToBookmarks(userId, bookmarkData)`
Adds content to user's bookmarks.

```typescript
const result = await addToBookmarks(userId, {
  contentType: "movie",
  contentId: "123",
  title: "Inception",
  posterUrl: "...",
  status: "watching",
  isFavorite: false,
});
```

#### `getUserBookmarks(userId, contentType?, status?)`
Retrieves all bookmarks or filtered by type/status.

```typescript
const bookmarks = await getUserBookmarks(userId, "movie", "watching");
```

#### `getBookmarksByStatus(userId, status)`
Gets bookmarks by specific status.

```typescript
const favorites = await getBookmarksByStatus(userId, "favorite");
```

#### `getBookmarkStats(userId)`
Gets count of bookmarks by status.

```typescript
const stats = await getBookmarkStats(userId);
// { favorite: 5, watching: 12, ... }
```

#### `updateBookmark(bookmarkId, updates)`
Updates a bookmark's properties.

```typescript
await updateBookmark(bookmarkId, {
  status: "watched",
  userRating: 8,
  progress: 10,
  totalItems: 10,
});
```

#### `toggleFavorite(bookmarkId, isFavorite)`
Quick toggle for favorite status.

```typescript
await toggleFavorite(bookmarkId, true);
```

#### `deleteBookmark(bookmarkId)`
Removes a bookmark.

```typescript
await deleteBookmark(bookmarkId);
```

#### `checkBookmarkExists(userId, contentId, contentType)`
Checks if content is already bookmarked.

```typescript
const existing = await checkBookmarkExists(userId, "123", "movie");
```

#### `searchBookmarks(userId, query, contentType?)`
Searches bookmarks by title.

```typescript
const results = await searchBookmarks(userId, "inception");
```

## 🎯 Usage Examples

### Example 1: Add Movie to Bookmarks

```tsx
import { addToBookmarks } from "@/services/bookmarkService";

const handleAddMovie = async () => {
  const result = await addToBookmarks(userId, {
    contentType: "movie",
    contentId: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    status: "watching",
    externalRating: movie.rating,
    genre: movie.genre,
    releaseYear: movie.year,
    isFavorite: false,
  });
  
  toast.success("Added to bookmarks!");
};
```

### Example 2: Track Progress

```tsx
import { updateBookmark } from "@/services/bookmarkService";

const handleProgressUpdate = async (bookmarkId, watched, total) => {
  await updateBookmark(bookmarkId, {
    progress: watched,
    totalItems: total,
  });
};
```

### Example 3: Rate Content

```tsx
const handleRating = async (bookmarkId, rating) => {
  await updateBookmark(bookmarkId, {
    userRating: rating,
  });
};
```

## 🐛 Troubleshooting

### "Please sign in" message
- User is not authenticated
- Check if Supabase auth is configured
- Navigate to `/auth` to sign in

### Bookmarks not loading
- Check Supabase connection in browser console
- Verify RLS policies are configured
- Ensure `content_bookmarks` table exists

### Images not loading
- Check `posterUrl` is a valid HTTP/HTTPS URL
- Verify image server is accessible
- Use fallback poster placeholder

### Theme toggle not working
- Ensure `ThemeProvider` wraps your app in `App.tsx`
- Check localStorage is enabled
- Verify CSS dark mode class is applied

## 📚 Related Files

- [BOOKMARKS_SETUP.md](./BOOKMARKS_SETUP.md) - Database setup guide
- [src/services/bookmarkService.ts](./src/services/bookmarkService.ts) - Main service
- [src/pages/Bookmarks.tsx](./src/pages/Bookmarks.tsx) - Main component
- [src/components/ContentCard.tsx](./src/components/ContentCard.tsx) - Card component
- [src/hooks/useBookmark.ts](./src/hooks/useBookmark.ts) - Custom hook
- [src/types/anime.ts](./src/types/anime.ts) - TypeScript definitions

## 🚧 Future Enhancements

- [ ] Collaborative watchlists (shared with friends)
- [ ] Social sharing (recommendations)
- [ ] Email notifications for new releases
- [ ] Calendar view for planned watches
- [ ] Advanced statistics and analytics
- [ ] Import/export functionality
- [ ] Bulk operations
- [ ] Bookmark collections/folders
- [ ] Watchlist templates
- [ ] Integration with streaming services

## 📝 License

This feature is part of the ReverseX application. See LICENSE file for details.

---

**Last Updated:** January 5, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
