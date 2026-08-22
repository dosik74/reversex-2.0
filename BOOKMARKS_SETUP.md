# Bookmarks Feature Setup

## Database Setup for Supabase

To enable the bookmarks feature, you need to create the `content_bookmarks` table in your Supabase database.

### SQL Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Create content_bookmarks table
CREATE TABLE IF NOT EXISTS content_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('anime', 'movie', 'series', 'game')),
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_url TEXT,
  status TEXT NOT NULL DEFAULT 'watching' CHECK (status IN ('favorite', 'watching', 'planned', 'watched', 'postponed', 'dropped')),
  user_rating INTEGER CHECK (user_rating >= 0 AND user_rating <= 10),
  external_rating DECIMAL(3,1),
  progress INTEGER,
  total_items INTEGER,
  is_favorite BOOLEAN DEFAULT FALSE,
  notes TEXT,
  genre TEXT,
  release_year TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  -- Create unique constraint for content per user
  UNIQUE(user_id, content_id, content_type)
);

-- Create indexes for performance
CREATE INDEX idx_content_bookmarks_user_id ON content_bookmarks(user_id);
CREATE INDEX idx_content_bookmarks_status ON content_bookmarks(user_id, status);
CREATE INDEX idx_content_bookmarks_content_type ON content_bookmarks(user_id, content_type);
CREATE INDEX idx_content_bookmarks_is_favorite ON content_bookmarks(user_id, is_favorite);
CREATE INDEX idx_content_bookmarks_created_at ON content_bookmarks(user_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE content_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - Users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON content_bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy - Users can only insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks"
  ON content_bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy - Users can only update their own bookmarks
CREATE POLICY "Users can update their own bookmarks"
  ON content_bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policy - Users can only delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON content_bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Features

### Status Categories
- **Favorite (⭐)** - Purple - Your favorite content
- **Watching (▶️)** - Green - Currently watching
- **Planned (📋)** - Red - Planning to watch
- **Watched (✓)** - Gray - Already watched
- **Postponed (⏸️)** - Orange - On hold
- **Dropped (✗)** - Dark Red - Dropped

### Content Types Supported
- **Anime** - From anime databases
- **Movie** - From TMDB
- **Series** - From TMDB
- **Game** - From game databases

### Features
- ✅ Add content to any status category
- ✅ Track progress (episodes/chapters watched)
- ✅ Personal ratings (0-10 stars)
- ✅ Mark as favorite
- ✅ Add personal notes
- ✅ Sort by date, rating, or progress
- ✅ Search bookmarks
- ✅ Dark/Light theme support
- ✅ Responsive mobile design (Material Design 3)

## Usage

### In Your Components

```tsx
import AddToBookmarks from "@/components/AddToBookmarks";
import { useBookmark } from "@/hooks/useBookmark";

// In your content detail component
const MyMovieDetail = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const { bookmark, isBookmarked, addToBookmark } = useBookmark({
    contentId: movieId,
    contentType: "movie",
    userId,
  });

  const handleAddToBookmark = async (status: ContentStatus) => {
    await addToBookmark({
      userId,
      contentType: "movie",
      contentId: movieId,
      title: "Movie Title",
      posterUrl: "...",
      status,
      externalRating: 8.5,
      genre: "Action",
      releaseYear: "2024",
      isFavorite: false,
    });
  };

  return (
    <AddToBookmarks
      contentId={movieId}
      contentType="movie"
      title="Movie Title"
      posterUrl="..."
      externalRating={8.5}
      genre="Action"
      releaseYear="2024"
      onAdd={handleAddToBookmark}
      isBookmarked={isBookmarked}
    />
  );
};
```

## API Endpoints

All operations are handled through the `bookmarkService.ts`:

### Add to Bookmarks
```typescript
addToBookmarks(userId, bookmarkData)
```

### Get User Bookmarks
```typescript
getUserBookmarks(userId, contentType?, status?)
```

### Get Bookmarks by Status
```typescript
getBookmarksByStatus(userId, status)
```

### Get Statistics
```typescript
getBookmarkStats(userId)
```

### Update Bookmark
```typescript
updateBookmark(bookmarkId, updates)
```

### Delete Bookmark
```typescript
deleteBookmark(bookmarkId)
```

### Check if Bookmarked
```typescript
checkBookmarkExists(userId, contentId, contentType)
```

### Search Bookmarks
```typescript
searchBookmarks(userId, query, contentType?)
```

## Theme Support

The bookmarks feature includes full support for:
- ✅ Dark/Light theme toggle in Settings
- ✅ Material Design 3 colors
- ✅ Smooth transitions and animations
- ✅ Responsive design (Mobile, Tablet, Desktop)

## Performance Optimizations

- Indexed queries for fast filtering by user, status, content type
- Optimized image loading with lazy loading
- Efficient state management with React hooks
- Query caching with React Query
- Pagination-ready structure
- RLS (Row Level Security) for data protection
