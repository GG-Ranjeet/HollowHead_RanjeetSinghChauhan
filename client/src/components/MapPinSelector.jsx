import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geohashForLocation } from 'geofire-common';
import { Search } from 'lucide-react';

// Fix for default Leaflet marker icon in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A component to center map on new coordinates
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Draggable Marker Component
function DraggableMarker({ position, setPosition }) {
  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition([newPos.lat, newPos.lng]);
        }
      },
    }),
    [setPosition],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

const MapPinSelector = ({ onLocationSelect, initialPosition = [26.8467, 80.9462] }) => {
  const [position, setPosition] = useState(initialPosition);
  const [searchStr, setSearchStr] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // When position changes, generate Geohash and notify parent
  useEffect(() => {
    const lat = position[0];
    const lng = position[1];
    const hash = geohashForLocation([lat, lng]);
    // For a production app, we would reverse-geocode to get addressString here 
    // Using Nominatim or Google Geocoding API. 
    // Here we'll pass a dummy string that the user can edit or we keep simple
    onLocationSelect({
      latitude: lat,
      longitude: lng,
      geohash: hash,
      addressString: `Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    });
  }, [position]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerSearch = async () => {
    if (!searchStr) return;
    setIsSearching(true);
    try {
      // Basic free Nominatim API for geocoding
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchStr)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        alert("Location not found");
      }
    } catch (error) {
      console.error("Geocoding error", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch();
    }
  };

  return (
    <div className="map-selector-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={searchStr}
          onChange={(e) => setSearchStr(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search location (e.g. BBDU Lucknow)" 
          style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-main)', outline: 'none' }}
        />
        <button type="button" onClick={triggerSearch} disabled={isSearching} style={{ padding: '0.75rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} /> {isSearching ? "..." : "Search"}
        </button>
      </div>
      
      <div style={{ height: '350px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={position} />
          <DraggableMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Drag the pin to set exact location.</p>
    </div>
  );
};

export default MapPinSelector;
