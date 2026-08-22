import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import supabase from "@/utils/supabase";
import { Users, UserPlus, UserX, Search } from "lucide-react";
import { Link } from "react-router-dom";

interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: number;
}

interface FriendsListComponentProps {
  userId: string;
  isOwnProfile: boolean;
}

const FriendsListComponent = ({
  userId,
  isOwnProfile,
}: FriendsListComponentProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserId();
    fetchFriends();
  }, [userId]);

  const getCurrentUserId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  };

  const fetchFriends = async () => {
    try {
      setLoading(true);
      
      // Здесь должен быть запрос к таблице friendships
      // Пока показываем демо данные
      const demoFriends: Friend[] = [
        {
          id: "1",
          username: "friend1",
          display_name: "Friend One",
          avatar_url: null,
          bio: "Movie enthusiast",
          level: 5,
        },
        {
          id: "2",
          username: "friend2",
          display_name: "Friend Two",
          avatar_url: null,
          bio: "Series lover",
          level: 3,
        },
      ];

      setFriends(demoFriends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      // Здесь должна быть логика удаления друга из базы
      setFriends(friends.filter(f => f.id !== friendId));
      toast.success("Friend removed");
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold">Friends ({friends.length})</h3>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <p className="text-muted-foreground">Loading friends...</p>
        </div>
      ) : filteredFriends.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">
            {friends.length === 0
              ? "No friends yet"
              : "No friends match your search"}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFriends.map((friend) => (
            <Card key={friend.id} className="p-4 hover:bg-muted/50 transition-colors">
              <Link to={`/profile/${friend.id}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={friend.avatar_url || undefined} />
                    <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {friend.display_name || friend.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Level {friend.level}
                    </p>
                  </div>
                </div>
              </Link>
              {friend.bio && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {friend.bio}
                </p>
              )}
              {isOwnProfile && currentUserId === userId && (
                <Button
                  onClick={() => removeFriend(friend.id)}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  <UserX className="w-3 h-3 mr-2" />
                  Remove Friend
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsListComponent;
