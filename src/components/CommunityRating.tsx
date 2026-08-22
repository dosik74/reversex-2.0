import { useState, useEffect } from 'react';
import { Star, Users, User, X } from 'lucide-react';
import { ContentType } from '@/types/anime';
import { getCommunityRating, submitCommunityRating, CommunityRatingData } from '@/services/communityRatingService';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

interface CommunityRatingProps {
    contentId: string;
    contentType: ContentType;
}

export default function CommunityRating({ contentId, contentType }: CommunityRatingProps) {
    const [userId, setUserId] = useState<string | null>(null);
    const [data, setData] = useState<CommunityRatingData>({ averageRating: 0, totalVotes: 0, userRating: null });
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);
    const [showPersonalInput, setShowPersonalInput] = useState(false);
    const [personalRating, setPersonalRating] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const { data: userData } = await supabase.auth.getUser();
            setUserId(userData.user?.id || null);
        };
        getUser();
    }, []);

    useEffect(() => {
        loadRating();
    }, [contentId, contentType, userId]);

    const loadRating = async () => {
        const result = await getCommunityRating(String(contentId), contentType, userId || undefined);
        setData(result);
    };

    const handleVote = async (rating: number) => {
        if (!userId) {
            toast.error('Войдите чтобы оценить');
            return;
        }
        setLoading(true);
        // Optimistic update
        const oldData = { ...data };
        const wasVoted = data.userRating !== null;
        const newTotal = wasVoted ? data.totalVotes : data.totalVotes + 1;
        const newSum = (data.averageRating * data.totalVotes) - (data.userRating || 0) + rating;
        setData({
            averageRating: newSum / newTotal,
            totalVotes: newTotal,
            userRating: rating,
        });

        const success = await submitCommunityRating(userId, String(contentId), contentType, rating);
        if (success) {
            toast.success(`Оценка ${rating}/10 сохранена`);
            // Reload to get accurate average
            await loadRating();
        } else {
            setData(oldData);
            toast.error('Ошибка при сохранении');
        }
        setLoading(false);
    };

    const handlePersonalSave = () => {
        const val = parseFloat(personalRating);
        if (isNaN(val) || val < 0 || val > 10) {
            toast.error('Рейтинг от 0 до 10');
            return;
        }
        // Personal rating is saved to bookmarks via the bookmark system
        setShowPersonalInput(false);
        toast.info(`Личный рейтинг ${val} — сохраните через закладки`);
    };

    const ratingColor = (rating: number) => {
        if (rating >= 8) return 'text-emerald-400';
        if (rating >= 6) return 'text-amber-400';
        if (rating >= 4) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-4">
            {/* Community Rating Display */}
            <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Рейтинг сообщества</h3>
                </div>

                {/* Big Rating Number */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                        <span className={`text-4xl font-black ${data.totalVotes > 0 ? ratingColor(data.averageRating) : 'text-zinc-600'}`}>
                            {data.totalVotes > 0 ? data.averageRating.toFixed(1) : '—'}
                        </span>
                        <span className="text-lg text-zinc-500 font-medium">/10</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                        <p>{data.totalVotes} {data.totalVotes === 1 ? 'голос' : data.totalVotes < 5 ? 'голоса' : 'голосов'}</p>
                        {data.userRating && (
                            <p className="text-purple-400 mt-1">Ваш голос: {data.userRating}/10</p>
                        )}
                    </div>
                </div>

                {/* Star Voting Row (1-10 integers) */}
                <div>
                    <p className="text-xs text-zinc-500 mb-2">
                        {data.userRating ? 'Изменить оценку:' : 'Оцените:'}
                    </p>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                            const isActive = hoveredStar !== null ? n <= hoveredStar : (data.userRating !== null && n <= data.userRating);
                            return (
                                <button
                                    key={n}
                                    disabled={loading}
                                    onMouseEnter={() => setHoveredStar(n)}
                                    onMouseLeave={() => setHoveredStar(null)}
                                    onClick={() => handleVote(n)}
                                    className={`relative w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${isActive
                                            ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 scale-110'
                                            : 'bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                                        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                                    title={`${n}/10`}
                                >
                                    {n}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
