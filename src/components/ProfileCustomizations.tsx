import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Palette, Sparkles, Crown, Star } from "lucide-react";

interface ProfileCustomizationsProps {
  level: number;
}

const customizations = [
  { level: 10, name: "Custom Colors", icon: Palette, description: "Customize your profile colors" },
  { level: 20, name: "Animated Badges", icon: Sparkles, description: "Add animated badges to your profile" },
  { level: 30, name: "Premium Frames", icon: Crown, description: "Unlock premium avatar frames" },
  { level: 40, name: "Profile Effects", icon: Star, description: "Add special effects to your profile" },
  { level: 50, name: "Elite Status", icon: Crown, description: "Display elite status badge" },
];

const ProfileCustomizations = ({ level }: ProfileCustomizationsProps) => {
  const unlockedCustomizations = customizations.filter((c) => level >= c.level);
  const lockedCustomizations = customizations.filter((c) => level < c.level);

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Profile Customizations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {unlockedCustomizations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Unlocked</h3>
            {unlockedCustomizations.map((custom) => {
              const Icon = custom.icon;
              return (
                <div
                  key={custom.level}
                  className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{custom.name}</p>
                    <p className="text-xs text-muted-foreground">{custom.description}</p>
                  </div>
                  <Badge variant="default">Level {custom.level}</Badge>
                </div>
              );
            })}
          </div>
        )}

        {lockedCustomizations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Locked</h3>
            {lockedCustomizations.map((custom) => {
              const Icon = custom.icon;
              return (
                <div
                  key={custom.level}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border opacity-60"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{custom.name}</p>
                    <p className="text-xs text-muted-foreground">{custom.description}</p>
                  </div>
                  <Badge variant="outline">Level {custom.level}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCustomizations;
