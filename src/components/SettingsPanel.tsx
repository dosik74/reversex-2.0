import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/utils/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Lock,
  Eye,
  Volume2,
  Moon,
  Sun,
  Save,
  LogOut,
  Trash2,
  Shield,
  Mail,
  Smartphone,
  Activity,
} from "lucide-react";

interface AppSettings {
  notifications: {
    email: boolean;
    push: boolean;
    messages: boolean;
    friendRequests: boolean;
    comments: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showFriendsList: boolean;
    showActivity: boolean;
    allowMessages: boolean;
  };
  display: {
    darkMode: boolean;
    soundEnabled: boolean;
    animationsEnabled: boolean;
    compactMode: boolean;
  };
}

interface SettingToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

const SettingToggle = ({
  icon,
  title,
  description,
  checked,
  onChange,
}: SettingToggleProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

const SettingsPanel = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    notifications: {
      email: true,
      push: true,
      messages: true,
      friendRequests: true,
      comments: false,
    },
    privacy: {
      profilePublic: true,
      showFriendsList: true,
      showActivity: true,
      allowMessages: true,
    },
    display: {
      darkMode: isDark,
      soundEnabled: true,
      animationsEnabled: true,
      compactMode: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadSettings();
    }
  }, [currentUserId]);

  // Sync theme state with isDark value
  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      display: { ...prev.display, darkMode: isDark },
    }));
  }, [isDark]);

  const getCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    } catch (error) {
      console.error("Error getting user:", error);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", currentUserId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading settings:", error);
      }

      if (data) {
        const settingsData = JSON.parse(data.settings_data || "{}");
        setSettings({
          notifications: settingsData.notifications || settings.notifications,
          privacy: settingsData.privacy || settings.privacy,
          display: settingsData.display || settings.display,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!currentUserId) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: currentUserId,
          settings_data: JSON.stringify(settings),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;

      toast.success("✅ Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      setSaving(true);
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      setTimeout(() => navigate("/auth"), 500);
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to logout");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmed) return;

    if (!currentUserId) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setSaving(true);
      // Delete user data first
      await supabase.from("profiles").delete().eq("id", currentUserId);

      // Delete settings
      await supabase.from("user_settings").delete().eq("user_id", currentUserId);

      // Sign out
      await supabase.auth.signOut();

      toast.success("Account deleted successfully");
      setTimeout(() => navigate("/auth"), 500);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (category: keyof AppSettings, key: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key as never],
      },
    }));
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Application Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">
              <Bell className="w-4 h-4 mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs sm:text-sm">
              <Lock className="w-4 h-4 mr-1" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="display" className="text-xs sm:text-sm">
              <Eye className="w-4 h-4 mr-1" />
              Display
            </TabsTrigger>
            <TabsTrigger value="account" className="text-xs sm:text-sm">
              <Shield className="w-4 h-4 mr-1" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <SettingToggle
                icon={<Mail className="w-4 h-4" />}
                title="Email Notifications"
                description="Receive important updates via email"
                checked={settings.notifications.email}
                onChange={() => toggleSetting("notifications", "email")}
              />

              <SettingToggle
                icon={<Smartphone className="w-4 h-4" />}
                title="Push Notifications"
                description="Get instant notifications"
                checked={settings.notifications.push}
                onChange={() => toggleSetting("notifications", "push")}
              />

              <SettingToggle
                icon={<Bell className="w-4 h-4" />}
                title="Message Notifications"
                description="Alert when you receive messages"
                checked={settings.notifications.messages}
                onChange={() => toggleSetting("notifications", "messages")}
              />

              <SettingToggle
                icon={<Bell className="w-4 h-4" />}
                title="Friend Requests"
                description="Notify about new friend requests"
                checked={settings.notifications.friendRequests}
                onChange={() => toggleSetting("notifications", "friendRequests")}
              />

              <SettingToggle
                icon={<Bell className="w-4 h-4" />}
                title="Comments"
                description="Notify about new comments on your content"
                checked={settings.notifications.comments}
                onChange={() => toggleSetting("notifications", "comments")}
              />
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <SettingToggle
                icon={<Eye className="w-4 h-4" />}
                title="Public Profile"
                description="Let others find and view your profile"
                checked={settings.privacy.profilePublic}
                onChange={() => toggleSetting("privacy", "profilePublic")}
              />

              <SettingToggle
                icon={<Activity className="w-4 h-4" />}
                title="Show Friends List"
                description="Display your friends on your profile"
                checked={settings.privacy.showFriendsList}
                onChange={() => toggleSetting("privacy", "showFriendsList")}
              />

              <SettingToggle
                icon={<Activity className="w-4 h-4" />}
                title="Show Activity"
                description="Let others see your watching activity"
                checked={settings.privacy.showActivity}
                onChange={() => toggleSetting("privacy", "showActivity")}
              />

              <SettingToggle
                icon={<Mail className="w-4 h-4" />}
                title="Allow Messages"
                description="Receive direct messages from other users"
                checked={settings.privacy.allowMessages}
                onChange={() => toggleSetting("privacy", "allowMessages")}
              />
            </div>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display" className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              {/* Theme Toggle with real effect */}
              <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-muted-foreground">
                    {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">Theme</div>
                    <div className="text-xs text-muted-foreground">
                      {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    toggleTheme();
                    setSettings(prev => ({
                      ...prev,
                      display: { ...prev.display, darkMode: !isDark }
                    }));
                  }}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    isDark ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      isDark ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <SettingToggle
                icon={<Volume2 className="w-4 h-4" />}
                title="Sound Effects"
                description="Enable sound for interactions"
                checked={settings.display.soundEnabled}
                onChange={() => toggleSetting("display", "soundEnabled")}
              />

              <SettingToggle
                icon={<Eye className="w-4 h-4" />}
                title="Animations"
                description="Show smooth animations"
                checked={settings.display.animationsEnabled}
                onChange={() => toggleSetting("display", "animationsEnabled")}
              />

              <SettingToggle
                icon={<Eye className="w-4 h-4" />}
                title="Compact Mode"
                description="Use compact layout"
                checked={settings.display.compactMode}
                onChange={() => toggleSetting("display", "compactMode")}
              />
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleLogout}
                disabled={saving}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password (Coming Soon)
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <Shield className="w-4 h-4 mr-2" />
                Two-Factor Authentication (Coming Soon)
              </Button>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-sm mb-3 text-red-500">
                  Danger Zone
                </h4>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleDeleteAccount}
                  disabled={saving}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-border">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg text-sm">
          <p className="text-muted-foreground">
            💡 Your settings are automatically synced across all devices.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPanel;
