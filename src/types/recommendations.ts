// Types for recommendations feature

export interface Recommendation {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  media?: RecommendationMedia[];
  replies_count?: number;
  likes_count?: number;
  is_liked_by_user?: boolean;
}

export interface RecommendationMedia {
  id: string;
  recommendation_id: string;
  media_type: 'image' | 'drawing';
  media_url: string;
  storage_path?: string;
  created_at: string;
}

export interface RecommendationReply {
  id: string;
  recommendation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface RecommendationLike {
  id: string;
  recommendation_id: string;
  user_id: string;
  created_at: string;
}

export interface CreateRecommendationRequest {
  title: string;
  content: string;
  media?: File[];
}
