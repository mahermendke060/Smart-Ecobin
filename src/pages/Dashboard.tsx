import { useEffect, useState } from 'react';
import { Trophy, Recycle, TrendingUp, Crown, Flame, Info, Zap, Target, ChevronRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

interface Profile {
  full_name: string | null;
  points: number;
  total_disposals: number;
  bins_used: number;
}

interface RecentDisposal {
  id: string;
  waste_type: string;
  points_earned: number;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentDisposals, setRecentDisposals] = useState<RecentDisposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<{ rank: number; user_name: string; recycling_score: number; total_scans: number; is_current_user: boolean; }[]>([]);
  const [yourRank, setYourRank] = useState<number | null>(null);
  const tips = [
    'Recycling one plastic bottle saves enough energy to power a light bulb for 3 hours!',
    'Rinse containers before recycling to avoid contamination.',
    'Flatten cardboard boxes to save space in the recycling bin.',
    'Composting food waste reduces methane emissions from landfills.'
  ];
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    const id = setInterval(() => setTipIndex((i) => (i + 1) % tips.length), 10000);
    return () => clearInterval(id);
  }, []);

  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      // Fetch user profile
      const profileData = await apiService.getProfile();
      if (profileData) setProfile({
        full_name: profileData.full_name,
        points: profileData.points || 0,
        total_disposals: profileData.total_disposals || 0,
        bins_used: profileData.bins_used || 0,
      });

      // Fetch recent disposals
      const disposalsData = await apiService.getRecentDisposals(5);
      if (disposalsData) {
        const mapped = disposalsData.map((d: any) => ({
          id: String(d.id),
          waste_type: d.waste_type,
          points_earned: d.points_earned || 0,
          created_at: d.created_at,
        }));
        setRecentDisposals(mapped);
      }

      // Fetch analytics (streak, totals, etc.)
      try {
        const analytics = await apiService.getDashboardAnalytics();
        setStreakDays(analytics?.achievements ? (analytics?.achievements.includes('streak') ? analytics?.streak_days || 0 : analytics?.streak_days || 0) : analytics?.streak_days || 0);
      } catch {}

      // Fetch leaderboard
      try {
        const lb = await apiService.getLeaderboard();
        setLeaderboard(lb?.leaderboard || []);
        setYourRank(lb?.current_user_rank || null);
      } catch {}

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWasteTypeEmoji = (type: string) => {
    const emojiMap: { [key: string]: string } = {
      plastic: '🥤',
      paper: '📄',
      metal: '🥫',
      organic: '🍎',
      glass: '🍶',
      electronic: '📱'
    };
    return emojiMap[type] || '♻️';
  };

  const parseAsUTC = (s: string) => {
    // Treat timestamps without timezone as UTC to avoid local offset issues
    const hasTZ = /Z|[+-]\d{2}:?\d{2}$/.test(s);
    return new Date(hasTZ ? s : s.replace(' ', 'T') + 'Z');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = parseAsUTC(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 5) return 'Just now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl space-y-6">

      {/* Header is provided by AppLayout */}

      {/* Stats Cards */}
      <div className="px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-eco-light/30 bg-gradient-to-br from-emerald-400 to-green-500 text-white relative overflow-hidden rounded-3xl shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium text-white/90">Total Disposals</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><Recycle className="h-5 w-5 text-white"/></div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl md:text-6xl font-bold">{profile?.total_disposals || 0}</div>
            <p className="text-white/90">Items recycled responsibly</p>
            <div className="mt-6 pt-4 border-t border-white/30 flex items-center justify-between">
              <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5"/><span className="text-sm font-semibold">+2 this week</span></div>
              <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">Keep it up! 🌟</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-eco-light/30 bg-gradient-to-br from-cyan-400 to-blue-500 text-white relative overflow-hidden rounded-3xl shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium text-white/90">Points Earned</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><Trophy className="h-5 w-5 text-white"/></div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl md:text-6xl font-bold">{profile?.points || 0}</div>
            <p className="text-white/90">Eco points collected</p>
            <div className="mt-6 pt-4 border-t border-white/30 flex items-center justify-between">
              <div className="flex items-center gap-2"><Zap className="w-5 h-5"/><span className="text-sm font-semibold">72 points to next level</span></div>
              <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">72% 🎯</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak & Tip */}
      <div className="px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-eco-light/30 bg-white rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-eco text-2xl"><Flame className="h-6 w-6 text-orange-500"/>Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-6xl font-bold text-orange-500">{streakDays}</span>
              <span className="text-2xl font-semibold text-gray-600 mb-2">day{streakDays === 1 ? '' : 's'}</span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Target className="w-5 h-5 text-orange-500"/>Keep scanning daily to grow your streak!</p>
            <div className="mt-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border-2 border-orange-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Next milestone</p>
                <p className="font-bold text-orange-600">7 day streak 🔥</p>
              </div>
              <Flame className="w-8 h-8 text-orange-400"/>
            </div>
          </CardContent>
        </Card>

        <Card className="border-eco-light/30 bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><Info className="h-6 w-6"/>Eco Tip</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed mb-6 min-h-[72px]">{tips[tipIndex]}</p>
            <button onClick={() => setTipIndex((i)=> (i+1)%tips.length)} className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-colors">Next Tip <ChevronRight className="w-5 h-5"/></button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-eco-light/30 mx-4 md:mx-6 rounded-3xl shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-eco">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          {recentDisposals.length === 0 ? (
            <div className="text-center py-8">
              <Recycle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No disposals yet. Try your first scan using AI Detection!</p>
              <p className="text-xs text-muted-foreground">Tip: good lighting helps the AI recognize items.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDisposals.map((disposal) => (
                <div key={disposal.id} className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                      <span className="text-2xl">{getWasteTypeEmoji(disposal.waste_type)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 capitalize">{disposal.waste_type}</p>
                      <p className="text-sm text-gray-600">{formatTimeAgo(disposal.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-600 font-bold text-xl">+{disposal.points_earned} pts</div>
                    <div className="text-xs text-gray-500 mt-1">Added to total</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-center">
            <a href="/disposal" className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all flex items-center gap-3">
              <Recycle className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
              Scan New Item
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Dashboard;