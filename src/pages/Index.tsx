import { useState } from "react";
import { Recycle, Leaf, Award, Scan, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EcoStats from "@/components/EcoStats";
import WasteDisposal from "@/components/WasteDisposal";
import Leaderboard from "@/components/Leaderboard";
import heroImage from "@/assets/hero-ecobin.jpg";

const Index = () => {
  const [currentTab, setCurrentTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-earth py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img 
            src={heroImage} 
            alt="EcoBin Smart Waste Management" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="animate-float mb-8">
            <Recycle className="h-16 w-16 text-eco mx-auto mb-4" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-gradient-eco">EcoBin</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto">
            Transform waste into rewards. Every disposal makes a difference for our planet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="eco" 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => setCurrentTab("disposal")}
            >
              <Scan className="h-5 w-5 mr-2" />
              Start Recycling
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 border-eco text-eco hover:bg-eco hover:text-white"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto py-16 px-4">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-eco-light/20">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="disposal" className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              Dispose
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-eco mb-4">Your Eco Impact</h2>
              <p className="text-lg text-muted-foreground">
                Track your environmental contribution and earn rewards
              </p>
            </div>
            <EcoStats />
            
            {/* Recent Activity */}
            <Card className="border-eco-light/30 bg-gradient-earth">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-eco mb-4 flex items-center gap-2">
                  <Recycle className="h-5 w-5" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {[
                    { type: "🥤 Plastic", points: "+10", time: "2 hours ago", location: "Bin A203" },
                    { type: "📄 Paper", points: "+8", time: "1 day ago", location: "Bin B105" },
                    { type: "🥫 Metal", points: "+15", time: "2 days ago", location: "Bin A203" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div>
                        <p className="font-medium">{activity.type}</p>
                        <p className="text-sm text-muted-foreground">{activity.time} • {activity.location}</p>
                      </div>
                      <span className="text-eco font-semibold">{activity.points}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disposal" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-eco mb-4">Smart Disposal</h2>
              <p className="text-lg text-muted-foreground">
                Scan a bin and dispose your waste responsibly
              </p>
            </div>
            <WasteDisposal />
          </TabsContent>

          <TabsContent value="community" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-eco mb-4">Community Leaders</h2>
              <p className="text-lg text-muted-foreground">
                See how you rank among local eco-warriors
              </p>
            </div>
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </section>

      {/* Footer */}
      <footer className="bg-eco-dark text-white py-12 px-4 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <Recycle className="h-12 w-12 mx-auto mb-4 opacity-80" />
            <h3 className="text-2xl font-bold mb-2">EcoBin</h3>
            <p className="text-eco-light">Making the world cleaner, one disposal at a time.</p>
          </div>
          <p className="text-sm opacity-75">
            © 2024 EcoBin. Building a sustainable future through smart waste management.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;