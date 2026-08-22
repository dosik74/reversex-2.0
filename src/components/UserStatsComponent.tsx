import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import supabase from "@/utils/supabase";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Eye,
  Heart,
  Activity,
} from "lucide-react";

interface UserStats {
  moviesWatched: number;
  seriesWatched: number;
  favoriteMovies: number;
  totalRatings: number;
  averageRating: number;
  joinDate: string;
  lastActive: string;
  streakDays: number;
  xp: number;
  level: number;
}

interface UserStatsComponentProps {
  userId: string;
}

const UserStatsComponent = ({ userId }: UserStatsComponentProps) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Здесь должны быть запросы к таблицам для получения статистики
      // Пока используем демо данные
      const demoStats: UserStats = {
        moviesWatched: 42,
        seriesWatched: 8,
        favoriteMovies: 12,
        totalRatings: 35,
        averageRating: 7.2,
        joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        lastActive: new Date().toLocaleDateString(),
        streakDays: 5,
        xp: 1250,
        level: 8,
      };

      setStats(demoStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Loading stats...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const statItems = [
    {
      icon: Eye,
      label: "Movies Watched",
      value: stats.moviesWatched,
      color: "text-blue-500",
    },
    {
      icon: Activity,
      label: "Series Watched",
      value: stats.seriesWatched,
      color: "text-purple-500",
    },
    {
      icon: Heart,
      label: "Favorites",
      value: stats.favoriteMovies,
      color: "text-red-500",
    },
    {
      icon: TrendingUp,
      label: "Ratings",
      value: stats.totalRatings,
      color: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Main Stats Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Profile Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="p-3 bg-muted rounded-lg text-center"
                >
                  <div className="flex justify-center mb-2">
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Level & XP Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Level & XP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Level {stats.level}</span>
              <span className="text-xs text-muted-foreground">
                {stats.xp} XP
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(stats.xp % 500) / 5}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Streak</p>
            <Badge variant="default">
              <Clock className="w-3 h-3 mr-1" />
              {stats.streakDays} days
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Average Rating</p>
            <Badge variant="outline">
              ★ {stats.averageRating.toFixed(1)}/10
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Time Info Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Member Since</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="font-medium">{stats.joinDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Active</p>
              <p className="font-medium">{stats.lastActive}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserStatsComponent;
