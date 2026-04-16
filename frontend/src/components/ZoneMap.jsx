import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Approximate city center coordinates
const CITY_COORDS = {
  'Mumbai': [19.0760, 72.8777],
  'Delhi': [28.7041, 77.1025],
  'Bengaluru': [12.9716, 77.5946],
  'Chennai': [13.0827, 80.2707],
  'Hyderabad': [17.3850, 78.4867],
};

// Approximate relative offsets for zones to visually place them inside the city
const ZONE_OFFSETS = {
  'Bandra': [0.03, -0.04], 'Andheri': [0.08, -0.02], 'Powai': [0.09, 0.02], 'Dadar': [0.01, -0.03], 'Lower Parel': [-0.01, -0.05],
  'Connaught Place': [0, 0], 'Lajpat Nagar': [-0.05, 0.02], 'Dwarka': [-0.03, -0.1], 'Saket': [-0.08, 0.03], 'Noida': [-0.05, 0.15],
  'Koramangala': [-0.05, 0.03], 'Indiranagar': [-0.01, 0.05], 'Whitefield': [0.01, 0.15], 'Jayanagar': [-0.06, 0.01], 'HSR Layout': [-0.07, 0.04],
  'T. Nagar': [-0.02, -0.02], 'Anna Nagar': [0.03, -0.04], 'Velachery': [-0.07, -0.01], 'Adyar': [-0.05, 0.01], 'Mylapore': [-0.02, 0.01],
  'Kondapur': [0.08, -0.1], 'Gachibowli': [0.05, -0.12], 'Banjara Hills': [0.01, -0.05], 'Hitech City': [0.06, -0.11], 'Kukatpally': [0.1, -0.08],
};

// Component to dynamically re-center the map when the city prop changes
function ChangeMapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 11, { animate: true, duration: 1 });
  }, [center, map]);
  return null;
}

export default function ZoneMap({ city, zone }) {
  const center = CITY_COORDS[city] || CITY_COORDS['Mumbai'];
  
  // Calculate zone coordinate
  const zoneOffset = ZONE_OFFSETS[zone] || [0.02, 0.02];
  const zoneCenter = [center[0] + zoneOffset[0], center[1] + zoneOffset[1]];

  return (
    <div style={{ height: 320, width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false} scrollWheelZoom={false}>
        {/* Using a dark map tile provider to match the UI aesthetics */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <ChangeMapCenter center={center} />
        
        {/* ENTIRE CITY HIGHLIGHT IN RED (Opacity ~0.15) */}
        <Circle 
          center={center} 
          radius={12000} 
          pathOptions={{ color: '#ff4d4d', fillColor: '#ff4d4d', fillOpacity: 0.15, weight: 1, dashArray: '4' }} 
        />

        {/* WORKER'S OPERATIONAL ZONE HIGHLIGHT IN BLUE (Opacity ~0.4) */}
        <Circle 
          center={zoneCenter} 
          radius={3000} 
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.4, weight: 2 }} 
        />
      </MapContainer>

      {/* Floating Legend */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
        background: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(8px)',
        padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', gap: 6
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <div style={{ width: 12, height: 12, background: 'rgba(255,77,77,0.4)', border: '1px solid #ff4d4d', borderRadius: '50%' }} />
          <span>City Region ({city || 'Mumbai'})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <div style={{ width: 12, height: 12, background: 'rgba(59,130,246,0.5)', border: '1px solid #3b82f6', borderRadius: '50%' }} />
          <span>Active Zone ({zone || 'Selected'})</span>
        </div>
      </div>
    </div>
  );
}
