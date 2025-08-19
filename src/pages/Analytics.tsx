import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Recycle, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface WasteTypeStats {
  waste_type: string;
  count: number;
  total_points: number;
}

interface MonthlyStats {
  month: string;
  disposals: number;
  points: number;
}

const Analytics = () => {
  const { user } = useAuth();
  const [wasteStats, setWasteStats] = useState<WasteTypeStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalDisposals: 0,
    totalPoints: 0,
    carbonSaved: 0,
    rank: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Fetch waste type statistics
      const { data: wasteData } = await supabase
        .from('disposals')
        .select('waste_type, points_earned')
        .eq('user_id', user?.id);

      if (wasteData) {
        const wasteTypeMap: { [key: string]: { count: number; total_points: number } } = {};
        
        wasteData.forEach(disposal => {
          if (!wasteTypeMap[disposal.waste_type]) {
            wasteTypeMap[disposal.waste_type] = { count: 0, total_points: 0 };
          }
          wasteTypeMap[disposal.waste_type].count++;
          wasteTypeMap[disposal.waste_type].total_points += disposal.points_earned;
        });

        const wasteStatsArray = Object.entries(wasteTypeMap).map(([waste_type, stats]) => ({
          waste_type,
          count: stats.count,
          total_points: stats.total_points
        }));

        setWasteStats(wasteStatsArray);
      }

      // Fetch monthly statistics (simplified for demo)
      const mockMonthlyData: MonthlyStats[] = [
        { month: 'Jan', disposals: 12, points: 150 },
        { month: 'Feb', disposals: 18, points: 220 },
        { month: 'Mar', disposals: 25, points: 310 },
        { month: 'Apr', disposals: 32, points: 420 },
        { month: 'May', disposals: 28, points: 380 },
        { month: 'Jun', disposals: 35, points: 450 },
      ];
      setMonthlyStats(mockMonthlyData);

      // Calculate total statistics
      const totalDisposals = wasteData?.length || 0;
      const totalPoints = wasteData?.reduce((sum, disposal) => sum + disposal.points_earned, 0) || 0;
      const carbonSaved = totalDisposals * 0.5; // Simplified calculation: 0.5kg CO2 per disposal
      
      setTotalStats({
        totalDisposals,
        totalPoints,
        carbonSaved,
        rank: Math.max(1, Math.floor(Math.random() * 100)) // Mock rank
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  const getWasteTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      plastic: 'bg-blue-500',
      paper: 'bg-yellow-500',
      metal: 'bg-gray-500',
      organic: 'bg-green-500',
      glass: 'bg-cyan-500',
      electronic: 'bg-purple-500'
    };
    return colorMap[type] || 'bg-eco';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-eco mb-2">Analytics</h1>
        <p className="text-muted-foreground text-lg">
          Track your environmental impact and disposal patterns
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-eco-light/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disposals</CardTitle>
            <Recycle className="h-4 w-4 text-eco" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-eco">{totalStats.totalDisposals}</div>
            <p className="text-xs text-muted-foreground">Items recycled</p>
          </CardContent>
        </Card>

        <Card className="border-eco-light/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eco Points</CardTitle>
            <Award className="h-4 w-4 text-eco" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-eco">{totalStats.totalPoints}</div>
            <p className="text-xs text-muted-foreground">Points earned</p>
          </CardContent>
        </Card>

        <Card className="border-eco-light/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CO₂ Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-eco" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-eco">{totalStats.carbonSaved.toFixed(1)}kg</div>
            <p className="text-xs text-muted-foreground">Carbon footprint reduced</p>
          </CardContent>
        </Card>

        <Card className="border-eco-light/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Rank</CardTitle>
            <BarChart3 className="h-4 w-4 text-eco" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-eco">#{totalStats.rank}</div>
            <p className="text-xs text-muted-foreground">In your area</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Type Breakdown */}
        <Card className="border-eco-light/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-eco">
              <Recycle className="h-5 w-5" />
              Waste Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wasteStats.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No disposal data yet. Start recycling to see your impact!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {wasteStats.map((stat) => {
                  const maxCount = Math.max(...wasteStats.map(s => s.count));
                  const percentage = (stat.count / maxCount) * 100;
                  
                  return (
                    <div key={stat.waste_type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getWasteTypeEmoji(stat.waste_type)}</span>
                          <span className="font-medium capitalize">{stat.waste_type}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{stat.count}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({stat.total_points} pts)
                          </span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="border-eco-light/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-eco">
              <TrendingUp className="h-5 w-5" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyStats.map((stat, index) => {
                const maxDisposals = Math.max(...monthlyStats.map(s => s.disposals));
                const percentage = (stat.disposals / maxDisposals) * 100;
                
                return (
                  <div key={stat.month} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{stat.month}</span>
                      <div className="text-right">
                        <span className="font-semibold">{stat.disposals}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({stat.points} pts)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-eco h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Impact */}
      <Card className="border-eco-light/30 bg-gradient-earth">
        <CardHeader>
          <CardTitle className="text-eco">🌱 Your Environmental Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-eco mb-2">
                {(totalStats.totalDisposals * 2.5).toFixed(0)}L
              </div>
              <p className="text-sm text-muted-foreground">Water saved</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-eco mb-2">
                {(totalStats.totalDisposals * 0.3).toFixed(0)} kWh
              </div>
              <p className="text-sm text-muted-foreground">Energy conserved</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-eco mb-2">
                {Math.ceil(totalStats.totalDisposals / 10)}
              </div>
              <p className="text-sm text-muted-foreground">Trees equivalent saved</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;