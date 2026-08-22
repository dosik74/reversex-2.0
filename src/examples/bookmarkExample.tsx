/**
 * Example integration of Bookmarks with Movie detail page
 * Copy this as a reference for integrating bookmarks into other content pages
 */

import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import AddToBookmarks from "@/components/AddToBookmarks";
import { useBookmark } from "@/hooks/useBookmark";
import { ContentStatus } from "@/types/anime";
import { addToBookmarks } from "@/services/bookmarkService";

interface MovieDetailBookmarkExampleProps {
  movieId: string;
  title: string;
  posterUrl?: string;
  rating?: number;
  genre?: string;
  releaseYear?: string;
}

export const MovieDetailBookmarkExample = ({
  movieId,
  title,
  posterUrl,
  rating,
  genre,
  releaseYear,
}: MovieDetailBookmarkExampleProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    } catch (error) {
      console.error("Error getting user:", error);
    }
  };

  const { bookmark, isBookmarked } = useBookmark({
    contentId: movieId,
    contentType: "movie",
    userId: currentUserId || undefined,
  });

  const handleAddToBookmark = async (status: ContentStatus) => {
    if (!currentUserId) return;

    await addToBookmarks(currentUserId, {
      contentType: "movie",
      contentId: movieId,
      title,
      posterUrl,
      status,
      externalRating: rating,
      genre,
      releaseYear,
      isFavorite: status === "favorite",
      userRating: 0,
      progress: 0,
      totalItems: 0,
      notes: "",
    });
  };

  return (
    <AddToBookmarks
      contentId={movieId}
      contentType="movie"
      title={title}
      posterUrl={posterUrl}
      externalRating={rating}
      genre={genre}
      releaseYear={releaseYear}
      onAdd={handleAddToBookmark}
      isBookmarked={isBookmarked}
      variant="default"
    />
  );
};

/**
 * To use in MovieDetail.tsx:
 * 
 * import { MovieDetailBookmarkExample } from "@/examples/bookmarkExample";
 * 
 * // In your component JSX:
 * <MovieDetailBookmarkExample
 *   movieId={movie.id.toString()}
 *   title={movie.title}
 *   posterUrl={movie.posterUrl}
 *   rating={movie.rating}
 *   genre={movie.genres?.join(", ")}
 *   releaseYear={movie.releaseYear}
 * />
 */
