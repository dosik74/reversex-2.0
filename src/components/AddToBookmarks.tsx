import { useState } from "react";
import { Bookmark, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CONTENT_STATUS_CONFIG, ContentStatus, ContentType } from "@/types/anime";
import { toast } from "sonner";

interface AddToBookmarksProps {
  contentId: string;
  contentType: ContentType;
  title: string;
  posterUrl?: string;
  externalRating?: number;
  genre?: string;
  releaseYear?: string;
  onAdd: (status: ContentStatus) => Promise<void>;
  isBookmarked?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const AddToBookmarks = ({
  contentId,
  contentType,
  title,
  posterUrl,
  externalRating,
  genre,
  releaseYear,
  onAdd,
  isBookmarked = false,
  variant = "default",
  size = "default",
}: AddToBookmarksProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const statuses: ContentStatus[] = [
    "favorite",
    "watching",
    "planned",
    "watched",
    "postponed",
    "dropped",
  ];

  const handleAddToBookmark = async (status: ContentStatus) => {
    try {
      setIsLoading(true);
      await onAdd(status);
      toast.success(
        `Added to ${CONTENT_STATUS_CONFIG[status].label.toLowerCase()}`
      );
    } catch (error) {
      console.error("Error adding to bookmarks:", error);
      toast.error("Failed to add to bookmarks");
    } finally {
      setIsLoading(false);
    }
  };

  const contentTypeLabel = {
    anime: "аниме",
    movie: "фильма",
    series: "сериала",
    game: "игры",
  }[contentType];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="gap-2"
          disabled={isLoading}
        >
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isBookmarked ? "In Bookmarks" : "Add to Bookmarks"}
          </span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm">Add to {contentTypeLabel}</div>
          <div className="text-xs text-muted-foreground font-normal truncate">
            {title}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {statuses.map((status) => {
          const config = CONTENT_STATUS_CONFIG[status];
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleAddToBookmark(status)}
              disabled={isLoading}
              className="gap-2 cursor-pointer"
            >
              <span className="text-lg">{config.icon}</span>
              <div className="flex-1">
                <div className={`font-medium text-sm ${config.color}`}>
                  {config.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {status === "watching" && "Currently watching"}
                  {status === "planned" && "Planning to watch"}
                  {status === "watched" && "Already watched"}
                  {status === "favorite" && "Your favorite"}
                  {status === "postponed" && "On hold"}
                  {status === "dropped" && "Dropped"}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddToBookmarks;
