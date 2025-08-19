import { useState } from "react";
import { Trash2, Scan, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const wasteTypes = [
  { id: "plastic", name: "Plastic", icon: "🥤", points: 10, color: "bg-blue-100 text-blue-800" },
  { id: "organic", name: "Organic", icon: "🍌", points: 5, color: "bg-green-100 text-green-800" },
  { id: "paper", name: "Paper", icon: "📄", points: 8, color: "bg-yellow-100 text-yellow-800" },
  { id: "metal", name: "Metal", icon: "🥫", points: 15, color: "bg-gray-100 text-gray-800" },
  { id: "glass", name: "Glass", icon: "🍾", points: 12, color: "bg-cyan-100 text-cyan-800" },
  { id: "electronics", name: "E-Waste", icon: "📱", points: 25, color: "bg-purple-100 text-purple-800" }
];

const WasteDisposal = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanBin = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Bin Scanned Successfully! 📱",
        description: "Smart Bin #A203 is ready for disposal. Select your waste type.",
      });
    }, 2000);
  };

  const handleDisposal = () => {
    if (!selectedType) {
      toast({
        title: "Please select waste type",
        description: "Choose what type of waste you're disposing.",
        variant: "destructive"
      });
      return;
    }

    const wasteType = wasteTypes.find(w => w.id === selectedType);
    toast({
      title: `${wasteType?.icon} Disposal Successful!`,
      description: `You earned ${wasteType?.points} eco points! Keep up the great work! 🌱`,
    });
    setSelectedType(null);
  };

  return (
    <Card className="w-full border-eco-light/30 bg-gradient-earth">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-eco">
          <Trash2 className="h-6 w-6" />
          Smart Waste Disposal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scan Bin Button */}
        <Button
          onClick={handleScanBin}
          disabled={isScanning}
          variant="default"
          size="lg"
          className="w-full bg-gradient-eco hover:shadow-eco text-white font-semibold py-4"
        >
          <Scan className={`h-5 w-5 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning Bin...' : 'Scan Smart Bin'}
        </Button>

        {/* Waste Type Selection */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">Select Waste Type:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {wasteTypes.map((type) => (
              <Button
                key={type.id}
                variant={selectedType === type.id ? "default" : "outline"}
                className={`h-20 flex-col gap-1 ${
                  selectedType === type.id 
                    ? 'bg-eco text-white border-eco' 
                    : 'border-eco-light hover:border-eco hover:bg-eco-light/10'
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="text-xs font-medium">{type.name}</span>
                <span className="text-xs opacity-75">+{type.points}pts</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Dispose Button */}
        <Button
          onClick={handleDisposal}
          variant="default"
          size="lg"
          className="w-full bg-gradient-reward text-white font-semibold py-4 hover:shadow-glow"
        >
          <Plus className="h-5 w-5 mr-2" />
          Dispose Waste & Earn Points
        </Button>
      </CardContent>
    </Card>
  );
};

export default WasteDisposal;