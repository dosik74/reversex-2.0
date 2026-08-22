import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "@/utils/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  Save,
  Sparkles,
  User,
  FileText,
  Image,
} from "lucide-react";

interface ProfileData {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  primary_color: string;
  accent_color: string;
  card_style: string;
  font_style: string;
}

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Color and customization state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [primaryColor, setPrimaryColor] = useState("from-blue-500");
  const [accentColor, setAccentColor] = useState("from-cyan-400");
  const [cardStyle, setCardStyle] = useState("minimal");
  const [fontStyle, setFontStyle] = useState("sans");

  const primaryColors = [
    "from-blue-500",
    "from-purple-500",
    "from-pink-500",
    "from-red-500",
    "from-orange-500",
    "from-green-500",
    "from-cyan-400",
    "from-indigo-500",
  ];

  const accentColors = [
    "from-cyan-400",
    "from-lime-400",
    "from-pink-400",
    "from-yellow-300",
    "from-purple-400",
    "from-blue-300",
    "from-emerald-400",
    "from-rose-300",
  ];

  const cardStyles = [
    { value: "minimal", label: "Minimal" },
    { value: "outlined", label: "Outlined" },
    { value: "elevated", label: "Elevated" },
    { value: "gradient", label: "Gradient" },
  ];

  const fontStyles = [
    { value: "sans", label: "Default" },
    { value: "serif", label: "Elegant" },
    { value: "mono", label: "Monospace" },
    { value: "playful", label: "Playful" },
  ];

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadProfile();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    } catch (error) {
      console.error("Error getting user:", error);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUserId)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        setPrimaryColor(data.primary_color || "from-blue-500");
        setAccentColor(data.accent_color || "from-cyan-400");
        setCardStyle(data.card_style || "minimal");
        setFontStyle(data.font_style || "sans");
        setAvatarPreview(data.avatar_url);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
      return null;
    }
  };

  const saveProfile = async () => {
    if (!currentUserId) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setSaving(true);

      let avatarUrl = profile?.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        const newAvatarUrl = await uploadAvatar(currentUserId);
        if (newAvatarUrl) {
          avatarUrl = newAvatarUrl;
        }
      }

      // Update profile
      const { error } = await supabase.from("profiles").update({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        primary_color: primaryColor,
        accent_color: accentColor,
        card_style: cardStyle,
        font_style: fontStyle,
        updated_at: new Date().toISOString(),
      }).eq("id", currentUserId);

      if (error) throw error;

      toast.success("✅ Profile updated successfully!");
      setTimeout(() => navigate(`/profile/${currentUserId}`), 500);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold">Profile not found</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back Button */}
        <button
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-md hover:bg-secondary transition-colors"
          onClick={() => navigate(`/profile/${currentUserId}`)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2 w-full">
                <label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-primary rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload Avatar</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-muted-foreground text-center">
                  JPG, PNG or GIF (max 5MB)
                </p>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                {displayName.length}/30 characters
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bio
              </label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/200 characters
              </p>
            </div>

            {/* Color Customization */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Customization
              </h3>

              {/* Primary Color */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {primaryColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setPrimaryColor(color)}
                      className={`h-10 rounded-lg bg-gradient-to-br ${color} transition-all ${
                        primaryColor === color
                          ? "ring-2 ring-primary ring-offset-2"
                          : "hover:scale-105"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Accent Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {accentColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={`h-10 rounded-lg bg-gradient-to-br ${color} transition-all ${
                        accentColor === color
                          ? "ring-2 ring-primary ring-offset-2"
                          : "hover:scale-105"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Card Style */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Card Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {cardStyles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setCardStyle(style.value)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        cardStyle === style.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Style */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Font Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {fontStyles.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => setFontStyle(font.value)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        fontStyle === font.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => navigate(`/profile/${currentUserId}`)}
                disabled={saving}
                className="px-4 py-2 border border-border rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileEdit;
