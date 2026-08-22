import supabase from '@/lib/supabase';
import { ContentBookmark, ContentStatus, ContentType } from '@/types/anime';

/**
 * Add content to bookmarks — checks for duplicates first, updates if exists
 */
export const addToBookmarks = async (
  userId: string,
  bookmark: Omit<ContentBookmark, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
): Promise<ContentBookmark | null> => {
  try {
    // Check if already exists
    const existing = await checkBookmarkExists(userId, bookmark.contentId, bookmark.contentType);

    if (existing) {
      // Update existing bookmark's status
      return await updateBookmark(existing.id, {
        status: bookmark.status,
        isFavorite: bookmark.status === 'favorite',
      });
    }

    // Build insert data — only include defined, non-empty values
    const insertData: Record<string, any> = {
      user_id: userId,
      content_type: bookmark.contentType,
      content_id: String(bookmark.contentId),
      title: bookmark.title,
      status: bookmark.status,
      is_favorite: bookmark.isFavorite || false,
      user_rating: bookmark.userRating || 0,
      progress: bookmark.progress || 0,
      total_items: bookmark.totalItems || 0,
    };

    // Optional fields — only add if they have values
    if (bookmark.posterUrl) insertData.poster_url = bookmark.posterUrl;
    if (bookmark.externalRating) insertData.external_rating = bookmark.externalRating;
    if (bookmark.notes) insertData.notes = bookmark.notes;
    if (bookmark.synopsis) insertData.synopsis = bookmark.synopsis;
    if (bookmark.genre) insertData.genre = bookmark.genre;
    if (bookmark.releaseYear) insertData.release_year = bookmark.releaseYear;

    console.log('📌 Inserting bookmark:', insertData);

    const { data, error } = await supabase
      .from('content_bookmarks')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error.code, error.message, error.details, error.hint);
      throw error;
    }

    console.log('✅ Bookmark inserted:', data);
    return data ? transformBookmark(data) : null;
  } catch (error: any) {
    console.error('Error adding to bookmarks:', error);
    throw error;
  }
};

/**
 * Get bookmarks for user with optional filters
 */
export const getUserBookmarks = async (
  userId: string,
  contentType?: ContentType,
  status?: ContentStatus
): Promise<ContentBookmark[]> => {
  try {
    let query = supabase
      .from('content_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(transformBookmark);
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return [];
  }
};

/**
 * Get bookmarks by status
 */
export const getBookmarksByStatus = async (
  userId: string,
  status: ContentStatus
): Promise<ContentBookmark[]> => {
  try {
    const { data, error } = await supabase
      .from('content_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformBookmark);
  } catch (error) {
    console.error('Error getting bookmarks by status:', error);
    return [];
  }
};

/**
 * Get bookmark count by status
 */
export const getBookmarkStats = async (
  userId: string
): Promise<Record<ContentStatus, number>> => {
  try {
    const { data, error } = await supabase
      .from('content_bookmarks')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    const stats: Record<ContentStatus, number> = {
      favorite: 0,
      watching: 0,
      planned: 0,
      watched: 0,
      postponed: 0,
      dropped: 0,
    };

    (data || []).forEach((item: any) => {
      if (item.status in stats) {
        stats[item.status as ContentStatus]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting bookmark stats:', error);
    return {
      favorite: 0,
      watching: 0,
      planned: 0,
      watched: 0,
      postponed: 0,
      dropped: 0,
    };
  }
};

/**
 * Update bookmark
 */
export const updateBookmark = async (
  bookmarkId: string,
  updates: Partial<ContentBookmark>
): Promise<ContentBookmark | null> => {
  try {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.userRating !== undefined) updateData.user_rating = updates.userRating;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('content_bookmarks')
      .update(updateData)
      .eq('id', bookmarkId)
      .select()
      .single();

    if (error) throw error;

    return data ? transformBookmark(data) : null;
  } catch (error) {
    console.error('Error updating bookmark:', error);
    throw error;
  }
};

/**
 * Toggle favorite status
 */
export const toggleFavorite = async (
  bookmarkId: string,
  isFavorite: boolean
): Promise<ContentBookmark | null> => {
  return updateBookmark(bookmarkId, { isFavorite });
};

/**
 * Update bookmark status
 */
export const updateBookmarkStatus = async (
  bookmarkId: string,
  newStatus: ContentStatus
): Promise<ContentBookmark | null> => {
  return updateBookmark(bookmarkId, { status: newStatus });
};

/**
 * Update bookmark rating
 */
export const updateBookmarkRating = async (
  bookmarkId: string,
  newRating: number
): Promise<ContentBookmark | null> => {
  return updateBookmark(bookmarkId, { userRating: newRating });
};

/**
 * Delete bookmark
 */
export const deleteBookmark = async (bookmarkId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('content_bookmarks')
      .delete()
      .eq('id', bookmarkId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return false;
  }
};

/**
 * Check if content is already bookmarked
 * Uses .maybeSingle() to avoid 406 error when no rows found
 */
export const checkBookmarkExists = async (
  userId: string,
  contentId: string,
  contentType: ContentType
): Promise<ContentBookmark | null> => {
  try {
    const { data, error } = await supabase
      .from('content_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', String(contentId))
      .eq('content_type', contentType)
      .maybeSingle();

    if (error) {
      console.error('Error checking bookmark:', error.code, error.message);
      return null;
    }

    return data ? transformBookmark(data) : null;
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return null;
  }
};

/**
 * Search bookmarks by title
 */
export const searchBookmarks = async (
  userId: string,
  query: string,
  contentType?: ContentType
): Promise<ContentBookmark[]> => {
  try {
    let dbQuery = supabase
      .from('content_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .ilike('title', `%${query}%`)
      .order('updated_at', { ascending: false });

    if (contentType) {
      dbQuery = dbQuery.eq('content_type', contentType);
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    return (data || []).map(transformBookmark);
  } catch (error) {
    console.error('Error searching bookmarks:', error);
    return [];
  }
};

/**
 * Transform database record to ContentBookmark interface
 */
function transformBookmark(data: any): ContentBookmark {
  return {
    id: data.id,
    userId: data.user_id,
    contentType: data.content_type as ContentType,
    contentId: data.content_id,
    title: data.title,
    posterUrl: data.poster_url,
    status: data.status as ContentStatus,
    userRating: data.user_rating,
    externalRating: data.external_rating,
    progress: data.progress,
    totalItems: data.total_items,
    isFavorite: data.is_favorite,
    notes: data.notes,
    synopsis: data.synopsis,
    genre: data.genre,
    releaseYear: data.release_year,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
