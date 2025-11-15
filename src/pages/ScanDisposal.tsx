import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CameraCapture } from '@/components/CameraCapture';

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