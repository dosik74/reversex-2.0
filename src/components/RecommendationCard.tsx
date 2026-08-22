import { useState } from 'react';
import { Recommendation } from '@/types/recommendations';
import { likeRecommendation, unlikeRecommendation } from '@/services/recommendationService';
import { Heart, MessageCircle, Share2, MoreVertical } from 'lucide-react';
import './RecommendationCard.css';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onReply?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  currentUserId?: string;
}

export function RecommendationCard({
  recommendation,
  onReply,
  onDelete,
  onEdit,
  currentUserId,
}: RecommendationCardProps) {
  const [liked, setLiked] = useState(recommendation.is_liked_by_user || false);
  const [likesCount, setLikesCount] = useState(recommendation.likes_count || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Debug logging for media
  if (recommendation.media && recommendation.media.length > 0) {
    console.log('📸 RecommendationCard media found:');
    console.log('  ID:', recommendation.id);
    console.log('  Media count:', recommendation.media.length);
    recommendation.media.forEach((m, idx) => {
      console.log(`  Media[${idx}]:`, {
        id: m.id,
        type: m.media_type,
        url: m.media_url,
        path: m.storage_path,
      });
    });
  } else {
    console.log('⚠️ RecommendationCard NO media for:', recommendation.id);
    console.log('  Media array:', recommendation.media);
  }

  const handleLike = async () => {
    try {
      setLikeLoading(true);
      if (liked) {
        await unlikeRecommendation(recommendation.id);
        setLiked(false);
        setLikesCount(Math.max(0, likesCount - 1));
      } else {
        await likeRecommendation(recommendation.id);
        setLiked(true);
        setLikesCount(likesCount + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const isOwner = currentUserId === recommendation.user_id;
  const createdDate = new Date(recommendation.created_at).toLocaleDateString('ru-RU');

  return (
    <div className="recommendation-card">
      <div className="card-header">
        <div className="author-info">
          <div className="author-avatar">
            {recommendation.author?.user_metadata?.avatar_url ? (
              <img 
                src={recommendation.author.user_metadata.avatar_url} 
                alt={recommendation.author?.user_metadata?.full_name || 'User'}
              />
            ) : (
              <div className="avatar-placeholder">
                {recommendation.author?.user_metadata?.full_name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="author-details">
            <h3 className="author-name">
              {recommendation.author?.user_metadata?.full_name || recommendation.author?.email || 'Anonymous'}
            </h3>
            <span className="created-date">{createdDate}</span>
          </div>
        </div>

        {isOwner && (
          <div className="card-menu">
            <button
              className="menu-button"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                <button onClick={() => { onEdit?.(); setShowMenu(false); }}>
                  Редактировать
                </button>
                <button onClick={() => { onDelete?.(); setShowMenu(false); }} className="delete">
                  Удалить
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card-content">
        <h2 className="recommendation-title">{recommendation.title}</h2>
        <p className="recommendation-text">{recommendation.content}</p>

        {recommendation.media && recommendation.media.length > 0 && (
          <div className="media-gallery">
            {recommendation.media.map((media) => (
              <div key={media.id} className="media-item">
                <img 
                  src={media.media_url} 
                  alt={`Media ${media.id}`}
                  className="media-image"
                />
                <span className="media-badge">
                  {media.media_type === 'drawing' ? '✏️ Рисунок' : '🖼️ Фото'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="stats">
          <span className="stat-item">
            {likesCount} <span className="stat-label">Нравится</span>
          </span>
          <span className="stat-item">
            {recommendation.replies_count || 0} <span className="stat-label">Ответов</span>
          </span>
        </div>

        <div className="actions">
          <button
            className={`action-button ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={likeLoading}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>Нравится</span>
          </button>
          <button className="action-button" onClick={onReply}>
            <MessageCircle size={18} />
            <span>Ответить</span>
          </button>
          <button className="action-button">
            <Share2 size={18} />
            <span>Поделиться</span>
          </button>
        </div>
      </div>
    </div>
  );
}
