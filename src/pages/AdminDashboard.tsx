import React, { useEffect, useState } from 'react';
import { 
  Users, Activity, Calendar, Clock, BarChart3, TrendingUp, RefreshCw 
} from 'lucide-react';
import supabase from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AdminDashboard = () => {
  const [onlineNow, setOnlineNow] = useState<number>(0);
  const [today, setToday] = useState<number>(0);
  const [yesterday, setYesterday] = useState<number>(0);
  const [thisMonth, setThisMonth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Custom range
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customRangeCount, setCustomRangeCount] = useState<number | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      
      // 1. Online Now (last 5 minutes)
      const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      const { count: onlineCount } = await supabase
        .from('daily_visits')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', fiveMinsAgo);
      setOnlineNow(onlineCount || 0);

      // 2. Today
      const todayStr = now.toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('daily_visits')
        .select('*', { count: 'exact', head: true })
        .eq('visit_date', todayStr);
      setToday(todayCount || 0);

      // 3. Yesterday
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
      const { count: yesterdayCount } = await supabase
        .from('daily_visits')
        .select('*', { count: 'exact', head: true })
        .eq('visit_date', yesterdayStr);
      setYesterday(yesterdayCount || 0);

      // 4. This Month
      const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const { count: monthCount } = await supabase
        .from('daily_visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', startOfMonthStr);
      setThisMonth(monthCount || 0);

      // 5. Custom Range
      fetchCustomRange(startDate, endDate);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomRange = async (start: string, end: string) => {
    try {
      if (!start || !end) return;
      const { count } = await supabase
        .from('daily_visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', start)
        .lte('visit_date', end);
      setCustomRangeCount(count || 0);
    } catch (error) {
      console.error('Error fetching custom range:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh Online Now every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCustomRangeQuery = () => {
    fetchCustomRange(startDate, endDate);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Admin Analytics
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              Monitor your website traffic and active users in real-time.
            </p>
          </div>
          <Button 
            onClick={fetchStats} 
            disabled={isLoading}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Stats
          </Button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Online Now" 
            value={onlineNow} 
            icon={<Activity className="w-6 h-6 text-green-400" />} 
            description="Active in last 5 minutes"
            isLive
          />
          <MetricCard 
            title="Today" 
            value={today} 
            icon={<Users className="w-6 h-6 text-blue-400" />} 
            description="Unique device sessions"
          />
          <MetricCard 
            title="Yesterday" 
            value={yesterday} 
            icon={<Clock className="w-6 h-6 text-orange-400" />} 
            description="Total unique yesterday"
          />
          <MetricCard 
            title="This Month" 
            value={thisMonth} 
            icon={<Calendar className="w-6 h-6 text-purple-400" />} 
            description="Unique devices this month"
          />
        </div>

        {/* Custom Range Filter */}
        <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <BarChart3 className="w-5 h-5 text-pink-400" />
              Custom Time Period Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-end gap-6">
              <div className="w-full md:w-auto flex-1 max-w-sm space-y-2">
                <label className="text-sm text-gray-400 font-medium">Start Date</label>
                <div className="flex relative">
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-black/50 border-white/10 text-white focus:border-pink-500/50"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-auto flex-1 max-w-sm space-y-2">
                <label className="text-sm text-gray-400 font-medium">End Date</label>
                <div className="flex relative">
                  <Input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)} 
                    className="bg-black/50 border-white/10 text-white focus:border-pink-500/50"
                  />
                </div>
              </div>

              <Button 
                onClick={handleCustomRangeQuery}
                className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-pink-500/20"
              >
                Analyze Period
              </Button>
            </div>

            {customRangeCount !== null && (
              <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                  <TrendingUp className="w-8 h-8 text-pink-400" />
                </div>
                <div>
                  <p className="text-gray-400 font-medium text-sm">Unique Users in Period</p>
                  <p className="text-4xl font-bold mt-1 text-white">
                    {customRangeCount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  isLive?: boolean;
}

const MetricCard = ({ title, value, icon, description, isLive }: MetricCardProps) => (
  <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-gray-400 font-medium text-sm">{title}</p>
          <div className="flex items-center gap-3">
            <h3 className="text-4xl font-black tracking-tight text-white">
              {value.toLocaleString()}
            </h3>
            {isLive && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500/80 mt-2 font-medium">
            {description}
          </p>
        </div>
        <div className="p-3 bg-black/40 rounded-xl border border-white/5">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboard;
