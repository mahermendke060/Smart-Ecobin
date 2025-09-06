import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CameraCaptureProps {
  onImageCaptured: (imageData: string, isGarbage: boolean, confidence: number, pointsEarned: number) => void;
  onClose: () => void;
}

export const CameraCapture = ({ onImageCaptured, onClose }: CameraCaptureProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-garbage', {
        body: { image: imageData }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: 'Analysis Error',
        description: 'Failed to analyze the image. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      
      // Analyze the image
      const analysisResult = await analyzeImage(imageData);
      
      if (analysisResult) {
        onImageCaptured(
          imageData, 
          analysisResult.isGarbage, 
          analysisResult.confidence, 
          analysisResult.pointsEarned
        );
      }
    };
    reader.readAsDataURL(file);
  }, [onImageCaptured, toast]);

  const handleCameraCapture = useCallback(() => {
    // For demo purposes, we'll use file input
    // In a real app, you might use getUserMedia API for camera access
    fileInputRef.current?.click();
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-eco-light/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-eco">
              <Camera className="h-5 w-5" />
              Capture Waste Image
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {capturedImage ? (
            <div className="text-center space-y-4">
              <div className="relative">
                <img 
                  src={capturedImage} 
                  alt="Captured waste" 
                  className="w-full h-48 object-cover rounded-lg border border-eco-light/30"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-eco mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Analyzing image...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {!isAnalyzing && (
                <div className="space-y-2">
                  <Button 
                    onClick={handleCameraCapture}
                    variant="outline"
                    className="w-full border-eco text-eco hover:bg-eco hover:text-white"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Another Photo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-gradient-earth p-8 rounded-lg">
                <Camera className="h-16 w-16 text-eco mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Take a photo of your waste to earn eco points
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Our AI will detect if it's recyclable waste and award points accordingly
                </p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleCameraCapture}
                  className="w-full bg-eco hover:bg-eco-dark"
                  size="lg"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                
                <Button 
                  onClick={handleUploadClick}
                  variant="outline"
                  className="w-full border-eco text-eco hover:bg-eco hover:text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>💡 Tips for better detection:</p>
                <ul className="list-disc list-inside text-left mt-1 space-y-1">
                  <li>Ensure good lighting</li>
                  <li>Focus on the waste item</li>
                  <li>Avoid blurry images</li>
                </ul>
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            capture="environment" // Use rear camera on mobile
          />
        </CardContent>
      </Card>
    </div>
  );
};