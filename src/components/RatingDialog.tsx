import { useState } from "react";
import supabase from "@/utils/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Star } from "lucide-react";
import { toast } from "sonner";

const RatingDialog = ({
  open,
  onClose,
  movieId,
  currentRating,
  onRated,
}: {
  open: boolean;
  onClose: () => void;
  movieId: number;
  currentRating?: number;
  onRated: () => void;
}) => {
  const [rating, setRating] = useState(currentRating || 5.0);

  const handleRate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_movies')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          rating,
          status: 'completed',
        });

      if (error) throw error;
      toast.success('Rating saved!');
      onRated();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate this movie</DialogTitle>
          <DialogDescription>
            Give it a rating from 1.0 to 10.0
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
              <span className="text-4xl font-bold">{rating.toFixed(1)}</span>
            </div>
            <Slider
              value={[rating]}
              onValueChange={(values) => setRating(values[0])}
              min={1.0}
              max={10.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>1.0</span>
              <span>10.0</span>
            </div>
          </div>

          <Button onClick={handleRate} className="w-full">
            Save Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;