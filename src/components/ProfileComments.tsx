import { useState, useEffect } from "react";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface ProfileCommentsProps {
  profileId: string;
  currentUserId?: string;
  isOwnProfile?: boolean;
}

interface Author {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: Author;
}

const ProfileComments = ({ profileId, currentUserId, isOwnProfile }: ProfileCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`profile_comments_${profileId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profile_comments', filter: `profile_id=eq.${profileId}` },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_comments')
        .select(`
          id,
          content,
          created_at,
          author_id,
          author:profiles(username, display_name, avatar_url)
        `)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('profile_comments').insert({
        profile_id: profileId,
        author_id: currentUserId,
        content: newComment.trim(),
      });

      if (error) throw error;
      setNewComment('');
      toast.success('Комментарий добавлен');
      fetchComments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка добавления комментария');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('profile_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      toast.success('Комментарий удален');
      fetchComments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ошибка удаления комментария');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className="card-glow">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Загрузка комментариев...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle>💬 Комментарии</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentUserId && (
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Напиши комментарий..."
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {newComment.length}/500
              </span>
              <Button type="submit" disabled={submitting || !newComment.trim()} size="sm">
                <Send className="w-4 h-4 mr-2" />
                Отправить
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Комментариев еще нет. Будь первым! 👋
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <Link to={`/profile/${comment.author_id}`}>
                  <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 ring-primary">
                    <AvatarImage src={comment.author?.avatar_url || undefined} />
                    <AvatarFallback>
                      {comment.author?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${comment.author_id}`}>
                    <p className="font-medium hover:underline cursor-pointer">
                      {comment.author?.display_name || comment.author?.username || 'Unknown'}
                    </p>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-2">
                    {formatDate(comment.created_at)}
                  </p>
                  <p className="text-sm break-words whitespace-pre-wrap">{comment.content}</p>
                </div>

                {(isOwnProfile || currentUserId === comment.author_id) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileComments;