import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import ProfileCustomizationPanel from "@/components/ProfileCustomizationPanel";
import { Users, Sparkles } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
}

const Customize = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) {
        setCurrentUserId(data.user.id);
        fetchUserProfile(data.user.id);
      }
    } catch (e) {
      console.error("Error getting user:", e);
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, level, xp")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
    } catch (e) {
      console.error("Error fetching user profile:", e);
      // Demo profile
      setUserProfile({
        id: userId,
        username: "user",
        level: 5,
        xp: 1500
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading customization...</p>
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center space-y-4">
          <Users className="w-24 h-24 text-muted-foreground mx-auto opacity-50" />
          <h2 className="text-2xl font-bold">Not authenticated</h2>
          <p className="text-muted-foreground">Please sign in to customize your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Customize Your Profile</h1>
          </div>
          <p className="text-muted-foreground">Personalize your profile appearance with colors, styles, and more</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <ProfileCustomizationPanel 
            userId={currentUserId!}
            userLevel={userProfile?.level || 1}
          />
        </div>
      </div>
    </div>
  );
};

export default Customize;
