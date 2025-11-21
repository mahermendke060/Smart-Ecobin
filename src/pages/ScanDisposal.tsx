import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CameraCapture } from '@/components/CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

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

  // For now, no bin linking is required from frontend for AI-only detections.

  const persistReward = async (wasteType: string, points: number) => {
    if (!user?.id) {
      toast({ title: 'Not signed in', description: 'Please log in to earn points.', variant: 'destructive' });
      return;
    }

    try {
      await apiService.ensureProfile();
      await apiService.createDisposal({ waste_type: wasteType, points_earned: points, bin_id: null });
      await apiService.addPoints(points, true);
      toast({ title: 'Points awarded!', description: `You earned +${points} eco points.` });
    } catch (e: any) {
      console.error('Failed to persist reward', e);
      toast({ title: 'Error', description: e?.message || 'Could not save your points.', variant: 'destructive' });
    }
  };

  const handleImageCaptured = async (
    imageData: string,
    result: { isGarbage: boolean; confidence: number; wasteType: string; description: string; pointsEarned: number; itemName: string }
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
      // Save the detected item name in disposal.waste_type so Recent Activity shows the item
      await persistReward(result.itemName || result.wasteType || 'recyclable', result.pointsEarned);
      // No auto-reload; let the user stay on the page. The dashboard will reflect updates on next visit.
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl space-y-6">

      <div className="px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Detection */}
        <Card className="border-eco-light/30 rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-eco">
              <Camera className="h-5 w-5" />
              AI Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Camera Detection Section (Hero) */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-500 p-8 rounded-2xl text-white shadow relative overflow-hidden">
                <Camera className="h-16 w-16 text-white mx-auto mb-3" />
                <h3 className="text-2xl font-semibold mb-1">Use AI to detect and verify your waste</h3>
                <p className="text-white/90 mb-4">Take a photo or upload an image of your recyclable item</p>
                <div className="flex items-center justify-center">
                  <Button onClick={() => setShowCamera(true)} className="bg-white text-emerald-700 hover:bg-white/90"><Camera className="h-4 w-4 mr-2"/>AI Waste Detection</Button>
                </div>
              </div>

              {/* Result card */}
              {aiDetectionResult && (
                <div className="bg-white rounded-2xl border-2 border-emerald-200 mt-4 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-emerald-700">{aiDetectionResult.isGarbage ? 'Successfully detected!' : 'No recyclable item'}</p>
                      <p className="text-sm text-gray-600">{aiDetectionResult.description}</p>
                    </div>
                    <div className={`text-right ${aiDetectionResult.isGarbage ? 'text-emerald-600' : 'text-gray-500'}`}>
                      <div className="text-sm">Confidence</div>
                      <div className="text-2xl font-bold">{Math.round(aiDetectionResult.confidence * 100)}%</div>
                    </div>
                  </div>
                  {aiDetectionResult.isGarbage && (
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-emerald-700 font-semibold">Category: Recyclable</div>
                      <div className="text-emerald-700 font-bold text-lg">+{aiDetectionResult.pointsEarned} points</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Features row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <div className="rounded-xl p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-sm font-medium">⚡ Instant Results</div>
              <div className="rounded-xl p-4 bg-blue-50 border-2 border-blue-200 text-blue-800 text-sm font-medium">⭐ 95% Accurate</div>
              <div className="rounded-xl p-4 bg-purple-50 border-2 border-purple-200 text-purple-800 text-sm font-medium">🏅 Earn Points</div>
            </div>
          </CardContent>
        </Card>

        {/* Points Criteria beside detection */}
        <Card className="border-eco-light/30 rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-eco">Points Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-sm">Points are based on AI confidence of a recyclable item.</div>
            <div className="p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-yellow-700">&lt;60%</div>
                <div className="text-sm text-yellow-800">5 points awarded</div>
              </div>
              <div className="font-bold text-yellow-700">+5</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-blue-700">60–84%</div>
                <div className="text-sm text-blue-800">10 points awarded</div>
              </div>
              <div className="font-bold text-blue-700">+10</div>
            </div>
            <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-green-700">85–94%</div>
                <div className="text-sm text-green-800">15 points awarded</div>
              </div>
              <div className="font-bold text-green-700">+15</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-purple-700">≥95%</div>
                <div className="text-sm text-purple-800">20 points awarded</div>
              </div>
              <div className="font-bold text-purple-700">+20</div>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700">
              <div className="font-semibold">No Item Detected</div>
              <div className="text-sm">No recyclable item detected → 0 points.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Points Preview */}
      {aiDetectionResult && (
        <Card className="border-eco-light/30 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl shadow-xl mx-4 md:mx-6">
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