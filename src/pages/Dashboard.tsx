import { useEffect, useState } from 'react';
import { Trophy, Recycle, MapPin, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  bins: {
    bin_id: string;
    location: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentDisposals, setRecentDisposals] = useState<RecentDisposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch recent disposals
      const { data: disposalsData } = await supabase
        .from('disposals')
        .select(`
          *,
          bins (
            bin_id,
            location
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (disposalsData) {
        setRecentDisposals(disposalsData);
      }
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-eco mb-2">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Eco Warrior'}! 🌱
        </h1>
        <p className="text-muted-foreground text-lg">
          Ready to make a positive impact on the environment today?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-eco-light/30 bg-gradient-earth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-eco">Total Disposals</CardTitle>
            <Recycle className="h-4 w-4 text-eco" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-eco">{profile?.total_disposals || 0}</div>
            <p className="text-xs text-muted-foreground">Items recycled responsibly</p>
          </CardContent>
        </Card>

        <Card className="border-eco-light/30 bg-gradient-reward">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Points Earned</CardTitle>
            <Trophy className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{profile?.points || 0}</div>
            <p className="text-xs text-white/80">Eco points collected</p>
          </CardContent>
        </Card>

        <Card className="border-eco-light/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-eco">Bins Used</CardTitle>
            <MapPin className="h-4 w-4 text-eco" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-eco">{profile?.bins_used || 0}</div>
            <p className="text-xs text-muted-foreground">Different locations visited</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-eco-light/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-eco">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentDisposals.length === 0 ? (
            <div className="text-center py-8">
              <Recycle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No disposals yet. Start by scanning a bin to make your first eco-friendly disposal!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentDisposals.map((disposal) => (
                <div
                  key={disposal.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getWasteTypeEmoji(disposal.waste_type)}
                    </span>
                    <div>
                      <p className="font-medium capitalize">
                        {disposal.waste_type} Waste
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTimeAgo(disposal.created_at)} • {disposal.bins.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-eco font-semibold">
                      +{disposal.points_earned} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;