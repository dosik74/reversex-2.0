// src/components/FriendsSystem.tsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/utils/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Check, X, MessageSquare, Search, UserPlus, Share2 } from "lucide-react";

interface ProfileMini {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface FriendshipRow {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  user?: ProfileMini;
  friend?: ProfileMini;
}

interface FriendsSystemProps {
  userId: string;
  currentUserId: string | null;
  onMessage?: (friendId: string) => void;
}

const FriendsSystem = ({ userId, currentUserId, onMessage }: FriendsSystemProps) => {
  const [friends, setFriends] = useState<ProfileMini[]>([]);
  const [incoming, setIncoming] = useState<FriendshipRow[]>([]);
  const [outgoing, setOutgoing] = useState<FriendshipRow[]>([]);
  const [searchResults, setSearchResults] = useState<ProfileMini[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const { data: acceptedData, error: acceptedErr } = await supabase
        .from("friendships")
        .select("id,user_id,friend_id,status,created_at")
        .eq("status", "accepted")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (acceptedErr) throw acceptedErr;

      // Get friend IDs
      const friendIds = (acceptedData || []).map((row: any) => {
        return row.user_id === userId ? row.friend_id : row.user_id;
      });

      if (friendIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url")
          .in("id", friendIds);

        setFriends(profilesData || []);
      } else {
        setFriends([]);
      }

      // incoming
      const { data: incomingData, error: incomingErr } = await supabase
        .from("friendships")
        .select("id,user_id,friend_id,status,created_at")
        .eq("status", "pending")
        .eq("friend_id", userId);

      if (incomingErr) throw incomingErr;

      const incomingIds = (incomingData || []).map((r: any) => r.user_id);
      if (incomingIds.length > 0) {
        const { data: incomingProfiles } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url")
          .in("id", incomingIds);

        const mappedIncoming = (incomingData || []).map((row: any) => ({
          ...row,
          user: (incomingProfiles || []).find((p: any) => p.id === row.user_id),
        }));
        setIncoming(mappedIncoming);
      } else {
        setIncoming([]);
      }

      // outgoing
      const { data: outgoingData, error: outgoingErr } = await supabase
        .from("friendships")
        .select("id,user_id,friend_id,status,created_at")
        .eq("status", "pending")
        .eq("user_id", userId);

      if (outgoingErr) throw outgoingErr;

      const outgoingIds = (outgoingData || []).map((r: any) => r.friend_id);
      if (outgoingIds.length > 0) {
        const { data: outgoingProfiles } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url")
          .in("id", outgoingIds);

        const mappedOutgoing = (outgoingData || []).map((row: any) => ({
          ...row,
          friend: (outgoingProfiles || []).find((p: any) => p.id === row.friend_id),
        }));
        setOutgoing(mappedOutgoing);
      } else {
        setOutgoing([]);
      }
    } catch (err) {
      console.error("FriendsSystem fetch error:", err);
      toast.error("Ошибка загрузки друзей");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFriends();

    if (!userId) return;
    const channel = supabase
      .channel(`friends_system_profile_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        (payload) => {
          const row: any = (payload as any).new || (payload as any).old;
          if (!row) return;
          if (row.user_id === userId || row.friend_id === userId) {
            fetchFriends();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchFriends]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentUserId) return;
    setSearching(true);
    try {
      // Проверяем, является ли запрос UUID (ID пользователя)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchQuery);
      
      let data, error;
      
      if (isUUID) {
        // Если это UUID, ищем по ID
        const result = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url")
          .eq("id", searchQuery)
          .neq("id", currentUserId)
          .limit(1);
        data = result.data;
        error = result.error;
      } else {
        // Иначе ищем по username
        const result = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url")
          .ilike("username", `%${searchQuery}%`)
          .neq("id", currentUserId)
          .limit(10);
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      setSearchResults(data || []);
      if ((data || []).length === 0) {
        toast("Пользователи не найдены");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ошибка поиска");
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!currentUserId) return toast.error("Нужно войти в аккаунт");
    try {
      const { data: existing } = await supabase
        .from("friendships")
        .select("id,status")
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`)
        .maybeSingle();

      if (existing) {
        toast("Запрос уже отправлен или вы уже друзья");
        return;
      }

      const { error } = await supabase.from("friendships").insert({
        user_id: currentUserId,
        friend_id: friendId,
        status: "pending",
      });

      if (error) throw error;
      toast.success("Запрос отправлен");
      fetchFriends();
    } catch (err) {
      console.error(err);
      toast.error("Ошибка отправки запроса");
    }
  };

  const handleAccept = async (id: string) => {
    if (!currentUserId) return toast.error("Нужно войти в аккаунт");
    try {
      const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
      if (error) throw error;
      toast.success("Запрос принят");
      fetchFriends();
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при принятии запроса");
    }
  };

  const handleReject = async (id: string) => {
    if (!currentUserId) return toast.error("Нужно войти в аккаунт");
    try {
      const { error } = await supabase.from("friendships").delete().eq("id", id);
      if (error) throw error;
      toast.success("Запрос отклонен");
      fetchFriends();
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при отклонении запроса");
    }
  };

  const handleCancel = async (id: string) => {
    if (!currentUserId) return toast.error("Нужно войти в аккаунт");
    try {
      const { error } = await supabase.from("friendships").delete().eq("id", id);
      if (error) throw error;
      toast.success("Запрос отменен");
      fetchFriends();
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при отмене запроса");
    }
  };

  const handleCopyProfileLink = (userId: string, username: string) => {
    const link = `${window.location.origin}/profile/${userId}`;
    navigator.clipboard.writeText(link);
    toast.success(`Ссылка на профиль @${username} скопирована!`);
  };

  const renderFriendRow = (friend: ProfileMini) => (
    <div
      key={friend.id}
      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
    >
      <Link to={`/profile/${friend.id}`} className="flex items-center gap-3 flex-1">
        <Avatar className="w-12 h-12">
          <AvatarImage src={friend.avatar_url || undefined} />
          <AvatarFallback>{(friend.username?.[0] ?? "U").toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium hover:underline cursor-pointer">{friend.display_name || friend.username}</p>
          <p className="text-xs text-muted-foreground">@{friend.username}</p>
        </div>
      </Link>

      <div className="flex gap-2">
        {currentUserId && (
          <>
            <Button size="sm" variant="outline" onClick={() => onMessage?.(friend.id)}>
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleCopyProfileLink(friend.id, friend.username)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const renderIncomingRow = (row: FriendshipRow) => {
    const other = row.user ?? null;
    if (!other) return null;
    return (
      <div
        key={row.id}
        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <Link to={`/profile/${other.id}`} className="flex items-center gap-3 flex-1">
          <Avatar className="w-12 h-12">
            <AvatarImage src={other.avatar_url || undefined} />
            <AvatarFallback>{(other.username?.[0] ?? "U").toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium hover:underline cursor-pointer">{other.display_name || other.username}</p>
            <p className="text-xs text-muted-foreground">@{other.username}</p>
          </div>
        </Link>

        <div className="flex gap-2">
          {currentUserId === userId && (
            <>
              <Button size="sm" onClick={() => handleAccept(row.id)}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleReject(row.id)}>
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderOutgoingRow = (row: FriendshipRow) => {
    const other = row.friend ?? null;
    if (!other) return null;
    return (
      <div
        key={row.id}
        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <Link to={`/profile/${other.id}`} className="flex items-center gap-3 flex-1">
          <Avatar className="w-12 h-12">
            <AvatarImage src={other.avatar_url || undefined} />
            <AvatarFallback>{(other.username?.[0] ?? "U").toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium hover:underline cursor-pointer">{other.display_name || other.username}</p>
            <p className="text-xs text-muted-foreground">@{other.username}</p>
          </div>
        </Link>

        <div className="flex gap-2">
          {currentUserId === userId && (
            <Button size="sm" variant="outline" onClick={() => handleCancel(row.id)}>
              <X className="w-4 h-4 mr-1" />
              Отменить
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="card-glow">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  const showRequests = currentUserId === userId;

  return (
    <div className="space-y-6">
      {/* Кнопка поделиться своим профилем */}
      {currentUserId === userId && (
        <Card className="card-glow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">🔗 Ваша ссылка профиля</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Поделитесь ссылкой, чтобы другие могли вас найти
                </p>
              </div>
              <Button onClick={() => {
                const link = `${window.location.origin}/profile/${userId}`;
                navigator.clipboard.writeText(link);
                toast.success("Ссылка скопирована!");
              }}>
                <Share2 className="w-4 h-4 mr-2" />
                Скопировать ссылку
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentUserId === userId && (
        <Card className="card-glow">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">🔍 Поиск друзей</h3>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Введите username или ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
                  >
                    <Link to={`/profile/${user.id}`} className="flex items-center gap-3 flex-1">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{(user.username?.[0] ?? "U").toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.display_name || user.username}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </Link>
                    <Button size="sm" onClick={() => handleAddFriend(user.id)}>
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">Друзья ({friends.length})</TabsTrigger>
          {showRequests && (
            <>
              <TabsTrigger value="incoming">Входящие ({incoming.length})</TabsTrigger>
              <TabsTrigger value="outgoing">Исходящие ({outgoing.length})</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="friends" className="mt-6 space-y-3">
          {friends.length === 0 ? (
            <Card className="card-glow">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Нет друзей</p>
              </CardContent>
            </Card>
          ) : (
            friends.map((f) => renderFriendRow(f))
          )}
        </TabsContent>

        {showRequests && (
          <>
            <TabsContent value="incoming" className="mt-6 space-y-3">
              {incoming.length === 0 ? (
                <Card className="card-glow">
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">Нет входящих запросов</p>
                  </CardContent>
                </Card>
              ) : (
                incoming.map((r) => renderIncomingRow(r))
              )}
            </TabsContent>

            <TabsContent value="outgoing" className="mt-6 space-y-3">
              {outgoing.length === 0 ? (
                <Card className="card-glow">
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">Нет исходящих запросов</p>
                  </CardContent>
                </Card>
              ) : (
                outgoing.map((r) => renderOutgoingRow(r))
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export { FriendsSystem };
export default FriendsSystem;