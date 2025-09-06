import { useEffect, useState } from 'react';
import { Search, MapPin, Navigation, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SimpleMap from '@/components/SimpleMap';
import LocationSelector from '@/components/LocationSelector';

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
  address?: string;
}

const BinLocator = () => {
  const [bins, setBins] = useState<Bin[]>([]);
  const [filteredBins, setFilteredBins] = useState<Bin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  useEffect(() => {
    fetchBins();
  }, []);

  useEffect(() => {
    filterBins();
  }, [searchTerm, bins]);

  const fetchBins = async () => {
    try {
      const { data, error } = await supabase
        .from('bins')
        .select('*')
        .order('location');

      if (error) {
        console.error('Error fetching bins:', error);
        toast.error('Failed to fetch bins');
      } else {
        setBins(data || []);
      }
    } catch (error) {
      console.error('Error fetching bins:', error);
      toast.error('Failed to fetch bins');
    } finally {
      setLoading(false);
    }
  };

  const filterBins = () => {
    if (!searchTerm) {
      setFilteredBins(bins);
    } else {
      const filtered = bins.filter(bin =>
        bin.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bin.bin_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBins(filtered);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-eco text-white';
      case 'full':
        return 'bg-destructive text-destructive-foreground';
      case 'maintenance':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return '🟢';
      case 'full':
        return '🔴';
      case 'maintenance':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const openDirections = (bin: Bin) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${bin.latitude},${bin.longitude}`;
    window.open(url, '_blank');
  };

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationLoading(false);
        }
      );
    }
  };

  const handleLocationConfirm = (location: { latitude: number; longitude: number; address: string }) => {
    setUserLocation({ 
      latitude: location.latitude, 
      longitude: location.longitude,
      address: location.address 
    });
    setLocationConfirmed(true);
    toast.success('Location confirmed!');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-muted rounded mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-eco mb-2">Bin Locator</h1>
        <p className="text-muted-foreground text-lg">
          Find the nearest available smart bins for your eco-friendly disposal
        </p>
      </div>

      {/* Search Bar - Only show after location is confirmed */}
      {locationConfirmed && (
        <Card className="border-eco-light/30">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by location or bin ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-eco-light/50 focus:border-eco"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Selection / Map Section */}
      <Card className="border-eco-light/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-eco">
            <MapPin className="h-5 w-5" />
            Find Smart Bins
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Locate the nearest smart bins and check their availability in real-time
          </p>
        </CardHeader>
        <CardContent className="p-4">
          {!locationConfirmed ? (
            <div className="h-96 flex flex-col items-center justify-center text-center space-y-4">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-xl font-semibold text-gray-800">Find Nearby Smart Bins</h3>
              <p className="text-gray-600 max-w-md">
                Share your location to discover the closest smart bins and check their real-time availability
              </p>
              <Button 
                onClick={() => setShowLocationSelector(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3"
                size="lg"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Select Location
              </Button>
            </div>
          ) : (
            <div className="h-96">
              <SimpleMap 
                bins={filteredBins} 
                userLocation={userLocation}
                onLocationRequest={handleLocationRequest}
                locationLoading={locationLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bins List - Only show after location is confirmed */}
      {locationConfirmed && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-eco">
              Nearby Smart Bins ({filteredBins.length} found)
            </h2>
            <div className="flex gap-2 text-sm">
              <span>🟢 Available</span>
              <span>🔴 Full</span>
              <span>🟡 Maintenance</span>
            </div>
          </div>

          {userLocation && userLocation.address && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-blue-900">Your Location</p>
                    <p className="text-sm text-blue-700">{userLocation.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {filteredBins.length === 0 ? (
            <Card className="border-eco-light/30">
              <CardContent className="p-8 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No bins found matching your search.' : 'No smart bins found in your area.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(userLocation 
                ? filteredBins
                    .map(bin => ({
                      ...bin,
                      distance: Math.sqrt(
                        Math.pow(bin.latitude - userLocation.latitude, 2) + 
                        Math.pow(bin.longitude - userLocation.longitude, 2)
                      ) * 111 // Rough conversion to km
                    }))
                    .sort((a, b) => a.distance - b.distance)
                : filteredBins
              ).map((bin) => (
                <Card key={bin.id} className="border-eco-light/30 hover:shadow-eco transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getStatusIcon(bin.status)}</span>
                          <div>
                            <h3 className="font-semibold text-eco">{bin.bin_id}</h3>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {bin.location}
                            </p>
                            {userLocation && 'distance' in bin && (
                              <p className="text-xs text-blue-600">
                                ~{(bin as any).distance.toFixed(1)} km away
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(bin.status)}>
                            {bin.status.charAt(0).toUpperCase() + bin.status.slice(1)}
                          </Badge>
                          {bin.status === 'available' && (
                            <span className="text-sm text-eco flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Available 24/7
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDirections(bin)}
                          className="border-eco text-eco hover:bg-eco hover:text-white"
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Directions
                        </Button>
                        {bin.status === 'available' && (
                          <Badge variant="secondary" className="text-xs text-center">
                            Ready to use
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <LocationSelector 
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationConfirm={handleLocationConfirm}
      />
    </div>
  );
};

export default BinLocator;