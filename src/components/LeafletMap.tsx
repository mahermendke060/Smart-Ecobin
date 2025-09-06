import { useEffect, useState, Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Crosshair } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Bin {
  id: string;
  bin_id: string;
  location: string;
  status: string;
  latitude: number;
  longitude: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface LeafletMapProps {
  bins: Bin[];
  onBinSelect?: (bin: Bin) => void;
}

// Lazy load the actual map component
const LazyMapComponent = lazy(() => import('./LeafletMapInternal'));

export const LeafletMap = ({ bins, onBinSelect }: LeafletMapProps) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(location);
          toast({
            title: 'Location Found',
            description: 'Your current location has been detected!',
          });
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'Location Error',
            description: 'Unable to get your location. Please check permissions.',
            variant: 'destructive',
          });
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast({
        title: 'Location Not Supported',
        description: 'Geolocation is not supported by this browser.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border border-eco-light/30">
      <Suspense 
        fallback={
          <div className="flex items-center justify-center h-full bg-muted/20">
            <div className="text-center">
              <div className="animate-pulse">
                <MapPin className="h-12 w-12 text-eco mx-auto mb-4" />
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            </div>
          </div>
        }
      >
        <LazyMapComponent 
          bins={bins} 
          onBinSelect={onBinSelect}
          userLocation={userLocation}
          onLocationRequest={getUserLocation}
          locationLoading={loading}
        />
      </Suspense>
    </div>
  );
};