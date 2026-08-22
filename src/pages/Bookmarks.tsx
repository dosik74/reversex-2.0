import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import {
  getUserBookmarks,
  getBookmarksByStatus,
  getBookmarkStats,
  updateBookmark,
  deleteBookmark,
} from "@/services/bookmarkService";
import { ContentBookmark, ContentStatus, CONTENT_STATUS_CONFIG } from "@/types/anime";
import ContentCard from "@/components/ContentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  MoreVertical,
  ArrowUpDown,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";

interface BookmarkStats {
  favorite: number;
  watching: number;
  planned: number;
  watched: number;
  postponed: number;
  dropped: number;
}

const Bookmarks = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<ContentBookmark[]>([]);
  const [stats, setStats] = useState<BookmarkStats>({
    favorite: 0,
    watching: 0,
    planned: 0,
    watched: 0,
    postponed: 0,
    dropped: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentStatus>("favorite");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "rating" | "progress">("date");

  // Status tabs in order
  const statusTabs: ContentStatus[] = [
    "favorite",
    "watching",
    "planned",
    "watched",
    "postponed",
    "dropped",
  ];

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadBookmarks();
      loadStats();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      loadBookmarks();
    }
  }, [activeTab]);

  const getCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    } catch (error) {
      console.error("Error getting user:", error);
      navigate("/auth");
    }
  };

  const loadBookmarks = async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const data = await getBookmarksByStatus(currentUserId, activeTab);
      setBookmarks(data);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!currentUserId) return;
    try {
      const statsData = await getBookmarkStats(currentUserId);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleUpdateBookmark = async (updated: ContentBookmark) => {
    try {
      await updateBookmark(updated.id, updated);
      setBookmarks((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );
      toast.success("Bookmark updated");
      loadStats();
    } catch (error) {
      console.error("Error updating bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      const success = await deleteBookmark(id);
      if (success) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
        toast.success("Bookmark deleted");
        loadStats();
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      toast.error("Failed to delete bookmark");
    }
  };

  const handleToggleFavorite = async (id: string, isFav: boolean) => {
    const bookmark = bookmarks.find((b) => b.id === id);
    if (bookmark) {
      await handleUpdateBookmark({ ...bookmark, isFavorite: isFav });
    }
  };

  // Filter and sort bookmarks
  const filteredBookmarks = bookmarks
    .filter((b) =>
      searchQuery ? b.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.userRating || 0) - (a.userRating || 0);
        case "progress":
          return (
            ((b.progress || 0) / (b.totalItems || 1)) -
            ((a.progress || 0) / (a.totalItems || 1))
          );
        case "date":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  const statusConfig = CONTENT_STATUS_CONFIG[activeTab];
  const emptyStateMessages = {
    favorite: "Нет избранного контента",
    watching: "Вы пока ничего не смотрите",
    planned: "Нет спланированного контента",
    watched: "Вы еще не просмотрели ничего",
    postponed: "Нет отложенного контента",
    dropped: "Вы ничего не бросили",
  };

  if (!currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <Card className="p-8 text-center max-w-md">
          <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Please sign in</h2>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to view your bookmarks
          </p>
          <Button onClick={() => navigate("/auth")} className="w-full">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Bookmark className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">My Bookmarks</h1>
              <p className="text-sm text-muted-foreground">
                {bookmarks.length} items in {activeTab}
              </p>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search bookmarks..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                const sorts: Array<"date" | "rating" | "progress"> = [
                  "date",
                  "rating",
                  "progress",
                ];
                setSortBy(sorts[(sorts.indexOf(sortBy) + 1) % sorts.length]);
              }}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">
                {sortBy === "date" ? "Date" : sortBy === "rating" ? "Rating" : "Progress"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="border-b border-border bg-background/50">
        <div className="container mx-auto px-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ContentStatus)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto gap-1 bg-transparent p-0">
              {statusTabs.map((status) => {
                const config = CONTENT_STATUS_CONFIG[status];
                const count = stats[status];
                return (
                  <TabsTrigger
                    key={status}
                    value={status}
                    className={`flex flex-col items-center gap-1 py-3 px-2 sm:px-4 rounded-t-lg border-b-2 transition-all data-[state=active]:border-primary ${
                      activeTab === status ? config.bgColor : "border-transparent"
                    }`}
                  >
                    <span className="text-xl">{config.icon}</span>
                    <span className="text-xs sm:text-sm font-medium">
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <Card className={`p-12 text-center ${statusConfig.bgColor}`}>
            <div className="text-4xl mb-4">{statusConfig.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{emptyStateMessages[activeTab]}</h3>
            <p className="text-muted-foreground">
              Add new {activeTab} items to see them here
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBookmarks.map((bookmark) => (
              <ContentCard
                key={bookmark.id}
                bookmark={bookmark}
                onUpdate={handleUpdateBookmark}
                onDelete={handleDeleteBookmark}
                onFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
