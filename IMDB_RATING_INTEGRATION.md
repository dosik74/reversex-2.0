# IMDb Rating Integration Guide

This document describes how to use the IMDb rating system integrated with TMDB data.

## Architecture

The system consists of several components:

### 1. **OMDb API Service** (`src/utils/omdbApi.ts`)
- Handles direct communication with OMDb API
- Caches ratings in memory to avoid duplicate requests
- Provides `getIMDbRating(imdbId)` function

**Example:**
```typescript
import { getIMDbRating } from '@/utils/omdbApi';

const rating = await getIMDbRating('tt1375666');
console.log(rating.imdbRating); // 8.5
```

### 2. **Rating Service** (`src/utils/ratingService.ts`)
- Bridges TMDB and OMDb APIs
- Gets IMDb ID from TMDB using movie/series IDs
- Fetches complete rating information

**Example:**
```typescript
import { getMovieWithRating, getSeriesWithRating } from '@/utils/ratingService';

// For movies
const movieWithRating = await getMovieWithRating(
  550,  // TMDB ID
  'Fight Club',
  '/path/to/poster.jpg',
  '1999-10-15'
);

// For TV series
const seriesWithRating = await getSeriesWithRating(
  1399,  // TMDB ID
  'Breaking Bad',
  '/path/to/poster.jpg',
  '2008-01-20'
);
```

### 3. **Database Cache** (`src/utils/imdbCache.ts`)
- Stores IMDb ratings in Supabase database
- Reduces API calls by caching fetched data
- Automatically updates stale data (older than 7 days)

**Example:**
```typescript
import { saveIMDbRating, getCachedIMDbRating } from '@/utils/imdbCache';

// Save a rating
await saveIMDbRating(550, 'tt0137523', rating, 'movie');

// Retrieve cached rating
const cached = await getCachedIMDbRating(550);
```

### 4. **React Hook** (`src/hooks/useIMDbRating.ts`)
- Simplifies rating fetching in React components
- Handles caching automatically
- Supports loading and error states

**Example:**
```typescript
import { useIMDbRating } from '@/hooks/useIMDbRating';

const MyComponent = ({ tmdbId }) => {
  const { rating, loading, error } = useIMDbRating({
    tmdbId,
    mediaType: 'movie'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!rating) return null;

  return <div>IMDb Rating: {rating.imdbRating}</div>;
};
```

### 5. **Display Component** (`src/components/IMDbRatingDisplay.tsx`)
- Renders IMDb rating with color coding
- Supports multiple sizes (sm, md, lg)
- Shows vote count optionally

**Example:**
```typescript
import IMDbRatingDisplay from '@/components/IMDbRatingDisplay';

<IMDbRatingDisplay 
  rating={rating}
  size="md"
  showVotes={true}
/>
```

## Database Schema

```sql
CREATE TABLE movies_imdb_ratings (
    id UUID PRIMARY KEY,
    tmdb_id INTEGER UNIQUE NOT NULL,
    imdb_id TEXT,
    imdb_rating NUMERIC(3, 1),
    imdb_votes INTEGER,
    media_type TEXT NOT NULL, -- 'movie' or 'tv'
    last_updated TIMESTAMP,
    created_at TIMESTAMP
);
```

## Usage in Components

### In Movie Cards
```typescript
import { useIMDbRating } from '@/hooks/useIMDbRating';
import IMDbRatingDisplay from '@/components/IMDbRatingDisplay';

const MovieCard = ({ tmdbId, title }) => {
  const { rating, loading } = useIMDbRating({
    tmdbId,
    mediaType: 'movie'
  });

  return (
    <div>
      <h3>{title}</h3>
      <IMDbRatingDisplay rating={rating} isLoading={loading} size="md" />
    </div>
  );
};
```

### In Detailed Views
```typescript
const MovieDetail = ({ tmdbId, mediaType }) => {
  const { rating, loading, error } = useIMDbRating({
    tmdbId,
    mediaType
  });

  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      {rating && (
        <IMDbRatingDisplay 
          rating={rating} 
          size="lg" 
          showVotes={true} 
        />
      )}
    </div>
  );
};
```

## API Keys

- **OMDb API Key**: `1e8fe39e` (configured in `src/utils/omdbApi.ts`)
- **TMDB API Key**: `a981b3ba0b345f578fb917ee74a90bf3` (in `src/utils/tmdbApi.ts`)

## Performance Considerations

1. **In-Memory Cache**: First request checks memory cache
2. **Database Cache**: Subsequent requests check Supabase
3. **Rate Limiting**: 100ms delay between OMDb API requests
4. **Stale Data**: Ratings older than 7 days are refreshed automatically

## Error Handling

All functions gracefully handle errors:
- Invalid IMDb IDs return `null`
- API failures don't crash the app
- Errors are logged to console

## Future Improvements

- [ ] Implement CDN caching for popular titles
- [ ] Add batch rating fetching optimization
- [ ] Create rating update scheduler
- [ ] Add rating history tracking
- [ ] Implement notification system for rating changes
