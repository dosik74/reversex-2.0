import supabase from '@/lib/supabase';
import { ContentType } from '@/types/anime';

export interface CommunityRatingData {
    averageRating: number;
    totalVotes: number;
    userRating: number | null;
}

/**
 * Get community rating for content (average + total + user's vote)
 */
export const getCommunityRating = async (
    contentId: string,
    contentType: ContentType,
    userId?: string
): Promise<CommunityRatingData> => {
    try {
        // Get all ratings for this content
        const { data, error } = await supabase
            .from('community_ratings')
            .select('rating, user_id')
            .eq('content_id', String(contentId))
            .eq('content_type', contentType);

        if (error) {
            console.error('Error fetching community ratings:', error);
            return { averageRating: 0, totalVotes: 0, userRating: null };
        }

        const ratings = data || [];
        const totalVotes = ratings.length;
        const sum = ratings.reduce((acc: number, r: any) => acc + r.rating, 0);
        const averageRating = totalVotes > 0 ? sum / totalVotes : 0;

        // Find current user's rating
        let userRating: number | null = null;
        if (userId) {
            const userVote = ratings.find((r: any) => r.user_id === userId);
            userRating = userVote ? userVote.rating : null;
        }

        return { averageRating, totalVotes, userRating };
    } catch (error) {
        console.error('Error in getCommunityRating:', error);
        return { averageRating: 0, totalVotes: 0, userRating: null };
    }
};

/**
 * Submit or update community rating (1-10 integer)
 */
export const submitCommunityRating = async (
    userId: string,
    contentId: string,
    contentType: ContentType,
    rating: number
): Promise<boolean> => {
    try {
        // Clamp to 1-10 integer
        const safeRating = Math.min(10, Math.max(1, Math.round(rating)));

        const { error } = await supabase
            .from('community_ratings')
            .upsert(
                {
                    user_id: userId,
                    content_id: String(contentId),
                    content_type: contentType,
                    rating: safeRating,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,content_id,content_type' }
            );

        if (error) {
            console.error('Error submitting rating:', error);
            // Fallback: try delete + insert
            await supabase
                .from('community_ratings')
                .delete()
                .eq('user_id', userId)
                .eq('content_id', String(contentId))
                .eq('content_type', contentType);

            const { error: insertError } = await supabase
                .from('community_ratings')
                .insert({
                    user_id: userId,
                    content_id: String(contentId),
                    content_type: contentType,
                    rating: safeRating,
                });

            if (insertError) {
                console.error('Error inserting rating (fallback):', insertError);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error in submitCommunityRating:', error);
        return false;
    }
};

/**
 * Remove user's community rating
 */
export const removeCommunityRating = async (
    userId: string,
    contentId: string,
    contentType: ContentType
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('community_ratings')
            .delete()
            .eq('user_id', userId)
            .eq('content_id', String(contentId))
            .eq('content_type', contentType);

        if (error) {
            console.error('Error removing rating:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error in removeCommunityRating:', error);
        return false;
    }
};
