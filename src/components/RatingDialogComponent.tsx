import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import supabase from "@/utils/supabase";
import { Star, MessageCircle } from "lucide-react";

interface RatingData {
  rating: number;
  review: string;
}

interface RatingDialogComponentProps {
  movieId: string | number;
  movieTitle: string;
  onRated?: (rating: number, review: string) => void;
}

const RatingDialogComponent = ({
  movieId,
  movieTitle,
  onRated,
}: RatingDialogComponentProps) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState<RatingData | null>(null);

  useEffect(() => {
    if (open) {
      fetchUserRating();
    }
  }, [open, movieId]);

  const fetchUserRating = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Здесь должен быть запрос к таблице ratings
      // Пока оставляем пустым
      setUserRating(null);
      setRating(0);
      setReview("");
    } catch (error) {
      console.error("Error fetching rating:", error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to rate");
        return;
      }

      // Здесь должна быть логика сохранения рейтинга в базу
      toast.success(`Rated "${movieTitle}" ${rating}/10!`);
      
      if (onRated) {
        onRated(rating, review);
      }

      setOpen(false);
      setRating(0);
      setReview("");
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          Rate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate "{movieTitle}"</DialogTitle>
          <DialogDescription>
            {userRating
              ? `Your current rating: ${userRating.rating}/10`
              : "Share your opinion about this movie"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stars */}
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating display */}
          {rating > 0 && (
            <div className="text-center">
              <span className="text-4xl font-bold text-primary">{rating}</span>
              <span className="text-muted-foreground">/10</span>
            </div>
          )}

          {/* Review text */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4" />
              Write a review (optional)
            </label>
            <Textarea
              placeholder="What did you think about this movie?"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="min-h-24 resize-none"
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="flex-1"
            >
              {loading ? "Submitting..." : "Submit Rating"}
            </Button>
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialogComponent;
