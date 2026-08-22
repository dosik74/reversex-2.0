import { useEffect, useState, useCallback } from "react";
import { ContentBookmark, ContentType, ContentStatus } from "@/types/anime";
import {
  checkBookmarkExists,
  addToBookmarks as addBookmark,
  updateBookmark as updateBookmarkService,
  deleteBookmark as deleteBookmarkService,
} from "@/services/bookmarkService";

interface UseBookmarkParams {
  contentId: string;
  contentType: ContentType;
  userId?: string;
}

export const useBookmark = ({
  contentId,
  contentType,
  userId,
}: UseBookmarkParams) => {
  const [bookmark, setBookmark] = useState<ContentBookmark | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && contentId) {
      checkBookmark();
    }
  }, [userId, contentId, contentType]);

  const checkBookmark = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const existing = await checkBookmarkExists(userId, contentId, contentType);
      setBookmark(existing);
    } catch (error) {
      console.error("Error checking bookmark:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, contentId, contentType]);

  const addToBookmark = useCallback(async (
    bookmarkData: Omit<ContentBookmark, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!userId) return null;
    try {
      setLoading(true);
      const newBookmark = await addBookmark(userId, bookmarkData);
      setBookmark(newBookmark);
      return newBookmark;
    } catch (error) {
      console.error("Error adding bookmark:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateBookmark = useCallback(async (updates: Partial<ContentBookmark>) => {
    if (!bookmark) return null;
    try {
      // Optimistic update
      const optimistic = { ...bookmark, ...updates };
      setBookmark(optimistic);

      const updated = await updateBookmarkService(bookmark.id, updates);
      setBookmark(updated);
      return updated;
    } catch (error) {
      console.error("Error updating bookmark:", error);
      // Revert on error
      setBookmark(bookmark);
      return null;
    }
  }, [bookmark]);

  const removeBookmark = useCallback(async () => {
    if (!bookmark) return false;
    try {
      const prev = bookmark;
      setBookmark(null); // Optimistic
      const success = await deleteBookmarkService(bookmark.id);
      if (!success) setBookmark(prev); // Revert
      return success;
    } catch (error) {
      console.error("Error removing bookmark:", error);
      return false;
    }
  }, [bookmark]);

  return {
    bookmark,
    loading,
    isBookmarked: !!bookmark,
    addToBookmark,
    updateBookmark,
    removeBookmark,
    checkBookmark,
  };
};
