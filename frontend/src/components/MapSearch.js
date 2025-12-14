import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 11);
    }
  }, [center, map]);
  return null;
};

const MapSearch = ({ onLocationChange, country }) => {
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default NY
  const [radius, setRadius] = useState([10]); // Default 10km
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // When radius changes, notify parent
    if (center) {
      onLocationChange({
        latitude: center.lat,
        longitude: center.lng,
        radius: radius[0]
      });
    }
  }, [center, radius]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Use Nominatim geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setCenter({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to search location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label data-testid="location-search-label">Search Location</Label>
        <div className="flex gap-2">
          <Input
            data-testid="location-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g., New York, London, Tokyo"
            className="h-12 rounded-lg flex-1"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            data-testid="search-location-btn"
            className="bg-primary text-white hover:bg-primary/90 h-12 px-6 rounded-full font-medium transition-all active:scale-95 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label data-testid="radius-label">Search Radius: {radius[0]} km</Label>
        <Slider
          data-testid="radius-slider"
          value={radius}
          onValueChange={setRadius}
          min={1}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      <div className="h-[300px] rounded-xl overflow-hidden border border-slate-200" data-testid="search-map-container">
        <MapContainer
          center={center}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={center}
            radius={radius[0] * 1000} // Convert km to meters
            pathOptions={{
              color: '#f97316',
              fillColor: '#f97316',
              fillOpacity: 0.2
            }}
          />
          <MapUpdater center={center} />
        </MapContainer>
      </div>

      <p className="text-xs text-slate-500">
        Searching within {radius[0]}km of: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
      </p>
    </div>
  );
};

export default MapSearch;