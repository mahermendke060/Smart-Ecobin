import { useState } from 'react';
import { QrCode, Trash2, Scale, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ScanDisposal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    binId: '',
    wasteType: '',
    weight: ''
  });

  const wasteTypes = [
    { value: 'plastic', label: 'Plastic', emoji: '🥤', points: 10 },
    { value: 'paper', label: 'Paper', emoji: '📄', points: 8 },
    { value: 'metal', label: 'Metal', emoji: '🥫', points: 15 },
    { value: 'organic', label: 'Organic', emoji: '🍎', points: 5 },
    { value: 'glass', label: 'Glass', emoji: '🍶', points: 12 },
    { value: 'electronic', label: 'Electronic', emoji: '📱', points: 20 }
  ];

  const handleScanQR = () => {
    // Simulate QR scanner - in real app, this would open camera
    const mockBinIds = ['BIN001', 'BIN002', 'BIN003', 'BIN004', 'BIN005'];
    const randomBinId = mockBinIds[Math.floor(Math.random() * mockBinIds.length)];
    setFormData({ ...formData, binId: randomBinId });
    
    toast({
      title: 'QR Code Scanned!',
      description: `Bin ${randomBinId} detected and ready for disposal.`,
    });
  };

  const calculatePoints = (wasteType: string, weight: number) => {
    const basePoints = wasteTypes.find(type => type.value === wasteType)?.points || 10;
    return Math.floor(basePoints * (weight / 100) * 10); // Points based on weight and type
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Find the bin
      const { data: bin } = await supabase
        .from('bins')
        .select('*')
        .eq('bin_id', formData.binId)
        .single();

      if (!bin) {
        toast({
          title: 'Error',
          description: 'Bin not found. Please check the bin ID.',
          variant: 'destructive',
        });
        return;
      }

      const weight = parseFloat(formData.weight) || 1;
      const pointsEarned = calculatePoints(formData.wasteType, weight);

      // Record disposal
      const { error: disposalError } = await supabase
        .from('disposals')
        .insert({
          user_id: user.id,
          bin_id: bin.id,
          waste_type: formData.wasteType,
          weight: weight,
          points_earned: pointsEarned
        });

      if (disposalError) {
        throw disposalError;
      }

      // Update user profile
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (currentProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            points: (currentProfile.points || 0) + pointsEarned,
            total_disposals: (currentProfile.total_disposals || 0) + 1,
            bins_used: currentProfile.bins_used // This would need more logic to track unique bins
          })
          .eq('user_id', user.id);

        if (profileError) {
          throw profileError;
        }
      }

      toast({
        title: '🎉 Disposal Recorded!',
        description: `Great job! You earned ${pointsEarned} eco points for disposing ${formData.wasteType} waste responsibly.`,
      });

      // Reset form
      setFormData({ binId: '', wasteType: '', weight: '' });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record disposal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-eco mb-2">Scan & Disposal</h1>
        <p className="text-muted-foreground text-lg">
          Scan a bin QR code and record your eco-friendly disposal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner */}
        <Card className="border-eco-light/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-eco">
              <QrCode className="h-5 w-5" />
              Scan QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-gradient-earth p-8 rounded-lg">
              <QrCode className="h-24 w-24 text-eco mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Point your camera at the bin's QR code to get started
              </p>
              <Button 
                onClick={handleScanQR}
                className="bg-eco hover:bg-eco-dark"
                size="lg"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            </div>
            {formData.binId && (
              <div className="bg-eco/10 p-4 rounded-lg">
                <p className="text-eco font-semibold">✅ Bin {formData.binId} Ready</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Entry Form */}
        <Card className="border-eco-light/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-eco">
              <Trash2 className="h-5 w-5" />
              Disposal Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="binId">Bin ID</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="binId"
                    placeholder="Enter bin ID or scan QR code"
                    value={formData.binId}
                    onChange={(e) => setFormData({ ...formData, binId: e.target.value })}
                    className="pl-10 border-eco-light/50 focus:border-eco"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Waste Type</Label>
                <Select 
                  value={formData.wasteType} 
                  onValueChange={(value) => setFormData({ ...formData, wasteType: value })}
                >
                  <SelectTrigger className="border-eco-light/50 focus:border-eco">
                    <SelectValue placeholder="Select waste type" />
                  </SelectTrigger>
                  <SelectContent>
                    {wasteTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.emoji}</span>
                          <span>{type.label}</span>
                          <span className="text-eco text-sm">({type.points} pts/100g)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (grams)</Label>
                <div className="relative">
                  <Scale className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="weight"
                    type="number"
                    min="1"
                    placeholder="Enter weight in grams"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="pl-10 border-eco-light/50 focus:border-eco"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Optional - helps calculate accurate points
                </p>
              </div>

              <Separator />

              <Button
                type="submit"
                className="w-full bg-eco hover:bg-eco-dark"
                disabled={!formData.binId || !formData.wasteType || isLoading}
                size="lg"
              >
                {isLoading ? 'Recording...' : 'Record Disposal'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Points Preview */}
      {formData.wasteType && formData.weight && (
        <Card className="border-eco-light/30 bg-gradient-reward">
          <CardContent className="p-6 text-center">
            <h3 className="text-white font-semibold text-lg mb-2">Points Preview</h3>
            <div className="text-3xl font-bold text-white">
              +{calculatePoints(formData.wasteType, parseFloat(formData.weight) || 1)} 
              <span className="text-sm ml-2">eco points</span>
            </div>
            <p className="text-white/80 text-sm mt-2">
              Great choice! Every point counts towards a greener planet 🌱
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScanDisposal;