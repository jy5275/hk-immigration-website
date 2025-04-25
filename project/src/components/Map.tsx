import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface MapProps {
  selectedPoints: string[];
}

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Hong Kong bounds
const HK_BOUNDS: L.LatLngBoundsExpression = [
  [22.1193, 113.8198], // Southwest corner
  [22.6193, 114.4407]  // Northeast corner
];

// Control point coordinates (actual lat/lng)
const controlPointCoordinates: Record<string, [number, number]> = {
  "Lo Wu": [22.5295, 114.1135],
  "Lok Ma Chau Spur Line": [22.5147, 114.0654],
  "Airport": [22.3156, 113.9348],
  "Shenzhen Bay": [22.4828, 113.9461],
  "Hong Kong-Zhuhai-Macao Bridge": [22.3181, 113.9512],
  "Express Rail Link West Kowloon": [22.3042, 114.1649],
  "Heung Yuen Wai": [22.5529, 114.1538],
  "Lok Ma Chau": [22.5095, 114.0740],
  "Macau Ferry Terminal": [22.2889, 114.1520],
  "Man Kam To": [22.5371, 114.1295],
  "China Ferry Terminal": [22.2991, 114.1664],
  "Kai Tak Cruise Terminal": [22.3060, 114.2135],
  "Harbour Control": [22.2885, 114.1557],
  "Sha Tau Kok": [22.5491, 114.2233]
};

// Component to handle bounds update and restrictions
const BoundsUpdater: React.FC<{ points: string[] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    // Set max bounds to Hong Kong area
    map.setMaxBounds(HK_BOUNDS);
    
    if (points.length === 0) {
      // If no points selected, show all of Hong Kong
      map.fitBounds(HK_BOUNDS, {
        padding: [50, 50],
        maxZoom: 13
      });
      return;
    }

    const bounds = L.latLngBounds(
      points.map(point => controlPointCoordinates[point])
    );
    
    map.fitBounds(bounds, { 
      padding: [50, 50],
      maxZoom: 13 
    });
  }, [points, map]);

  return null;
};

const Map: React.FC<MapProps> = ({ selectedPoints }) => {
  const center: [number, number] = [22.3193, 114.1694];
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Control Points Map</h2>
      <div className="h-[300px] w-full rounded-lg overflow-hidden">
        <MapContainer 
          center={center} 
          zoom={11} 
          className="h-full w-full"
          minZoom={9}
          maxZoom={14}
          maxBounds={HK_BOUNDS}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <BoundsUpdater points={selectedPoints} />
          {selectedPoints.map((point) => (
            <Marker
              key={point}
              position={controlPointCoordinates[point]}
            >
              <Popup>
                <span className="font-medium">{point}</span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Map;