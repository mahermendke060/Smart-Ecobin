import { apiService } from './api';

export interface BinLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  type: string;
  distance: number;
  phone: string;
  hours: string;
  website: string;
}

export interface LocationRequest {
  latitude: number;
  longitude: number;
  radius_km?: number;
  bin_type?: string;
}

export interface AddressRequest {
  address: string;
}

export interface GeocodeResponse {
  address: string;
  latitude: number;
  longitude: number;
}

export interface BinTypesResponse {
  bin_types: Array<{
    value: string;
    label: string;
  }>;
}

class LocationApiService {
  private baseUrl = 'http://localhost:8000/api/location';

  async searchNearbyBins(request: LocationRequest): Promise<BinLocation[]> {
    const response = await apiService.post(`${this.baseUrl}/search-nearby-bins`, request);
    return response.data;
  }

  async searchBinsByParams(
    latitude: number,
    longitude: number,
    radius_km: number = 5,
    bin_type: string = 'recycling'
  ): Promise<{ bins: BinLocation[]; count: number }> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius_km: radius_km.toString(),
      bin_type: bin_type
    });

    const response = await apiService.get(`${this.baseUrl}/search-bins?${params}`);
    return response.data;
  }

  async geocodeAddress(address: string): Promise<GeocodeResponse> {
    const response = await apiService.post(`${this.baseUrl}/geocode`, { address });
    return response.data;
  }

  async getBinTypes(): Promise<BinTypesResponse> {
    const response = await apiService.get(`${this.baseUrl}/bin-types`);
    return response.data;
  }

  // Get user's current location using browser geolocation API
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationApiService = new LocationApiService();
