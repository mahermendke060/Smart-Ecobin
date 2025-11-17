import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CameraCapture } from '@/components/CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ScanDisposal = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [aiDetectionResult, setAiDetectionResult] = useState<{
    isGarbage: boolean;
    confidence: number;
    wasteType: string;
    description: string;
    pointsEarned: number;
    imageData: string;
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const isValidUuid = (value: string | null | undefined) => {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  };

  const ensureBin = async (): Promise<string | null> => {
    // Try to reuse any existing bin
    const { data: bins, error: binsError } = await supabase
      .from('bins')
      .select('id, bin_id, location, status')
      .limit(1);

    if (binsError) {
      console.error('Failed to fetch bins', binsError);
      return null;
    }

    if (bins && bins.length > 0) {
      const existingId = (bins[0] as any)?.id as string | undefined;
      if (isValidUuid(existingId)) {
        return existingId as string;
      }
      // If existing id is not a UUID (legacy rows), fall through to create a new UUID bin
    }

    // Create a default bin for AI detection flow
    const { data: newBin, error: createError } = await supabase
      .from('bins')
      .insert({
        bin_id: 'AI-DETECTION',
        location: 'AI Detection',
        status: 'virtual'
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Failed to create default bin', createError);
      return null;
    }

    return (newBin as any)?.id ?? null;
  };

  const persistReward = async (wasteType: string, points: number) => {
    if (!user) {
      toast({ title: 'Not signed in', description: 'Please log in to earn points.', variant: 'destructive' });
      return;
    }

    const binId = await ensureBin();
    if (!binId) {
      toast({ title: 'Setup error', description: 'No bin available to record disposal.', variant: 'destructive' });
      return;
    }

    // Insert disposal record
    const { error: insertError } = await supabase
      .from('disposals')
      .insert({
        user_id: user.id,
        bin_id: binId,
        waste_type: wasteType,
        points_earned: points
      });

    if (insertError) {
      console.error('Failed to record disposal', insertError);
      toast({ title: 'Save error', description: 'Could not record your disposal.', variant: 'destructive' });
      return;
    }

    // Update profile points and totals
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileErr) {
      console.error('Failed to load profile', profileErr);
      return;
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        points: (profile?.points || 0) + (points || 0),
        total_disposals: (profile?.total_disposals || 0) + 1,
      })
      .eq('user_id', user.id);

    if (updateErr) {
      console.error('Failed to update profile points', updateErr);
      return;
    }

    toast({ title: 'Points awarded!', description: `You earned +${points} eco points.` });
  };

  const handleImageCaptured = async (
    imageData: string,
    result: { isGarbage: boolean; confidence: number; wasteType: string; description: string; pointsEarned: number }
  ) => {
    setAiDetectionResult({
      isGarbage: result.isGarbage,
      confidence: result.confidence,
      wasteType: result.wasteType,
      description: result.description,
      pointsEarned: result.pointsEarned,
      imageData,
    });
    setShowCamera(false);

    if (result.isGarbage && result.pointsEarned > 0) {
      await persistReward(result.wasteType || 'recyclable', result.pointsEarned);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-eco mb-2">Scan & Disposal</h1>
        <p className="text-muted-foreground text-lg">
          Use AI to detect and verify your eco-friendly disposal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Detection Only */}
        <Card className="border-eco-light/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-eco">
              <Camera className="h-5 w-5" />
              AI Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
      </div>

      {/* Points Preview */}
      {aiDetectionResult && (
        <Card className="border-eco-light/30 bg-gradient-reward">
          <CardContent className="p-6 text-center">
            <h3 className="text-white font-semibold text-lg mb-2">Points Preview</h3>
            <div className="text-3xl font-bold text-white">
              +{aiDetectionResult.pointsEarned}
              <span className="text-sm ml-2">eco points</span>
            </div>
            <p className="text-white/80 text-sm mt-2">
              AI-verified recyclable waste! 🤖🌱
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