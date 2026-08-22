# 🚀 Quick Start Guide - Bookmarks Feature

## 1️⃣ Database Setup (5 minutes)

Open your Supabase dashboard and run this SQL:

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
  UNIQUE(user_id, content_id, content_type)
);

-- Create indexes
CREATE INDEX idx_content_bookmarks_user_id ON content_bookmarks(user_id);
CREATE INDEX idx_content_bookmarks_status ON content_bookmarks(user_id, status);
CREATE INDEX idx_content_bookmarks_content_type ON content_bookmarks(user_id, content_type);
CREATE INDEX idx_content_bookmarks_is_favorite ON content_bookmarks(user_id, is_favorite);
CREATE INDEX idx_content_bookmarks_created_at ON content_bookmarks(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE content_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bookmarks" ON content_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookmarks" ON content_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookmarks" ON content_bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookmarks" ON content_bookmarks FOR DELETE USING (auth.uid() = user_id);
```

## 2️⃣ Start the Application

```bash
npm run dev
```

## 3️⃣ Access the Feature

### View Bookmarks
- **URL:** `http://localhost:5173/bookmarks`
- **Navigation:** Click "Bookmarks" in the top menu

### Switch Theme
- **Settings:** Click "Settings" in user menu
- **Tab:** Click "Display" tab
- **Toggle:** Click "Theme" button
- Works instantly across entire app!

## 4️⃣ Add Content to Bookmarks (Optional - After integration)

To add bookmarks button to Movies/Series/Games pages, see [BOOKMARKS_FEATURE.md](./BOOKMARKS_FEATURE.md#usage-examples)

---

## 📊 Features You Get

✅ 6 status categories (Favorite, Watching, Planned, Watched, Postponed, Dropped)
✅ 4 content types (Anime, Movie, Series, Game)
✅ Progress tracking
✅ Personal ratings
✅ Favorite flagging
✅ Search & sort
✅ Dark/Light theme
✅ Mobile responsive
✅ Real-time statistics

---

## 🎨 What It Looks Like

**Bookmarks Page:**
- Horizontal tabs for each status
- Grid of content cards
- Search bar at top
- Statistics showing count per status

**Content Cards:**
- Poster image
- Title with metadata
- Progress bar (if watching)
- Rating stars
- Favorite button
- Delete button
- Notes display

**Theme Toggle:**
- Sun/Moon icon
- Smooth color transition
- Applies immediately to entire app
- Saved in localStorage

---

## 🔧 Troubleshooting

**"Table doesn't exist" error?**
→ Run the SQL migration in Supabase

**"Not authenticated" on bookmarks page?**
→ Sign in via `/auth`

**Theme toggle not working?**
→ Refresh the page or check browser console

**Images not loading?**
→ Check poster URL is valid HTTP/HTTPS

---

## 📚 Learn More

- **Complete Setup:** [BOOKMARKS_SETUP.md](./BOOKMARKS_SETUP.md)
- **Full Documentation:** [BOOKMARKS_FEATURE.md](./BOOKMARKS_FEATURE.md)
- **Implementation Details:** [BOOKMARKS_IMPLEMENTATION_COMPLETE.md](./BOOKMARKS_IMPLEMENTATION_COMPLETE.md)
- **Code Examples:** [src/examples/bookmarkExample.tsx](./src/examples/bookmarkExample.tsx)

---

**That's it! Your bookmarks feature is ready to use!** 🎉
