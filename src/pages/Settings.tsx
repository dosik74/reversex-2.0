import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import supabase from "@/utils/supabase";
import SettingsPanel from "@/components/SettingsPanel";
import DataSettings from "@/components/DataSettings";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings as SettingsIcon, MonitorSmartphone, Cloud, Moon, Sun, Languages } from "lucide-react";

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    } catch (e) {
      console.error("Error getting user:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">{t("settings.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">{t("settings.title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("settings.subtitle")}</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Локальные настройки: работают ВСЕГДА — и для гостя, и для вошедшего.
              Хранятся в localStorage, применяются мгновенно. */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MonitorSmartphone className="w-5 h-5 text-primary" />
                {t("settings.localSettings")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t("settings.localDesc")}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Languages className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">{t("settings.language")}</div>
                    <div className="text-xs text-muted-foreground">{t("settings.languageD")}</div>
                  </div>
                </div>
                <LanguageSwitcher />
              </div>

              <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-3">
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
                  onClick={toggleTheme}
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
            </CardContent>
          </Card>

          {currentUserId ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cloud className="w-4 h-4" />
                {t("settings.cloudDesc")}
              </div>
              <SettingsPanel />
              <DataSettings />
            </>
          ) : (
            <Card className="w-full">
              <CardContent className="pt-6">
                <div className="text-center space-y-4 py-4">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
                  <h2 className="text-xl font-bold">{t("settings.notAuthTitle")}</h2>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    {t("settings.guestNote")}
                  </p>
                  <Button onClick={() => navigate("/auth")}>
                    {t("settings.goToLogin")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
