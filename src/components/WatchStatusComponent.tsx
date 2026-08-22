import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import supabase from "@/utils/supabase";
import { Check, Clock, Eye } from "lucide-react";

type WatchStatus = "watched" | "watching" | "want_to_watch" | null;

interface WatchStatusComponentProps {
  movieId: string | number;
  movieTitle: string;
  onStatusChange?: (status: WatchStatus) => void;
}

const WatchStatusComponent = ({
  movieId,
  movieTitle,
  onStatusChange,
}: WatchStatusComponentProps) => {
  const [watchStatus, setWatchStatus] = useState<WatchStatus>(null);
  const [loading, setLoading] = useState(true);
  const [watchedDate, setWatchedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchWatchStatus();
  }, [movieId]);

  const fetchWatchStatus = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Здесь должен быть запрос к таблице user_movies
      // Пока оставляем null
      setWatchStatus(null);
    } catch (error) {
      console.error("Error fetching watch status:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateWatchStatus = async (status: WatchStatus) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      setWatchStatus(status);
      if (status === "watched") {
        setWatchedDate(new Date().toLocaleDateString());
      }

      toast.success(
        status === "watched"
          ? `Marked "${movieTitle}" as watched`
          : status === "watching"
          ? `Currently watching "${movieTitle}"`
          : `Added "${movieTitle}" to your watchlist`
      );

      onStatusChange?.(status);
    } catch (error) {
      console.error("Error updating watch status:", error);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const removeFromTracking = async () => {
    try {
      setWatchStatus(null);
      setWatchedDate(null);
      toast.success("Removed from tracking");
      onStatusChange?.(null);
    } catch (error) {
      console.error("Error removing from tracking:", error);
      toast.error("Failed to remove");
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Watch Status</h3>

      {watchStatus ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {watchStatus === "watched" && (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Watched
                </>
              )}
              {watchStatus === "watching" && (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Currently Watching
                </>
              )}
              {watchStatus === "want_to_watch" && (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Want to Watch
                </>
              )}
            </Badge>
            {watchedDate && (
              <span className="text-xs text-muted-foreground">
                on {watchedDate}
              </span>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {watchStatus !== "watched" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateWatchStatus("watched")}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Watched
              </Button>
            )}
            {watchStatus !== "watching" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateWatchStatus("watching")}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                Watching
              </Button>
            )}
            {watchStatus !== "want_to_watch" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateWatchStatus("want_to_watch")}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                Watchlist
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={removeFromTracking}
              disabled={loading}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Track your viewing status
          </p>
          <div className="flex gap-2 flex-col">
            <Button
              size="sm"
              onClick={() => updateWatchStatus("watched")}
              disabled={loading}
              className="flex items-center gap-2 justify-center"
            >
              <Check className="w-4 h-4" />
              Mark as Watched
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateWatchStatus("watching")}
              disabled={loading}
              className="flex items-center gap-2 justify-center"
            >
              <Eye className="w-4 h-4" />
              Currently Watching
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateWatchStatus("want_to_watch")}
              disabled={loading}
              className="flex items-center gap-2 justify-center"
            >
              <Clock className="w-4 h-4" />
              Add to Watchlist
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default WatchStatusComponent;
