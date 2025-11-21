import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface CameraCaptureProps {
  onImageCaptured: (
    imageData: string,
    result: {
      isGarbage: boolean;
      confidence: number;
      wasteType: string;
      description: string;
      pointsEarned: number;
      itemName: string;
    }
  ) => void;
  onClose: () => void;
}

export const CameraCapture = ({ onImageCaptured, onClose }: CameraCaptureProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const dataUrlToBlob = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const analyzeImage = async (imageData: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast({ title: 'Not signed in', description: 'Please log in to use AI detection.', variant: 'destructive' });
      return;
    }
    setIsAnalyzing(true);
    try {
      // Strip header and send pure base64 to backend
      const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const data = await apiService.detectWaste(base64);

      // Expecting response with detected items
      // Backend returns WasteDetectionResponse with detected_items
      const items: Array<{ bin_type: string; item: string; confidence: number; disposal_method: string; }> = data?.detected_items || [];
      const recyclable = items.find((i) => i.bin_type === 'recycling');
      const isGarbage = !!recyclable;
      const confidence = recyclable ? recyclable.confidence : (items[0]?.confidence ?? 0.5);
      const wasteType = recyclable ? 'recyclable' : (items[0]?.bin_type ?? 'general');
      const description = recyclable ? `Detected ${recyclable.item}.` : 'No recyclable waste confidently detected.';
      const itemName = recyclable?.item || items[0]?.item || (wasteType === 'recycling' ? 'Recyclable Item' : 'Item');
      // Quantize points to 5/10/15/20 buckets based on confidence
      const bucketPoints = (c: number) => {
        if (c >= 0.95) return 20;
        if (c >= 0.85) return 15;
        if (c >= 0.60) return 10;
        return 5;
      };
      const pointsEarned = isGarbage ? bucketPoints(confidence || 0.5) : 0;

      onImageCaptured(imageData, {
        isGarbage,
        confidence,
        wasteType,
        description,
        pointsEarned,
        itemName
      });
    } catch (e: any) {
      console.error('Detection failed', e);
      toast({ title: 'Detection failed', description: e?.message || 'Please try again.', variant: 'destructive' });
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
        onImageCaptured(imageData, {
          isGarbage: analysisResult.isGarbage,
          confidence: analysisResult.confidence,
          wasteType: analysisResult.wasteType,
          description: analysisResult.description,
          pointsEarned: analysisResult.pointsEarned,
        });
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