import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import supabase from "@/utils/supabase";
import SettingsPanel from "@/components/SettingsPanel";
import DataSettings from "@/components/DataSettings";
import { Users, Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  const { t } = useTranslation();
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

  if (!currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center space-y-4">
          <Users className="w-24 h-24 text-muted-foreground mx-auto opacity-50" />
          <h2 className="text-2xl font-bold">{t("settings.notAuthTitle")}</h2>
          <p className="text-muted-foreground">{t("settings.notAuthSub")}</p>
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
          <SettingsPanel />
          <DataSettings />
        </div>
      </div>
    </div>
  );
};

export default Settings;
