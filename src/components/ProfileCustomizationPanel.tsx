import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import supabase from "@/utils/supabase";
import { Sparkles, Palette, Wind, RotateCw } from "lucide-react";

interface ProfileCustomization {
  profileColor: string;
  profileAccent: string;
  backgroundColor: string;
  cardStyle: "minimal" | "outlined" | "elevated" | "gradient";
  fontStyle: "default" | "modern" | "elegant" | "playful";
  unlocked: boolean;
  minLevel: number;
}

interface ProfileCustomizationPanelProps {
  userId: string;
  userLevel: number;
  onUpdate?: () => void;
}

const AVAILABLE_COLORS = [
  { name: "Purple", value: "hsl(280, 100%, 70%)" },
  { name: "Pink", value: "hsl(330, 100%, 65%)" },
  { name: "Blue", value: "hsl(200, 100%, 60%)" },
  { name: "Green", value: "hsl(120, 100%, 60%)" },
  { name: "Orange", value: "hsl(40, 100%, 60%)" },
  { name: "Red", value: "hsl(0, 100%, 60%)" },
  { name: "Cyan", value: "hsl(180, 100%, 60%)" },
  { name: "Yellow", value: "hsl(60, 100%, 60%)" },
];

const CARD_STYLES = [
  { name: "Minimal", value: "minimal", description: "Clean and simple" },
  { name: "Outlined", value: "outlined", description: "With borders" },
  { name: "Elevated", value: "elevated", description: "Shadow effect" },
  { name: "Gradient", value: "gradient", description: "Beautiful gradient" },
];

const FONT_STYLES = [
  { name: "Default", value: "default", minLevel: 1 },
  { name: "Modern", value: "modern", minLevel: 5 },
  { name: "Elegant", value: "elegant", minLevel: 10 },
  { name: "Playful", value: "playful", minLevel: 15 },
];

const ProfileCustomizationPanel = ({
  userId,
  userLevel,
  onUpdate,
}: ProfileCustomizationPanelProps) => {
  const [customization, setCustomization] = useState<ProfileCustomization>({
    profileColor: "hsl(280, 100%, 70%)",
    profileAccent: "hsl(330, 100%, 65%)",
    backgroundColor: "hsl(0, 0%, 7%)",
    cardStyle: "elevated",
    fontStyle: "default",
    unlocked: false,
    minLevel: 1,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomization();
  }, [userId]);

  const fetchCustomization = async () => {
    try {
      // Здесь должен быть запрос к БД
      // Пока используем значения по умолчанию
      setCustomization({
        profileColor: "hsl(280, 100%, 70%)",
        profileAccent: "hsl(330, 100%, 65%)",
        backgroundColor: "hsl(0, 0%, 7%)",
        cardStyle: "elevated",
        fontStyle: "default",
        unlocked: userLevel >= 5,
        minLevel: 5,
      });
    } catch (error) {
      console.error("Error fetching customization:", error);
    }
  };

  const saveCustomization = async () => {
    try {
      setLoading(true);
      // Здесь должна быть логика сохранения в БД
      toast.success("Profile customization saved! 🎨");
      onUpdate?.();
    } catch (error) {
      console.error("Error saving customization:", error);
      toast.error("Failed to save customization");
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    setCustomization({
      profileColor: "hsl(280, 100%, 70%)",
      profileAccent: "hsl(330, 100%, 65%)",
      backgroundColor: "hsl(0, 0%, 7%)",
      cardStyle: "elevated",
      fontStyle: "default",
      unlocked: false,
      minLevel: 1,
    });
    toast.success("Reset to default theme");
  };

  const isColorLocked = (minLevel: number) => userLevel < minLevel;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Profile Customization
          {customization.unlocked && (
            <Badge className="ml-auto">Unlocked</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors" className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            {/* Primary Color */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4" />
                <h4 className="font-semibold">Primary Color</h4>
                <Badge variant="outline">{userLevel >= 5 ? "✅" : "🔒 Lvl 5"}</Badge>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      if (userLevel >= 5) {
                        setCustomization({
                          ...customization,
                          profileColor: color.value,
                        });
                      } else {
                        toast.error(`Unlock at level 5`);
                      }
                    }}
                    disabled={userLevel < 5}
                    className={`relative h-12 rounded-lg transition-all ${
                      customization.profileColor === color.value
                        ? "ring-2 ring-offset-2 ring-white"
                        : ""
                    } ${userLevel < 5 ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {customization.profileColor === color.value && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wind className="w-4 h-4" />
                <h4 className="font-semibold">Accent Color</h4>
                <Badge variant="outline">{userLevel >= 10 ? "✅" : "🔒 Lvl 10"}</Badge>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      if (userLevel >= 10) {
                        setCustomization({
                          ...customization,
                          profileAccent: color.value,
                        });
                      } else {
                        toast.error(`Unlock at level 10`);
                      }
                    }}
                    disabled={userLevel < 10}
                    className={`relative h-12 rounded-lg transition-all ${
                      customization.profileAccent === color.value
                        ? "ring-2 ring-offset-2 ring-white"
                        : ""
                    } ${userLevel < 10 ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {customization.profileAccent === color.value && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-6">
            {/* Card Style */}
            <div>
              <h4 className="font-semibold mb-3">Card Style</h4>
              <div className="grid grid-cols-2 gap-3">
                {CARD_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => {
                      if (userLevel >= 5) {
                        setCustomization({
                          ...customization,
                          cardStyle: style.value as any,
                        });
                      } else {
                        toast.error(`Unlock at level 5`);
                      }
                    }}
                    disabled={userLevel < 5}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      customization.cardStyle === style.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${userLevel < 5 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="font-semibold text-sm">{style.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {style.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Style */}
            <div>
              <h4 className="font-semibold mb-3">Font Style</h4>
              <div className="grid grid-cols-2 gap-3">
                {FONT_STYLES.map((font) => {
                  const isUnlocked = userLevel >= font.minLevel;
                  return (
                    <button
                      key={font.value}
                      onClick={() => {
                        if (isUnlocked) {
                          setCustomization({
                            ...customization,
                            fontStyle: font.value as any,
                          });
                        } else {
                          toast.error(`Unlock at level ${font.minLevel}`);
                        }
                      }}
                      disabled={!isUnlocked}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        customization.fontStyle === font.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      } ${!isUnlocked ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div
                        className={`font-semibold text-sm ${
                          font.value === "modern"
                            ? "font-sans"
                            : font.value === "elegant"
                            ? "font-serif"
                            : ""
                        }`}
                      >
                        {font.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {!isUnlocked && `Lvl ${font.minLevel}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <div className="space-y-4">
              <div
                className="p-6 rounded-lg border-2 border-border"
                style={{
                  backgroundColor: customization.backgroundColor,
                }}
              >
                <div
                  className="text-2xl font-bold mb-2"
                  style={{ color: customization.profileColor }}
                >
                  Preview Title
                </div>
                <div
                  className="text-sm mb-4"
                  style={{ color: customization.profileAccent }}
                >
                  Accent text preview
                </div>
                <p className="text-sm text-muted-foreground">
                  Your profile will look like this with selected customizations.
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs space-y-1 font-mono">
                  <div>Primary: {customization.profileColor}</div>
                  <div>Accent: {customization.profileAccent}</div>
                  <div>Card Style: {customization.cardStyle}</div>
                  <div>Font: {customization.fontStyle}</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Buttons */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-border">
          <Button
            onClick={saveCustomization}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Saving..." : "Save Customization"}
          </Button>
          <Button
            onClick={resetToDefault}
            variant="outline"
            className="flex-1 flex items-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-primary/10 rounded-lg text-sm">
          <p className="text-muted-foreground">
            💡 <strong>Tip:</strong> Unlock more customization options as you level up!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCustomizationPanel;
