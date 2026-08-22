import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";

interface FriendshipRow {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const FriendsList = ({ userId }: { userId: string }) => {
  const [friends, setFriends] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
    const channel = supabase
      .channel(`friends_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        () => fetchFriends()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchFriends = async () => {
    try {
      const { data: relations, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) throw error;

      const friendIds = (relations || []).map((r: FriendshipRow) =>
        r.user_id === userId ? r.friend_id : r.user_id
      );

      if (friendIds.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', friendIds);

      if (pErr) throw pErr;

      setFriends(profiles || []);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return <p className="text-muted-foreground">Нет друзей</p>;
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {friends.map((f) => (
          <Card key={f.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <Link to={`/profile/${f.id}`} className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={f.avatar_url || undefined} />
                  <AvatarFallback>{f.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{f.display_name || f.username}</div>
                  <div className="text-sm text-muted-foreground">@{f.username}</div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default FriendsList;
