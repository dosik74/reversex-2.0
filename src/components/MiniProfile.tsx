import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import supabase from "@/utils/supabase";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus, UserCheck, Sparkles } from "lucide-react";

interface MiniProfileProps {
  userId: string;
  children: React.ReactNode;
  currentUserId?: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  profile_color: string;
  profile_accent: string;
  status: string;
  level: number;
  bio: string | null;
}

const MiniProfile = ({ userId, children, currentUserId }: MiniProfileProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data);

      if (currentUserId && currentUserId !== userId) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    if (isOpen && !profile) {
      fetchProfile();
    }
  }, [isOpen]);

  const handleFollow = async () => {
    if (!currentUserId) return;
    setLoading(true);

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);
      } else {
        await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: userId,
        });
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'dnd':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Онлайн';
      case 'idle':
        return 'Неактивен';
      case 'dnd':
        return 'Не беспокоить';
      default:
        return 'Оффлайн';
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {children}
      </div>

      {isOpen && profile && (
        <Card
          className="absolute top-full left-0 mt-2 w-80 p-4 z-50 card-glow"
          style={{
            borderColor: profile.profile_color + '40',
            backgroundColor: '#0f0f0f',
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {profile.profile_color && (
            <div
              className="absolute inset-0 top-0 h-24 rounded-t-lg opacity-10"
              style={{
                background: `linear-gradient(135deg, ${profile.profile_color}, ${profile.profile_accent})`,
              }}
            />
          )}

          <div className="relative space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-start flex-1">
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2" style={{ borderColor: profile.profile_color }}>
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(profile.status)}`}
                  />
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-sm">
                    {profile.display_name || profile.username}
                  </h3>
                  <p className="text-xs text-muted-foreground">@{profile.username}</p>
                  <p className="text-xs" style={{ color: profile.profile_color }}>
                    {getStatusText(profile.status)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 px-2 py-1 rounded bg-primary/20">
                <Sparkles className="w-3 h-3" />
                <span className="text-xs font-bold">{profile.level}</span>
              </div>
            </div>

            {profile.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2">{profile.bio}</p>
            )}

            {currentUserId && currentUserId !== userId && (
              <Button
                onClick={handleFollow}
                size="sm"
                className="w-full"
                variant={isFollowing ? "outline" : "default"}
                disabled={loading}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3 h-3 mr-1" />
                    Подписано
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3 mr-1" />
                    Подписаться
                  </>
                )}
              </Button>
            )}

            <Link to={`/profile/${userId}`}>
              <Button size="sm" variant="outline" className="w-full text-xs">
                Открыть профиль
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MiniProfile;