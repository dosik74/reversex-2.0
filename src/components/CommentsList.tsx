import { useState, useEffect } from "react";
import supabase from "@/utils/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

const CommentsList = ({ movieId }: { movieId: number }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [movieId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          movie_id: movieId,
          content: newComment,
        });

      if (error) throw error;
      setNewComment("");
      toast.success('Comment posted!');
      fetchComments();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button type="submit" disabled={submitting || !newComment.trim()}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>

        <div className="space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-full" />
                </div>
              </div>
            ))
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar>
                  <AvatarImage src={comment.profiles.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.profiles.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {comment.profiles.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommentsList;