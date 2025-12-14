import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { MapPin } from 'lucide-react';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const MapPicker = ({ location, onLocationChange }) => {
  const [position, setPosition] = useState(location?.latitude && location?.longitude ? 
    { lat: location.latitude, lng: location.longitude } : 
    { lat: 40.7128, lng: -74.0060 } // Default to New York
  );
  const [country, setCountry] = useState(location?.country || '');
  const [address, setAddress] = useState(location?.address || '');
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    if (position) {
      onLocationChange({
        country,
        address,
        latitude: position.lat,
        longitude: position.lng
      });
    }
  }, [position, country, address]);

  const handleSetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setPosition(newPos);
          setMapKey(prev => prev + 1); // Force map re-center
          
          // Reverse geocoding to get address (using Nominatim)
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`)
            .then(res => res.json())
            .then(data => {
              if (data.address) {
                setCountry(data.address.country || '');
                setAddress(data.display_name || '');
              }
            })
            .catch(err => console.error('Geocoding error:', err));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please select manually on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country" data-testid="country-label">Country *</Label>
          <Input
            id="country"
            data-testid="country-input"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g., United States"
            required
            className="h-12 rounded-lg border-slate-200 focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address" data-testid="address-label">Address/Location *</Label>
          <Input
            id="address"
            data-testid="address-input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g., New York, NY"
            required
            className="h-12 rounded-lg border-slate-200 focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label data-testid="map-label">Pin Location on Map *</Label>
          <Button
            type="button"
            onClick={handleSetCurrentLocation}
            data-testid="use-current-location-btn"
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Use Current Location
          </Button>
        </div>
        <p className="text-sm text-slate-600">Click on the map to set the exact location of your ad</p>
        <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200" data-testid="map-container">
          <MapContainer
            key={mapKey}
            center={position}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>
        <p className="text-xs text-slate-500">
          Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </p>
      </div>
    </div>
  );
};

export default MapPicker;