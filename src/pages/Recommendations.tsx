import { useEffect, useState } from 'react';
import { Recommendation, RecommendationReply } from '@/types/recommendations';
import {
  getRecommendations,
  getRecommendationReplies,
  addReplyToRecommendation,
  deleteRecommendation,
  deleteReply,
} from '@/services/recommendationService';
import { RecommendationCreate } from '@/components/RecommendationCreate';
import { RecommendationCard } from '@/components/RecommendationCard';
import {
  RecommendationReplyList,
  RecommendationReplyInput,
} from '@/components/RecommendationReply';
import { Button } from '@/components/ui/button';
import supabase from '@/lib/supabase';
import { Loader2, ChevronDown } from 'lucide-react';
import './Recommendations.css';

const PAGE_SIZE = 10;

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, RecommendationReply[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      console.log('Getting current user...');
      const { data } = await supabase.auth.getUser();
      console.log('Current user ID:', data.user?.id);
      console.log('Current user email:', data.user?.email);
      setCurrentUserId(data.user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Load recommendations
  useEffect(() => {
    loadRecommendations();
  }, [currentPage]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const result = await getRecommendations(currentPage, PAGE_SIZE);
      setRecommendations(result.data);
      setTotalItems(result.total);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setCurrentPage(1);
    loadRecommendations();
  };

  const handleExpandRecommendation = async (recommendationId: string) => {
    if (expandedRecommendation === recommendationId) {
      setExpandedRecommendation(null);
    } else {
      setExpandedRecommendation(recommendationId);
      
      // Load replies if not already loaded
      if (!replies[recommendationId]) {
        try {
          setLoadingReplies(prev => ({ ...prev, [recommendationId]: true }));
          const loadedReplies = await getRecommendationReplies(recommendationId);
          setReplies(prev => ({ ...prev, [recommendationId]: loadedReplies }));
        } catch (error) {
          console.error('Error loading replies:', error);
        } finally {
          setLoadingReplies(prev => ({ ...prev, [recommendationId]: false }));
        }
      }
    }
  };

  const handleAddReply = async (recommendationId: string, content: string) => {
    try {
      const newReply = await addReplyToRecommendation(recommendationId, content);
      setReplies(prev => ({
        ...prev,
        [recommendationId]: [...(prev[recommendationId] || []), newReply],
      }));
      
      // Update replies count
      setRecommendations(prev =>
        prev.map(rec =>
          rec.id === recommendationId
            ? { ...rec, replies_count: (rec.replies_count || 0) + 1 }
            : rec
        )
      );
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleDeleteRecommendation = async (recommendationId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту рекомендацию?')) {
      try {
        await deleteRecommendation(recommendationId);
        setRecommendations(prev =>
          prev.filter(rec => rec.id !== recommendationId)
        );
      } catch (error) {
        console.error('Error deleting recommendation:', error);
      }
    }
  };

  const handleDeleteReply = async (recommendationId: string, replyId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот ответ?')) {
      try {
        await deleteReply(replyId);
        setReplies(prev => ({
          ...prev,
          [recommendationId]: prev[recommendationId].filter(r => r.id !== replyId),
        }));
        
        // Update replies count
        setRecommendations(prev =>
          prev.map(rec =>
            rec.id === recommendationId
              ? { ...rec, replies_count: Math.max(0, (rec.replies_count || 0) - 1) }
              : rec
          )
        );
      } catch (error) {
        console.error('Error deleting reply:', error);
      }
    }
  };

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <div className="recommendations-container">
      <div className="recommendations-header">
        <div className="header-content">
          <h1 className="page-title">Рекомендации</h1>
          <p className="page-description">
            Делитесь своими рекомендациями о любимых фильмах, сериалах и развлечениях
          </p>
        </div>

        <button
          className="btn-create-recommendation"
          onClick={() => {
            console.log('Create recommendation button clicked');
            setShowCreateForm(!showCreateForm);
          }}
        >
          {showCreateForm ? 'Отмена' : '+ Новая рекомендация'}
        </button>
      </div>

      {showCreateForm && (
        <RecommendationCreate onSuccess={handleCreateSuccess} onCancel={() => setShowCreateForm(false)} />
      )}

      <div className="recommendations-feed">
        {loading && currentPage === 1 ? (
          <div className="loading-container">
            <Loader2 className="spinner" />
            <p>Загрузка рекомендаций...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="empty-state">
            <p>Пока нет рекомендаций</p>
            <button
              className="btn-create-first"
              onClick={() => setShowCreateForm(true)}
            >
              Создайте первую рекомендацию
            </button>
          </div>
        ) : (
          <>
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="recommendation-wrapper">
                <RecommendationCard
                  recommendation={recommendation}
                  onReply={() => handleExpandRecommendation(recommendation.id)}
                  onDelete={() => handleDeleteRecommendation(recommendation.id)}
                  currentUserId={currentUserId || undefined}
                />

                {expandedRecommendation === recommendation.id && (
                  <div className="expanded-replies">
                    {loadingReplies[recommendation.id] ? (
                      <div className="loading-replies">
                        <Loader2 className="spinner" size={20} />
                        <span>Загрузка ответов...</span>
                      </div>
                    ) : (
                      <>
                        {replies[recommendation.id] && replies[recommendation.id].length > 0 && (
                          <RecommendationReplyList
                            replies={replies[recommendation.id]}
                            onDeleteReply={(replyId) =>
                              handleDeleteReply(recommendation.id, replyId)
                            }
                            currentUserId={currentUserId || undefined}
                          />
                        )}

                        <RecommendationReplyInput
                          onSubmit={(content) =>
                            handleAddReply(recommendation.id, content)
                          }
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ← Назад
                </button>

                <span className="pagination-info">
                  Страница {currentPage} из {totalPages}
                </span>

                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Далее →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
