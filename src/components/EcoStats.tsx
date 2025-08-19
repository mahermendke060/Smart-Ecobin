import { Leaf, Zap, Trophy, Recycle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
}

const StatCard = ({ icon, label, value, unit, trend }: StatCardProps) => (
  <Card className="border-eco-light/30 bg-gradient-earth hover:shadow-eco transition-all duration-300 hover:scale-105">
    <CardContent className="p-6 text-center">
      <div className="mb-4 flex justify-center text-eco text-3xl">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground mb-2">{label}</h3>
      <div className="text-2xl font-bold text-eco mb-1">
        {value}
        {unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
      </div>
      {trend && (
        <p className="text-xs text-eco-secondary">{trend}</p>
      )}
    </CardContent>
  </Card>
);

const EcoStats = () => {
  const stats = [
    {
      icon: <Trophy />,
      label: "Eco Points",
      value: 2,
      unit: "847",
      trend: "+150 this week"
    },
    {
      icon: <Recycle />,
      label: "Items Recycled",
      value: 142,
      unit: "items",
      trend: "23 this week"
    },
    {
      icon: <Leaf />,
      label: "CO₂ Saved",
      value: 34,
      unit: "kg",
      trend: "5.2kg this week"
    },
    {
      icon: <Zap />,
      label: "Rank",
      value: "#12",
      unit: "",
      trend: "in your city"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default EcoStats;