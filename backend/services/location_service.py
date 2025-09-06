import os
import logging
from typing import List, Dict, Optional, Tuple
import httpx
from fastapi import HTTPException

try:
    from serpapi import GoogleSearch
    SERPAPI_AVAILABLE = True
except ImportError:
    SERPAPI_AVAILABLE = False
    GoogleSearch = None

logger = logging.getLogger(__name__)

class LocationService:
    def __init__(self):
        self.serpapi_key = os.getenv("SERPAPI_KEY")
        if not self.serpapi_key or self.serpapi_key == "your_serpapi_key_here":
            logger.warning("SerpAPI key not configured. Location search will be limited.")
    
    async def search_nearby_bins(
        self, 
        latitude: float, 
        longitude: float, 
        radius_km: int = 5,
        bin_type: str = "recycling"
    ) -> List[Dict]:
        """
        Search for nearby recycling bins using SerpAPI Google Maps search
        """
        try:
            if not SERPAPI_AVAILABLE or not self.serpapi_key or self.serpapi_key == "your_serpapi_key_here":
                # Return mock data if SerpAPI not available or API key not configured
                return self._get_mock_bins(latitude, longitude)
            
            # Construct search query
            query = f"{bin_type} bins near {latitude},{longitude}"
            
            params = {
                "engine": "google_maps",
                "q": query,
                "ll": f"@{latitude},{longitude},{radius_km}km",
                "type": "search",
                "api_key": self.serpapi_key
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            
            bins = []
            if "local_results" in results:
                for result in results["local_results"][:10]:  # Limit to 10 results
                    bin_info = {
                        "id": result.get("place_id", f"bin_{len(bins)}"),
                        "name": result.get("title", "Recycling Bin"),
                        "address": result.get("address", "Address not available"),
                        "latitude": result.get("gps_coordinates", {}).get("latitude", latitude),
                        "longitude": result.get("gps_coordinates", {}).get("longitude", longitude),
                        "rating": result.get("rating", 0),
                        "type": bin_type,
                        "distance": self._calculate_distance(
                            latitude, longitude,
                            result.get("gps_coordinates", {}).get("latitude", latitude),
                            result.get("gps_coordinates", {}).get("longitude", longitude)
                        ),
                        "phone": result.get("phone", ""),
                        "hours": result.get("hours", ""),
                        "website": result.get("website", "")
                    }
                    bins.append(bin_info)
            
            # Sort by distance
            bins.sort(key=lambda x: x["distance"])
            return bins
            
        except Exception as e:
            logger.error(f"Error searching for nearby bins: {str(e)}")
            # Return mock data as fallback
            return self._get_mock_bins(latitude, longitude)
    
    async def get_location_from_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Get latitude and longitude from address using SerpAPI
        """
        try:
            if not SERPAPI_AVAILABLE or not self.serpapi_key or self.serpapi_key == "your_serpapi_key_here":
                logger.warning("SerpAPI key not configured for geocoding")
                return None
            
            params = {
                "engine": "google_maps",
                "q": address,
                "type": "search",
                "api_key": self.serpapi_key
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            
            if "place_results" in results and "gps_coordinates" in results["place_results"]:
                coords = results["place_results"]["gps_coordinates"]
                return (coords["latitude"], coords["longitude"])
            
            return None
            
        except Exception as e:
            logger.error(f"Error geocoding address: {str(e)}")
            return None
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points using Haversine formula
        Returns distance in kilometers
        """
        import math
        
        # Convert latitude and longitude from degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        return c * r
    
    def _get_mock_bins(self, latitude: float, longitude: float) -> List[Dict]:
        """
        Return mock bin data when SerpAPI is not available
        """
        mock_bins = [
            {
                "id": "mock_bin_1",
                "name": "Central Recycling Station",
                "address": "123 Main Street",
                "latitude": latitude + 0.001,
                "longitude": longitude + 0.001,
                "rating": 4.5,
                "type": "recycling",
                "distance": 0.2,
                "phone": "+1-555-0123",
                "hours": "24/7",
                "website": ""
            },
            {
                "id": "mock_bin_2",
                "name": "Community Waste Center",
                "address": "456 Oak Avenue",
                "latitude": latitude - 0.002,
                "longitude": longitude + 0.003,
                "rating": 4.2,
                "type": "general",
                "distance": 0.5,
                "phone": "+1-555-0456",
                "hours": "6:00 AM - 10:00 PM",
                "website": ""
            },
            {
                "id": "mock_bin_3",
                "name": "Green Earth Disposal",
                "address": "789 Pine Street",
                "latitude": latitude + 0.003,
                "longitude": longitude - 0.001,
                "rating": 4.8,
                "type": "organic",
                "distance": 0.8,
                "phone": "+1-555-0789",
                "hours": "7:00 AM - 9:00 PM",
                "website": "https://greenearth.example.com"
            }
        ]
        return mock_bins

# Global instance
location_service = LocationService()
