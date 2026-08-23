import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import supabase from "@/utils/supabase";
import { Users, TrendingUp, Crown, Star } from "lucide-react";
import { Link } from "react-router-dom";
import "@/styles/profile-fonts.css";

interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
}

interface ProfileSidebarProps {
  userId: string;
  userLevel?: number;
  userXP?: number;
}

// Цвета медалей топ-3
const MEDALS = [
  { ring: "#FBBF24", glow: "rgba(251,191,36,0.5)", label: "1" },
  { ring: "#E2E8F0", glow: "rgba(226,232,240,0.4)", label: "2" },
  { ring: "#FB923C", glow: "rgba(251,146,60,0.5)", label: "3" },
];

const ProfileSidebar = ({ userId, userLevel = 1, userXP = 0 }: ProfileSidebarProps) => {
  const [topFriends, setTopFriends] = useState<Friend[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Загружаем друзей из базы данных (схема: requester_id / addressee_id)
      const { data: friendshipRows, error: friendshipError } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted')
        .limit(5);

      if (friendshipError) {
        console.error('Error fetching friendships:', friendshipError);
        setTopFriends([]);
      } else {
        const friendIds = (friendshipRows || []).map((r: any) =>
          r.requester_id === userId ? r.addressee_id : r.requester_id
        );

        let friends: Friend[] = [];
        if (friendIds.length) {
          const { data: friendsData } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, level')
            .in('id', friendIds);
          friends = (friendsData || []).map((f: any) => ({
            id: f.id,
            username: f.username || 'Unknown',
            display_name: f.display_name,
            avatar_url: f.avatar_url,
            level: f.level || 1,
          }));
        }
        setTopFriends(friends);
      }

      // Загружаем топ списки пользователя
      const { data: topLists, error: listsError } = await supabase
        .from('top_lists')
        .select('id, title, rating')
        .eq('user_id', userId)
        .order('rating', { ascending: false })
        .limit(5);

      if (listsError) {
        console.error('Error fetching top lists:', listsError);
        setTopRated([]);
      } else {
        setTopRated(topLists || []);
      }
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextLevelXP = (userLevel + 1) * 500;
  const xpProgress = ((userXP % 500) / 500) * 100;

  return (
    <div className="space-y-6">
      {/* ===== LEVEL CARD ===== */}
      <div className="rxp-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="rxp-section-title text-base">
            <Crown className="w-5 h-5 text-primary" />
            Уровень
          </h3>
          <span className="rxp-lv-chip">LV.{userLevel}</span>
        </div>

        {/* Кольцевой XP-индикатор */}
        <div className="relative w-36 h-36 mx-auto mb-4">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="9"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="url(#xpGradient)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${(xpProgress / 100) * 326.7} 326.7`}
              style={{
                filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.7))',
                transition: 'stroke-dasharray 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            <defs>
              <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="rxp-stat-value">{userLevel}</span>
            <span className="rxp-stat-label">Level</span>
          </div>
        </div>

        <div className="flex items-center justify-between font-pixel text-[8px] text-muted-foreground tracking-wider">
          <span>{userXP % 500} / 500 XP</span>
          <span>-{500 - (userXP % 500)} TO NEXT</span>
        </div>
      </div>

      {/* ===== TOP FRIENDS ===== */}
      <div className="rxp-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="rxp-chip !w-9 !h-9">
            <Users className="w-4 h-4" />
          </span>
          <h3 className="rxp-section-title text-sm flex-1">Друзья</h3>
          <span className="font-pixel text-[9px] text-primary">
            {topFriends.length}
          </span>
        </div>

        <ScrollArea className="h-64 pr-3">
          <div className="space-y-1.5">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="rxp-spinner scale-[0.45]" />
              </div>
            ) : topFriends.length === 0 ? (
              <p className="font-script text-lg text-muted-foreground text-center py-6 opacity-70">
                Друзей пока нет...
              </p>
            ) : (
              topFriends.map((friend, index) => {
                const medal = index < 3 ? MEDALS[index] : null;
                return (
                  <Link key={friend.id} to={`/profile/${friend.id}`} className="group block">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all">
                      <div className="relative flex-shrink-0">
                        <span
                          className="block p-[2px] rounded-full transition-transform group-hover:scale-105"
                          style={{
                            background: medal ? medal.ring : 'transparent',
                            boxShadow: medal ? `0 0 12px ${medal.glow}` : 'none',
                          }}
                        >
                          <Avatar className="avatar-wrap w-9 h-9">
                            <AvatarImage src={friend.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/40 to-accent/40 text-xs font-grotesk">
                              {friend.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </span>
                        {medal && (
                          <span
                            className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center font-pixel text-[7px] text-black shadow-md"
                            style={{ backgroundColor: medal.ring }}
                          >
                            {medal.label}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors font-grotesk">
                          {friend.display_name || friend.username}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-pixel mt-0.5">
                          LV.{friend.level}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ===== TOP LISTS ===== */}
      <div className="rxp-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="rxp-chip !w-9 !h-9">
            <TrendingUp className="w-4 h-4" />
          </span>
          <h3 className="rxp-section-title text-sm flex-1">Топ списки</h3>
        </div>

        <ScrollArea className="h-56 pr-3">
          <div className="space-y-1.5">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="rxp-spinner scale-[0.45]" />
              </div>
            ) : topRated.length === 0 ? (
              <p className="font-script text-lg text-muted-foreground text-center py-6 opacity-70">
                Списков пока нет...
              </p>
            ) : (
              topRated.map((item, index) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl hover:bg-accent/10 border border-transparent hover:border-accent/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <span className="rxp-rank-num flex-shrink-0 mt-0.5">
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-accent transition-colors font-grotesk">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-3 h-3 text-accent fill-accent" />
                        <span className="font-pixel text-[8px] text-muted-foreground">
                          {item.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ProfileSidebar;
