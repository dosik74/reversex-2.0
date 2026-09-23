import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import supabase from "@/utils/supabase";
import { useTheme } from "@/context/ThemeContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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
  Languages,
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
  const { t } = useTranslation();
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
    } else if (currentUserId === null) {
      // Гостя сюда не пускает Settings.tsx, но на всякий случай не висим на спиннере
      setLoading(false);
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
      toast.error(t("settings.notAuth"));
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

      toast.success(t("settings.savedOk"));
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(t("settings.savedErr"));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      setSaving(true);
      await supabase.auth.signOut();
      toast.success(t("settings.logoutOk"));
      setTimeout(() => navigate("/auth"), 500);
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error(t("settings.logoutErr"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(t("settings.delConfirm"));
    if (!confirmed) return;

    if (!currentUserId) {
      toast.error(t("settings.notAuth"));
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

      toast.success(t("settings.delOk"));
      setTimeout(() => navigate("/auth"), 500);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(t("settings.delErr"));
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
          {t("settings.appSettings")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">
              <Bell className="w-4 h-4 mr-1" />
              {t("settings.tabNotifications")}
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs sm:text-sm">
              <Lock className="w-4 h-4 mr-1" />
              {t("settings.tabPrivacy")}
            </TabsTrigger>
            <TabsTrigger value="display" className="text-xs sm:text-sm">
              <Eye className="w-4 h-4 mr-1" />
              {t("settings.tabDisplay")}
            </TabsTrigger>
            <TabsTrigger value="account" className="text-xs sm:text-sm">
              <Shield className="w-4 h-4 mr-1" />
              {t("settings.tabAccount")}
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <SettingToggle
                icon={<Mail className="w-4 h-4" />}
                title={t("settings.emailN")}
                description={t("settings.emailD")}
                checked={settings.notifications.email}
                onChange={() => toggleSetting("notifications", "email")}
              />

              <SettingToggle
                icon={<Smartphone className="w-4 h-4" />}
                title={t("settings.pushN")}
                description={t("settings.pushD")}
                checked={settings.notifications.push}
                onChange={() => toggleSetting("notifications", "push")}
              />

              <SettingToggle
                icon={<Bell className="w-4 h-4" />}
                title={t("settings.msgN")}
                description={t("settings.msgD")}
                checked={settings.notifications.messages}
                onChange={() => toggleSetting("notifications", "messages")}
              />

              <SettingToggle
                icon={<Bell className="w-4 h-4" />}
                title={t("settings.frN")}
                description={t("settings.frD")}
                checked={settings.notifications.friendRequests}
                onChange={() => toggleSetting("notifications", "friendRequests")}
              />

              <SettingToggle
                icon={<Bell className="w-4 h-4" />}
                title={t("settings.comN")}
                description={t("settings.comD")}
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
                title={t("settings.pubN")}
                description={t("settings.pubD")}
                checked={settings.privacy.profilePublic}
                onChange={() => toggleSetting("privacy", "profilePublic")}
              />

              <SettingToggle
                icon={<Activity className="w-4 h-4" />}
                title={t("settings.friendsN")}
                description={t("settings.friendsD")}
                checked={settings.privacy.showFriendsList}
                onChange={() => toggleSetting("privacy", "showFriendsList")}
              />

              <SettingToggle
                icon={<Activity className="w-4 h-4" />}
                title={t("settings.actN")}
                description={t("settings.actD")}
                checked={settings.privacy.showActivity}
                onChange={() => toggleSetting("privacy", "showActivity")}
              />

              <SettingToggle
                icon={<Mail className="w-4 h-4" />}
                title={t("settings.dmN")}
                description={t("settings.dmD")}
                checked={settings.privacy.allowMessages}
                onChange={() => toggleSetting("privacy", "allowMessages")}
              />
            </div>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display" className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              {/* Язык: локальная настройка, работает и без входа, хранится в localStorage */}
              <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-muted-foreground">
                    <Languages className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t("settings.language")}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("settings.languageD")}
                    </div>
                  </div>
                </div>
                <LanguageSwitcher />
              </div>
              {/* Theme Toggle with real effect */}
              <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-muted-foreground">
                    {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t("settings.theme")}</div>
                    <div className="text-xs text-muted-foreground">
                      {isDark ? t("settings.darkOn") : t("settings.lightOn")}
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
                title={t("settings.soundN")}
                description={t("settings.soundD")}
                checked={settings.display.soundEnabled}
                onChange={() => toggleSetting("display", "soundEnabled")}
              />

              <SettingToggle
                icon={<Eye className="w-4 h-4" />}
                title={t("settings.animN")}
                description={t("settings.animD")}
                checked={settings.display.animationsEnabled}
                onChange={() => toggleSetting("display", "animationsEnabled")}
              />

              <SettingToggle
                icon={<Eye className="w-4 h-4" />}
                title={t("settings.compactN")}
                description={t("settings.compactD")}
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
                {t("settings.signOut")}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <Lock className="w-4 h-4 mr-2" />
                {t("settings.changePass")} ({t("settings.soon")})
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <Shield className="w-4 h-4 mr-2" />
                {t("settings.tfa")} ({t("settings.soon")})
              </Button>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-sm mb-3 text-red-500">
                  {t("settings.danger")}
                </h4>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleDeleteAccount}
                  disabled={saving}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("settings.delAcc")}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("settings.delWarn")}
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
            {saving ? t("settings.saving") : t("settings.save")}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg text-sm">
          <p className="text-muted-foreground">
            💡 {t("settings.syncNote")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPanel;
