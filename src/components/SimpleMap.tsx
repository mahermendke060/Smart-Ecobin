import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Crosshair } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface SimpleMapProps {
  bins: Bin[];
  onBinSelect?: (bin: Bin) => void;
  userLocation: UserLocation | null;
  onLocationRequest: () => void;
  locationLoading: boolean;
}

const SimpleMap = ({ bins, onBinSelect, userLocation, onLocationRequest, locationLoading }: SimpleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'full':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return '✅';
      case 'full':
        return '🚫';
      case 'maintenance':
        return '🔧';
      default:
        return '❓';
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  const getNearbyBins = () => {
    if (!userLocation) return [];
    
    return bins
      .map(bin => ({
        ...bin,
        distance: calculateDistance(userLocation.latitude, userLocation.longitude, bin.latitude, bin.longitude)
      }))
      .sort((a, b) => a.distance - b.distance); // Show all nearby bins, sorted by distance
  };

  const [locationText, setLocationText] = useState<string>('');

  const getUserLocationText = async () => {
    if (!userLocation) return null;
    
    try {
      // Use a free reverse geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&localityLanguage=en`
      );
      const data = await response.json();
      
      const address = [
        data.locality || data.city,
        data.principalSubdivision,
        data.countryName
      ].filter(Boolean).join(', ');
      
      setLocationText(address || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`);
    } catch (error) {
      setLocationText(`${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`);
    }
  };

  useEffect(() => {
    if (userLocation) {
      getUserLocationText();
    }
  }, [userLocation]);

  const openDirections = (bin: Bin) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${bin.latitude},${bin.longitude}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Calculate center
    let centerLat = 40.7128;
    let centerLng = -74.0060;

    if (userLocation) {
      centerLat = userLocation.latitude;
      centerLng = userLocation.longitude;
    } else if (bins.length > 0) {
      centerLat = bins.reduce((sum, bin) => sum + bin.latitude, 0) / bins.length;
      centerLng = bins.reduce((sum, bin) => sum + bin.longitude, 0) / bins.length;
    }

    // Create simple map using embedded OpenStreetMap
    const mapURL = `https://www.openstreetmap.org/export/embed.html?bbox=${centerLng-0.01},${centerLat-0.01},${centerLng+0.01},${centerLat+0.01}&layer=mapnik`;
    
    mapRef.current.innerHTML = `
      <div class="relative w-full h-full">
        <iframe
          width="100%"
          height="100%"
          frameborder="0"
          scrolling="no"
          marginheight="0"
          marginwidth="0"
          src="${mapURL}"
          style="border: none; border-radius: 8px;">
        </iframe>
      </div>
    `;
  }, [bins, userLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Bin List Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white p-3 rounded-lg shadow-lg max-w-xs max-h-80 overflow-y-auto">
        <h4 className="font-semibold text-sm mb-2">
          {userLocation ? 'Nearby Smart Bins' : 'Available Smart Bins'}
        </h4>
        {userLocation && (
          <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
            <div className="font-medium text-blue-700">Your Location:</div>
            <div className="text-blue-600">{locationText}</div>
          </div>
        )}
        {userLocation && getNearbyBins().length === 0 && (
          <div className="text-center text-gray-500 text-xs py-4">
            No smart bins found in your area
          </div>
        )}
        <div className="space-y-2">
          {getNearbyBins().map((bin) => (
            <div key={bin.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
              <div>
                <div className="font-medium">{bin.bin_id}</div>
                <div className="text-gray-600 truncate max-w-24">{bin.location}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`px-1 py-0.5 rounded text-xs text-white ${getStatusColor(bin.status)}`}>
                    {getStatusIcon(bin.status)}
                  </span>
                  <span className="text-xs text-gray-500">{bin.status}</span>
                  {'distance' in bin && (
                    <span className="text-xs text-blue-600 ml-1">
                      {(bin as any).distance.toFixed(1)}km
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  onClick={() => openDirections(bin)}
                  size="sm"
                  variant="outline"
                  className="text-xs h-6 px-2"
                >
                  <Navigation className="h-3 w-3" />
                </Button>
                {onBinSelect && (
                  <Button
                    onClick={() => onBinSelect(bin)}
                    size="sm"
                    className="text-xs h-6 px-2"
                  >
                    <MapPin className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Location Request Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={onLocationRequest}
          disabled={locationLoading}
          size="sm"
          variant="secondary"
          className="shadow-lg"
        >
          <Crosshair className={`h-4 w-4 mr-2 ${locationLoading ? 'animate-spin' : ''}`} />
          {locationLoading ? 'Getting Location...' : 'My Location'}
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white p-3 rounded-lg shadow-lg">
        <h4 className="font-semibold text-sm mb-2">Bin Status</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Full</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Maintenance</span>
          </div>
          {userLocation && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Your Location</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleMap;