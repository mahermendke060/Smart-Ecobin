import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, MapPin, Navigation, Clock, RefreshCw, AlertTriangle, Crosshair, List, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { locationApiService } from '@/services/locationApi';
import { useAuth } from '@/contexts/AuthContext';

interface Bin {
  id: number;
  name: string;
  type: 'general' | 'recycling' | 'organic' | 'hazardous' | string;
  latitude: number;
  longitude: number;
  address?: string;
  capacity: number; // 0-100
  status: 'available' | 'nearly_full' | 'full' | 'maintenance' | string;
  last_updated?: string;
  distance?: number; // computed client-side in km
}

interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

const BinLocator = () => {
  const { user } = useAuth();
  const [bins, setBins] = useState<Bin[]>([]);
  const [filteredBins, setFilteredBins] = useState<Bin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<'km' | 'miles'>('km');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [binType, setBinType] = useState<string>('recycling');
  const [detectedLocation, setDetectedLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const ranOnceRef = useRef(false);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [webhookBins, setWebhookBins] = useState<any[]>([]);
  const [manualQuery, setManualQuery] = useState('');
  const [manualSearching, setManualSearching] = useState(false);

  // Step 1: Auto-request geolocation on first open, then ask user to confirm
  useEffect(() => {
    if (ranOnceRef.current) return;
    ranOnceRef.current = true;
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse geocode for a precise address (fallback to coordinates)
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await resp.json();
          const addr = data?.address || {};
          const addressParts = [
            addr.road,
            addr.neighbourhood || addr.suburb,
            addr.city || addr.town || addr.village,
            addr.state,
            addr.postcode,
            addr.country
          ].filter(Boolean);
          const address = addressParts.join(', ') || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          const loc = { latitude, longitude, address };
          setDetectedLocation(loc);
        } catch {
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          const loc = { latitude, longitude, address };
          setDetectedLocation(loc);
        } finally {
          setLocationLoading(false);
        }
      },
      (geErr) => {
        let msg = 'Unable to get current location';
        if (geErr.code === geErr.PERMISSION_DENIED) msg = 'Location permission denied.';
        if (geErr.code === geErr.POSITION_UNAVAILABLE) msg = 'Location unavailable.';
        if (geErr.code === geErr.TIMEOUT) msg = 'Location request timed out.';
        setError(msg);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    filterBins();
  }, [searchTerm, bins, userLocation, locationConfirmed]);

  const fetchNearbyBins = useCallback(async (lat: number, lng: number, radiusOverride?: number) => {
    setLoading(true);
    setError(null);
    try {
      const effectiveRadius = radiusOverride ?? radiusKm;
      const data = await locationApiService.searchNearbyBins({
        latitude: lat,
        longitude: lng,
        radius_km: effectiveRadius,
        bin_type: binType
      });

      // Compute distance client-side and sort
      const withDistance = data.map((bin, i) => ({
        id: Number((bin as any).id) || i,
        name: (bin as any).name,
        type: (bin as any).type || 'recycling',
        latitude: (bin as any).latitude,
        longitude: (bin as any).longitude,
        address: (bin as any).address,
        capacity: (bin as any).capacity ?? 0,
        status: (bin as any).status || 'available',
        last_updated: (bin as any).last_updated,
        distance: haversineKm(lat, lng, (bin as any).latitude, (bin as any).longitude),
      }));
      withDistance.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
      setBins(withDistance);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Network error while fetching bins';
      setError(message);
      setBins([]);
    } finally {
      setLoading(false);
    }
  }, [radiusKm, binType]);

  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterBins = () => {
    let result = bins;

    // Search filter
    if (searchTerm) {
      result = result.filter(bin =>
        (bin.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bin.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Only show bins not in maintenance
    result = result.filter(bin => bin.status !== 'maintenance');

    // If location confirmed, restrict to selected radius and sort by distance
    if (locationConfirmed && userLocation) {
      result = result
        .map(bin => ({
          ...bin,
          distance: haversineKm(userLocation.latitude, userLocation.longitude, bin.latitude, bin.longitude),
        }))
        .filter((bin: any) => bin.distance <= radiusKm)
        .sort((a: any, b: any) => a.distance - b.distance) as any;
    }

    // If location not confirmed, do not show any default list below (map prompt handles UX)
    if (!locationConfirmed) {
      setFilteredBins([]);
      return;
    }

    setFilteredBins(result as any);
  };

  const getStatusColor = (bin: Bin) => {
    if (bin.status === 'maintenance') return 'bg-gray-400 text-white';
    const cap = Math.max(0, Math.min(100, bin.capacity ?? 0));
    if (cap <= 50) return 'bg-green-500 text-white';
    if (cap <= 75) return 'bg-yellow-500 text-black';
    return 'bg-red-500 text-white';
  };

  const getStatusText = (bin: Bin) => {
    if (bin.status === 'maintenance') return 'Offline';
    const cap = bin.capacity ?? 0;
    return `${cap}% full`;
  };

  const openDirections = (bin: Bin) => {
    const origin = userLocation ? `${userLocation.latitude},${userLocation.longitude}` : '';
    const dest = `${bin.latitude},${bin.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;
    window.open(url, '_blank');
  };

  const handleLocationRequest = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }
    setLocationLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await resp.json();
          const addr = data?.address || {};
          const addressParts = [
            addr.road,
            addr.neighbourhood || addr.suburb,
            addr.city || addr.town || addr.village,
            addr.state,
            addr.postcode,
            addr.country
          ].filter(Boolean);
          const address = addressParts.join(', ') || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setDetectedLocation({ latitude, longitude, address });
        } catch {
          setDetectedLocation({ latitude, longitude, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
        } finally {
          setLocationLoading(false);
        }
      },
      (geErr) => {
        let msg = 'Unable to get current location';
        if (geErr.code === geErr.PERMISSION_DENIED) msg = 'Location permission denied. Use manual location entry.';
        if (geErr.code === geErr.POSITION_UNAVAILABLE) msg = 'Location unavailable.';
        if (geErr.code === geErr.TIMEOUT) msg = 'Location request timed out.';
        setError(msg);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const startRealtime = (initial?: UserLocation) => {
    // Track user movement
    if (navigator.geolocation && watchIdRef.current === null) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserLocation(loc);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
      ) as unknown as number;
    }
    // Periodic bins refresh
    if (refreshTimerRef.current === null) {
      refreshTimerRef.current = window.setInterval(() => {
        const loc = initial || userLocation;
        if (loc) fetchNearbyBins(loc.latitude, loc.longitude, radiusKm);
      }, 30000);
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (refreshTimerRef.current !== null) {
        window.clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  const handleManualSearch = async () => {
    if (!manualQuery.trim()) return;
    try {
      setManualSearching(true);
      setError(null);
      const geo = await locationApiService.geocodeAddress(manualQuery.trim());
      const address = geo.address || manualQuery.trim();
      const loc = { latitude: geo.latitude, longitude: geo.longitude, address };
      setDetectedLocation(loc);
      await handleLocationConfirm(loc);
    } catch (e: any) {
      // Do not show any error; proceed with the raw text as address without coordinates
      const rawAddress = manualQuery.trim();
      const loc = { latitude: 0, longitude: 0, address: rawAddress };
      setDetectedLocation(loc);
      await handleLocationConfirm(loc);
    } finally {
      setManualSearching(false);
    }
  };

  const handleLocationConfirm = async (location: { latitude: number; longitude: number; address: string }) => {
    // Set confirmation state and only start proximity features if we have real coordinates
    setUserLocation({ latitude: location.latitude, longitude: location.longitude, address: location.address });
    setLocationConfirmed(true);
    const hasRealCoords = Number(location.latitude) !== 0 || Number(location.longitude) !== 0;
    if (hasRealCoords) {
      fetchNearbyBins(location.latitude, location.longitude, radiusKm);
      startRealtime({ latitude: location.latitude, longitude: location.longitude });
    }
    // Send to n8n webhook after explicit user confirmation and wait for it
    await postToWebhook(location.latitude, location.longitude, location.address);
  };

  const postToWebhook = async (latitude: number, longitude: number, address?: string) => {
    try {
      setWebhookStatus('sending');
      setWebhookBins([]);
      const res = await fetch('https://n8n.aiqure.in/webhook/5f4abb62-a6fa-447a-b98a-e4b6521d534f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude, address }),
      });
      if (!res.ok) throw new Error(`Webhook error: ${res.status}`);
      // Try to parse bins coming back from webhook
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }
      if (payload) {
        // Normalize to array
        let items: any[] = [];
        if (Array.isArray(payload)) items = payload;
        else if (Array.isArray(payload?.bins)) items = payload.bins;

        // If the response contains raw HTML blocks, keep them as-is in webhookBins
        // Otherwise, keep previous mapping behavior
        if (items.length > 0 && typeof items[0]?.html === 'string') {
          setWebhookBins(items);
        } else {
          // Compute distance if coordinates present
          if (userLocation && Array.isArray(items)) {
            items = items.map((b: any, i: number) => ({
              ...b,
              id: Number(b?.id) || i,
              distance: typeof b?.latitude === 'number' && typeof b?.longitude === 'number'
                ? haversineKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude)
                : undefined,
            }));
          }
          setWebhookBins(items);
        }
      } else {
        setWebhookBins([]);
      }
      setWebhookStatus('success');
    } catch (e) {
      console.error(e);
      setWebhookStatus('error');
    }
  };

  const distanceLabel = (km?: number) => {
    if (km == null) return '';
    if (units === 'km') return `${km.toFixed(1)} km away`;
    const miles = km * 0.621371;
    return `${miles.toFixed(1)} mi away`;
  };

  const getDirectionsUrl = (item: any): string | null => {
    const direct = item?.directionsUrl || item?.link || item?.url;
    if (typeof direct === 'string' && direct.trim()) return direct;
    if (typeof item?.latitude === 'number' && typeof item?.longitude === 'number') {
      const origin = userLocation ? `${userLocation.latitude},${userLocation.longitude}` : '';
      const dest = `${item.latitude},${item.longitude}`;
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`;
    }
    if (typeof item?.address === 'string' && item.address.trim()) {
      // Fallback to a Google Maps search by address
      const query = item.address.trim();
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }
    return null;
  };

  const onHtmlItemClick = (item: any) => (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement | null;
    const anchor = el ? (el.closest && el.closest('a')) as HTMLAnchorElement | null : null;
    if (!anchor) return; // Not a link click, ignore
    const rawHref = anchor.getAttribute('href') || '';
    const invalid = !rawHref || rawHref === '#' || rawHref === 'undefined' || rawHref === 'null';
    e.preventDefault();
    const computed = invalid ? getDirectionsUrl(item) : rawHref;
    if (computed) window.open(computed, '_blank');
  };

  useEffect(() => {
    if (locationConfirmed && userLocation) {
      fetchNearbyBins(userLocation.latitude, userLocation.longitude, radiusKm);
    }
  }, [radiusKm, binType, locationConfirmed, userLocation]);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl">

      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!locationConfirmed && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-6 border-t-4 border-emerald-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-100 rounded-full"><MapPin className="w-6 h-6 text-emerald-600"/></div>
              <h2 className="text-2xl font-bold text-gray-800">Choose location</h2>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 mb-4 border-2 border-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-emerald-600"/> Use current location
                  </h3>
                  <p className="text-sm text-gray-600">We will detect your device location and ask you to confirm</p>
                  {detectedLocation && (
                    <div className="mt-3 text-left">
                      <div className="text-sm text-gray-700 mb-2">Detected: {detectedLocation.address || `${detectedLocation.latitude.toFixed(6)}, ${detectedLocation.longitude.toFixed(6)}`}</div>
                      <Button size="sm" onClick={() => handleLocationConfirm({ latitude: detectedLocation.latitude, longitude: detectedLocation.longitude, address: detectedLocation.address || `${detectedLocation.latitude}, ${detectedLocation.longitude}` })}>Confirm this location</Button>
                    </div>
                  )}
                </div>
                <Button onClick={handleLocationRequest} disabled={locationLoading} className={`sm:w-auto ${locationLoading ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                  <Crosshair className={`h-4 w-4 mr-2 ${locationLoading ? 'animate-spin' : ''}`} />
                  {locationLoading ? 'Detecting…' : 'Detect'}
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600"/> Type an address
              </h3>
              <div className="flex gap-3">
                <Input placeholder="Enter area, address, or city" value={manualQuery} onChange={(e) => setManualQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleManualSearch(); }} className="flex-grow"/>
                <Button onClick={handleManualSearch} disabled={manualSearching || !manualQuery.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                  {manualSearching ? (<span className="inline-flex items-center"><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Locating…</span>) : ('Confirm')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {locationConfirmed && userLocation && (
          <div className="bg-emerald-100 border-2 border-emerald-400 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle className="w-5 h-5"/>
              <span className="font-semibold">{userLocation.address || `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`}</span>
            </div>
            <div className="text-xs text-emerald-700">
              {webhookStatus === 'sending' && 'Processing…'}
              {webhookStatus === 'success' && 'Location submitted'}
              {webhookStatus === 'error' && 'Submission failed'}
            </div>
            <Button variant="outline" size="sm" onClick={() => { setLocationConfirmed(false); setManualQuery(userLocation.address || ''); setWebhookBins([]); setWebhookStatus('idle'); }}>Change</Button>
          </div>
        )}

        {showMap && webhookBins.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6 border-t-4 border-emerald-500">
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl h-80 flex items-center justify-center border-2 border-emerald-300">
              <div className="text-center">
                <List className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-emerald-800 font-semibold">Interactive Map View</p>
                <p className="text-emerald-600 text-sm">Showing {webhookBins.length} nearby bins</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 border-t-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 rounded-full"><List className="w-6 h-6 text-emerald-600"/></div>
            <h2 className="text-2xl font-bold text-gray-800">Recommended bins</h2>
          </div>

          {webhookStatus === 'sending' && (
            <div className="text-sm text-muted-foreground inline-flex items-center mb-4">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin"/> Loading recommendations…
            </div>
          )}

          {(!webhookBins || webhookBins.length === 0) && webhookStatus !== 'sending' ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-emerald-600"/>
              </div>
              <p className="text-gray-500 text-lg">No recommendations yet.</p>
              <p className="text-gray-400 text-sm mt-2">Choose a location to find nearby recycling bins</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {webhookBins.map((item: any, index: number) => (
                typeof item?.html === 'string' ? (
                  <div key={index} onClick={onHtmlItemClick(item)} dangerouslySetInnerHTML={{ __html: item.html }} />
                ) : (
                  <div key={item.id ?? index} className="bg-gradient-to-r from-white to-emerald-50 rounded-2xl p-6 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-grow min-w-0">
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md">
                          <MapPin className="w-6 h-6"/>
                        </div>
                        <div className="flex-grow min-w-0">
                          <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{item.name || 'Bin'}</h3>
                          <p className="text-sm text-gray-600 mb-2 truncate">{item.address || (typeof item.latitude === 'number' && typeof item.longitude === 'number' ? `${item.latitude}, ${item.longitude}` : '')}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {item.type && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">{item.type}</span>}
                            {item.hours && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">{item.hours}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <div className="text-2xl font-bold text-emerald-600">{typeof item.distance === 'number' ? (units === 'km' ? `${item.distance.toFixed(1)} km` : `${(item.distance*0.621371).toFixed(1)} mi`) : ''}</div>
                        <Button className="mt-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => { const url = getDirectionsUrl(item); if (url) window.open(url, '_blank'); }}>Directions</Button>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BinLocator;