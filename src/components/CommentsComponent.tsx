import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import supabase from "@/utils/supabase";
import { Heart, MessageCircle, Trash2, Send } from "lucide-react";
import { Link } from "react-router-dom";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  likes: number;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  liked_by_user?: boolean;
}

interface CommentsComponentProps {
  targetId: string;
  targetType: "movie" | "series" | "profile" | "list";
  onCommentAdded?: () => void;
}

const CommentsComponent = ({
  targetId,
  targetType,
  onCommentAdded,
}: CommentsComponentProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
    fetchComments();
  }, [targetId, targetType]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // Здесь должен быть запрос к таблице comments
      // Пока показываем демо комментарии
      const demoComments: Comment[] = [
        {
          id: "1",
          content: "Great movie! Really enjoyed it.",
          created_at: new Date().toISOString(),
          likes: 5,
          author: {
            id: "user1",
            username: "user123",
            display_name: "User 123",
            avatar_url: null,
          },
          liked_by_user: false,
        },
      ];

      setComments(demoComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    if (!currentUserId) {
      toast.error("You must be logged in to comment");
      return;
    }

    try {
      setSubmitting(true);

      // Здесь должна быть логика добавления комментария в базу
      const newCommentObj: Comment = {
        id: Math.random().toString(),
        content: newComment,
        created_at: new Date().toISOString(),
        likes: 0,
        author: {
          id: currentUserId,
          username: "You",
          display_name: "Your Name",
          avatar_url: null,
        },
        liked_by_user: false,
      };

      setComments([newCommentObj, ...comments]);
      setNewComment("");
      toast.success("Comment posted!");
      onCommentAdded?.();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const likeComment = async (commentId: string) => {
    try {
      if (!currentUserId) {
        toast.error("You must be logged in to like comments");
        return;
      }

      setComments(
        comments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                likes: c.liked_by_user ? c.likes - 1 : c.likes + 1,
                liked_by_user: !c.liked_by_user,
              }
            : c
        )
      );
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error("Failed to update like");
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      setComments(comments.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Comments ({comments.length})
      </h3>

      {/* New Comment Form */}
      {currentUserId ? (
        <Card className="p-4">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-20 resize-none mb-3"
            disabled={submitting}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-4 text-center">
          <p className="text-muted-foreground mb-3">
            Sign in to post a comment
          </p>
          <Link to="/auth">
            <Button size="sm">Sign In</Button>
          </Link>
        </Card>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <p className="text-muted-foreground">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={comment.author.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.author.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/profile/${comment.author.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {comment.author.display_name || comment.author.username}
                    </Link>
                    {currentUserId === comment.author.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => deleteComment(comment.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>

                  <p className="text-sm break-words">{comment.content}</p>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 text-xs h-6"
                    onClick={() => likeComment(comment.id)}
                  >
                    <Heart
                      className={`w-3 h-3 mr-1 ${
                        comment.liked_by_user
                          ? "fill-red-500 text-red-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    {comment.likes > 0 && comment.likes}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsComponent;
