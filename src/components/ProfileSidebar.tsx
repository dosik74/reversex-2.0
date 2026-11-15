import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import supabase from "@/utils/supabase";
import { Users, TrendingUp, Crown, Star, Bookmark, ArrowRight } from "lucide-react";
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
      // ВАЖНО: у top_lists нет колонки rating — вместо неё считаем
      // количество позиций через вложенный select (top_list_items(count))
      const { data: topLists, error: listsError } = await supabase
        .from('top_lists')
        .select('id, title, media_type, top_list_items(count)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (listsError) {
        console.error('Error fetching top lists:', listsError);
        setTopRated([]);
      } else {
        setTopRated(
          (topLists || []).map((list: any) => ({
            ...list,
            items_count: list.top_list_items?.[0]?.count ?? 0,
          }))
        );
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
    <div className="space-y-4">
      {/* ===== LEVEL COMPACT CARD (Компактный аккуратный вид вместо огромного квадрата) ===== */}
      <div className="rxp-panel p-3.5">
        <div className="flex items-center gap-3">
          {/* Мини-кольцо уровня 42x42 */}
          <div className="relative w-11 h-11 flex-shrink-0">
            <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="4"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="url(#xpGradientSidebar)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(xpProgress / 100) * 113.1} 113.1`}
                style={{
                  filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.7))',
                  transition: 'stroke-dasharray 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
              <defs>
                <linearGradient id="xpGradientSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-grotesk font-bold text-xs text-foreground">
              {userLevel}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-grotesk font-semibold text-xs flex items-center gap-1.5 text-foreground">
                <Crown className="w-3.5 h-3.5 text-primary" /> Уровень
              </span>
              <span className="rxp-lv-chip !text-[7px] !py-0.5 !px-1.5">LV.{userLevel}</span>
            </div>
            <div className="rxp-xp-track w-full h-1.5 rounded-full overflow-hidden mb-1 bg-muted/40">
              <div
                className="rxp-xp-fill h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(4, xpProgress))}%` }}
              />
            </div>
            <div className="flex items-center justify-between font-pixel text-[7px] text-muted-foreground tracking-wider">
              <span>{userXP % 500}/500 XP</span>
              <span>-{500 - (userXP % 500)} NEXT</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TOP FRIENDS ===== */}
      <div className="rxp-panel p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="p-1 rounded-lg bg-primary/10 text-primary">
            <Users className="w-3.5 h-3.5" />
          </span>
          <h3 className="font-grotesk font-semibold text-xs flex-1 text-foreground">Друзья</h3>
          <span className="font-pixel text-[8px] text-primary">
            {topFriends.length}
          </span>
        </div>

        <ScrollArea className="max-h-48 pr-2">
          <div className="space-y-1.5">
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="rxp-spinner scale-[0.45]" />
              </div>
            ) : topFriends.length === 0 ? (
              <p className="font-script text-sm text-muted-foreground text-center py-4 opacity-70">
                Друзей пока нет...
              </p>
            ) : (
              topFriends.map((friend, index) => {
                const medal = index < 3 ? MEDALS[index] : null;
                return (
                  <Link key={friend.id} to={friend.username ? `/${friend.username}` : `/profile/${friend.id}`} className="group block">
                    <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all">
                      <div className="relative flex-shrink-0">
                        <span
                          className="block p-[2px] rounded-full transition-transform group-hover:scale-105"
                          style={{
                            background: medal ? medal.ring : 'transparent',
                            boxShadow: medal ? `0 0 10px ${medal.glow}` : 'none',
                          }}
                        >
                          <Avatar className="avatar-wrap w-8 h-8">
                            <AvatarImage src={friend.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/40 to-accent/40 text-xs font-grotesk">
                              {friend.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </span>
                        {medal && (
                          <span
                            className="absolute -top-1 -right-1 w-4 h-4 min-w-[16px] min-h-[16px] rounded-full flex items-center justify-center font-pixel text-[6px] text-black shadow-md"
                            style={{ backgroundColor: medal.ring }}
                          >
                            {medal.label}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors font-grotesk">
                          {friend.display_name || friend.username}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-pixel mt-0.5">
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

      {/* ===== ПЕРЕХОДНИК В ЗАКЛАДКИ ПОЛЬЗОВАТЕЛЯ ===== */}
      <Link
        to={`/bookmarks/${userId}`}
        className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent hover:from-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group shadow-sm"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Bookmark className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300 truncate">Закладки пользователя</p>
            <p className="text-[10px] text-zinc-500 truncate">Все фильмы, сериалы, игры</p>
          </div>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
      </Link>

      {/* ===== TOP LISTS (Без тяжелого квадрата — просто чистые списки) ===== */}
      <div className="pt-1 space-y-2">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp className="w-3.5 h-3.5 text-accent" />
          <h3 className="font-grotesk font-semibold text-xs text-foreground flex-1">Топ списки</h3>
          {topRated.length > 0 && (
            <span className="font-pixel text-[8px] text-muted-foreground">
              {topRated.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="rxp-spinner scale-[0.45]" />
          </div>
        ) : topRated.length === 0 ? (
          <p className="font-script text-sm text-muted-foreground py-2 px-1 opacity-70">
            Списков пока нет...
          </p>
        ) : (
          <div className="space-y-1.5">
            {topRated.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] border border-border/40 hover:border-primary/40 transition-all cursor-pointer group"
              >
                <span className="rxp-rank-num flex-shrink-0 text-xs text-primary/80">
                  #{index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate group-hover:text-primary transition-colors font-grotesk">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className="w-3 h-3 text-accent fill-accent" />
                    <span className="font-pixel text-[7px] text-muted-foreground">
                      {item.items_count ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSidebar;
