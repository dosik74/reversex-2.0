import { useState } from 'react';
import { RecommendationReply } from '@/types/recommendations';
import { Trash2 } from 'lucide-react';
import './RecommendationReply.css';

interface RecommendationReplyItemProps {
  reply: RecommendationReply;
  onDelete?: () => void;
  currentUserId?: string;
}

export function RecommendationReplyItem({
  reply,
  onDelete,
  currentUserId,
}: RecommendationReplyItemProps) {
  const isOwner = currentUserId === reply.user_id;
  const createdDate = new Date(reply.created_at).toLocaleDateString('ru-RU');

  return (
    <div className="reply-item">
      <div className="reply-header">
        <div className="reply-author">
          <div className="reply-avatar">
            {reply.author?.user_metadata?.avatar_url ? (
              <img 
                src={reply.author.user_metadata.avatar_url} 
                alt={reply.author?.user_metadata?.full_name || 'User'}
              />
            ) : (
              <div className="avatar-placeholder">
                {reply.author?.user_metadata?.full_name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div>
            <h4 className="reply-author-name">
              {reply.author?.user_metadata?.full_name || reply.author?.email || 'Anonymous'}
            </h4>
            <span className="reply-date">{createdDate}</span>
          </div>
        </div>

        {isOwner && (
          <button
            className="reply-delete-button"
            onClick={onDelete}
            title="Удалить ответ"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <p className="reply-content">{reply.content}</p>
    </div>
  );
}

interface RecommendationReplyListProps {
  replies: RecommendationReply[];
  onDeleteReply?: (replyId: string) => void;
  currentUserId?: string;
}

export function RecommendationReplyList({
  replies,
  onDeleteReply,
  currentUserId,
}: RecommendationReplyListProps) {
  return (
    <div className="reply-list">
      {replies.map((reply) => (
        <RecommendationReplyItem
          key={reply.id}
          reply={reply}
          onDelete={() => onDeleteReply?.(reply.id)}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}

interface ReplyInputProps {
  onSubmit: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function RecommendationReplyInput({ onSubmit, disabled }: ReplyInputProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    try {
      setLoading(true);
      await onSubmit(content);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="reply-input-form">
      <div className="reply-input-wrapper">
        <input
          type="text"
          placeholder="Напишите ответ..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading || disabled}
          className="reply-input"
        />
        <button
          type="submit"
          disabled={loading || disabled || !content.trim()}
          className="reply-submit-button"
        >
          {loading ? '...' : 'Отправить'}
        </button>
      </div>
    </form>
  );
}
