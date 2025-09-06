import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, X, Crosshair } from 'lucide-react';

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationConfirm: (location: { latitude: number; longitude: number; address: string }) => void;
}

const LocationSelector = ({ isOpen, onClose, onLocationConfirm }: LocationSelectorProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      
      // Get address from coordinates
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      
      const address = [
        data.locality || data.city,
        data.principalSubdivision,
        data.countryName
      ].filter(Boolean).join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      setSelectedLocation({ latitude, longitude, address });
    } catch (error) {
      console.error('Error getting location:', error);
    }
    setIsGettingLocation(false);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationConfirm(selectedLocation);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] p-0">
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Select your location</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Map Tabs */}
          <div className="p-4 pb-2">
            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
              <button className="px-4 py-2 bg-white rounded shadow-sm text-sm font-medium">
                Map
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600">
                Satellite
              </button>
            </div>
          </div>

          {/* Map Area */}
          <div className="px-4 pb-4">
            <div className="h-64 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative">
              <div className="text-center">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-gray-600 mb-4">Interactive map would appear here</p>
                <Button 
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="mb-2"
                >
                  <Crosshair className={`h-4 w-4 mr-2 ${isGettingLocation ? 'animate-spin' : ''}`} />
                  {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </Button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search for location"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Crosshair className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected Location */}
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
              YOUR SELECTED LOCATION:
            </p>
            <p className="text-sm text-gray-800 min-h-[20px]">
              {selectedLocation ? selectedLocation.address : 'Click on the map to select a location'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-4 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-teal-600 hover:bg-teal-700" 
              onClick={handleConfirm}
              disabled={!selectedLocation}
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationSelector;