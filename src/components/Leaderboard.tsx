import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const leaderboardData = [
  { name: "Alex Green", points: 5420, rank: 1, change: "+2", avatar: "AG" },
  { name: "Sarah Eco", points: 4890, rank: 2, change: "+1", avatar: "SE" },
  { name: "Mike Recycle", points: 4350, rank: 3, change: "-1", avatar: "MR" },
  { name: "You", points: 2847, rank: 12, change: "+3", avatar: "You", isCurrentUser: true },
  { name: "Emma Earth", points: 2650, rank: 15, change: "=", avatar: "EE" }
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getChangeColor = (change: string) => {
  if (change.startsWith("+")) return "text-green-600";
  if (change.startsWith("-")) return "text-red-600";
  return "text-gray-500";
};

const Leaderboard = () => {
  return (
    <Card className="w-full border-eco-light/30 bg-gradient-earth">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-eco">
          <TrendingUp className="h-6 w-6" />
          Community Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboardData.map((user, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                user.isCurrentUser
                  ? 'bg-eco-light/20 border border-eco-light'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(user.rank)}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={user.isCurrentUser ? "bg-eco text-white" : "bg-eco-light text-eco"}>
                    {user.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className={`font-semibold ${user.isCurrentUser ? 'text-eco' : 'text-foreground'}`}>
                    {user.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user.points.toLocaleString()} points
                  </p>
                </div>
              </div>
              <div className={`text-sm font-medium ${getChangeColor(user.change)}`}>
                {user.change}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-eco-light/10 rounded-lg text-center">
          <p className="text-sm text-eco-secondary">
            🌱 Keep recycling to climb higher! Next goal: Top 10
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;