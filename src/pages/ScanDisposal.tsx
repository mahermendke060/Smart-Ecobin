import { useState } from 'react';
import { QrCode, Trash2, Scale, MapPin, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CameraCapture } from '@/components/CameraCapture';

const ScanDisposal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [aiDetectionResult, setAiDetectionResult] = useState<{
    isGarbage: boolean;
    confidence: number;
    wasteType: string;
    description: string;
    pointsEarned: number;
    imageData: string;
  } | null>(null);
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

  const handleImageCaptured = (imageData: string, isGarbage: boolean, confidence: number, pointsEarned: number) => {
    setAiDetectionResult({
      isGarbage,
      confidence,
      wasteType: 'ai-detected',
      description: `AI detected ${isGarbage ? 'recyclable waste' : 'non-recyclable item'}`,
      pointsEarned,
      imageData
    });
    setShowCamera(false);
    
    if (isGarbage) {
      setFormData({
        ...formData,
        wasteType: 'ai-detected',
        weight: '100' // Default weight for AI detection
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Use AI detection points if available, otherwise calculate manually
      const pointsEarned = aiDetectionResult?.isGarbage 
        ? aiDetectionResult.pointsEarned 
        : calculatePoints(formData.wasteType, parseFloat(formData.weight) || 1);

      if (aiDetectionResult && !aiDetectionResult.isGarbage) {
        toast({
          title: 'No Points Earned',
          description: 'AI analysis indicates this item is not recyclable waste.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

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

      // Record disposal
      const { error: disposalError } = await supabase
        .from('disposals')
        .insert({
          user_id: user.id,
          bin_id: bin.id,
          waste_type: formData.wasteType,
          weight: weight,
          points_earned: pointsEarned,
          ai_verified: !!aiDetectionResult,
          ai_confidence: aiDetectionResult?.confidence || null
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
            bins_used: currentProfile.bins_used
          })
          .eq('user_id', user.id);

        if (profileError) {
          throw profileError;
        }
      }

      const successMessage = aiDetectionResult 
        ? `Amazing! AI verified your recyclable waste. You earned ${pointsEarned} eco points!`
        : `Great job! You earned ${pointsEarned} eco points for disposing ${formData.wasteType} waste responsibly.`;

      toast({
        title: '🎉 Disposal Recorded!',
        description: successMessage,
      });

      // Reset form and AI detection
      setFormData({ binId: '', wasteType: '', weight: '' });
      setAiDetectionResult(null);
      
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
          Scan a bin QR code and use AI to verify your eco-friendly disposal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner & AI Detection */}
        <Card className="border-eco-light/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-eco">
              <QrCode className="h-5 w-5" />
              Scan & AI Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Scanner Section */}
            <div className="text-center">
              <div className="bg-gradient-earth p-6 rounded-lg mb-4">
                <QrCode className="h-16 w-16 text-eco mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">
                  Scan bin QR code to get started
                </p>
                <Button 
                  onClick={handleScanQR}
                  className="bg-eco hover:bg-eco-dark"
                  size="sm"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan QR Code
                </Button>
              </div>
              {formData.binId && (
                <div className="bg-eco/10 p-3 rounded-lg mb-4">
                  <p className="text-eco font-semibold text-sm">✅ Bin {formData.binId} Ready</p>
                </div>
              )}
            </div>

            <Separator />

            {/* AI Camera Detection Section */}
            <div className="text-center">
              <div className="bg-gradient-reward p-6 rounded-lg">
                <Camera className="h-16 w-16 text-white mx-auto mb-3" />
                <p className="text-white mb-3">
                  Use AI to detect and verify your waste
                </p>
                <Button 
                  onClick={() => setShowCamera(true)}
                  className="bg-white text-eco hover:bg-white/90"
                  size="sm"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  AI Waste Detection
                </Button>
              </div>
              
              {aiDetectionResult && (
                <div className={`p-4 rounded-lg mt-4 ${aiDetectionResult.isGarbage ? 'bg-eco/10' : 'bg-destructive/10'}`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-lg">
                      {aiDetectionResult.isGarbage ? '✅' : '❌'}
                    </span>
                    <p className={`font-semibold ${aiDetectionResult.isGarbage ? 'text-eco' : 'text-destructive'}`}>
                      {aiDetectionResult.isGarbage ? 'Recyclable Waste Detected!' : 'Not Recyclable'}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {aiDetectionResult.description}
                  </p>
                  <p className="text-sm">
                    Confidence: {Math.round(aiDetectionResult.confidence * 100)}%
                  </p>
                  {aiDetectionResult.isGarbage && (
                    <p className="text-eco font-semibold mt-2">
                      +{aiDetectionResult.pointsEarned} eco points
                    </p>
                  )}
                </div>
              )}
            </div>
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
                    <SelectValue placeholder="Select waste type or use AI detection" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.wasteType === 'ai-detected' && (
                      <SelectItem value="ai-detected">
                        <div className="flex items-center gap-2">
                          <span>🤖</span>
                          <span>AI Detected</span>
                          <span className="text-eco text-sm">(Verified)</span>
                        </div>
                      </SelectItem>
                    )}
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
                  {aiDetectionResult ? 'AI-detected items use default weight' : 'Optional - helps calculate accurate points'}
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
      {((formData.wasteType && formData.weight) || aiDetectionResult) && (
        <Card className="border-eco-light/30 bg-gradient-reward">
          <CardContent className="p-6 text-center">
            <h3 className="text-white font-semibold text-lg mb-2">Points Preview</h3>
            <div className="text-3xl font-bold text-white">
              +{aiDetectionResult?.isGarbage 
                ? aiDetectionResult.pointsEarned 
                : calculatePoints(formData.wasteType, parseFloat(formData.weight) || 1)
              }
              <span className="text-sm ml-2">eco points</span>
            </div>
            <p className="text-white/80 text-sm mt-2">
              {aiDetectionResult 
                ? "AI-verified recyclable waste! 🤖🌱" 
                : "Great choice! Every point counts towards a greener planet 🌱"
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onImageCaptured={handleImageCaptured}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default ScanDisposal;