"use client";

import { useState, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "12px",
  marginTop: "10px"
};

const center = {
  lat: 33.7490, // Default to Atlanta (GA) area based on your previous work
  lng: -84.3880
};

const libraries: ("drawing" | "geometry" | "places")[] = ["drawing", "geometry"];

export default function TravelZoneManager({ 
  token, 
  initialZones,
  initialSurcharges
}: { 
  token: string, 
  initialZones: string | null,
  initialSurcharges: string | null
}) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBrqceLxzUFP10j5Qk4denO3TsArUIAdBc",
    libraries
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zones, setZones] = useState<any[]>(initialZones ? JSON.parse(initialZones) : []);
  const [surcharges, setSurcharges] = useState<any>(initialSurcharges ? JSON.parse(initialSurcharges) : {});
  const [loading, setLoading] = useState(false);

  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const coords = [];
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coords.push({ lat: point.lat(), lng: point.lng() });
    }
    
    const newZone = { id: Date.now().toString(), path: coords, name: `Zone ${zones.length + 1}` };
    setZones(prev => [...prev, newZone]);
    polygon.setMap(null); // Remove the drawn shape so we can render it from state
  }, [zones]);

  const save = async () => {
    setLoading(true);
    const res = await fetch(`/api/provider/${token}/travel-zones`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ zones, surcharges })
    });
    if (res.ok) {
      alert("Travel zones saved!");
    } else {
      alert("Failed to save zones.");
    }
    setLoading(false);
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div style={{ marginTop: 15 }}>
      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>
        Draw your custom travel zones. Use the polygon tool to outline your service area.
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onLoad={map => setMap(map)}
      >
        <DrawingManager
          onPolygonComplete={onPolygonComplete}
          options={{
            drawingControl: true,
            drawingControlOptions: {
              position: google.maps.ControlPosition.TOP_CENTER,
              drawingModes: [google.maps.drawing.OverlayType.POLYGON]
            },
            polygonOptions: {
              fillColor: "#D4AF37",
              fillOpacity: 0.3,
              strokeWeight: 2,
              strokeColor: "#D4AF37",
              clickable: true,
              editable: true,
              zIndex: 1
            }
          }}
        />

        {zones.map((zone) => (
          <Polygon
            key={zone.id}
            path={zone.path}
            options={{
              fillColor: "#D4AF37",
              fillOpacity: 0.2,
              strokeColor: "#D4AF37",
              strokeWeight: 2
            }}
          />
        ))}
      </GoogleMap>

      <div style={{ marginTop: 15, display: "grid", gap: 10 }}>
        {zones.map(z => (
          <div key={z.id} style={zoneCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800 }}>{z.name}</span>
              <button 
                onClick={() => setZones(zones.filter(zone => zone.id !== z.id))}
                style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontSize: 11 }}
              >
                Delete
              </button>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
              <label style={{ fontSize: 12 }}>Surcharge:</label>
              <input 
                type="number"
                placeholder="0"
                value={surcharges[z.id] || ""}
                onChange={e => setSurcharges({ ...surcharges, [z.id]: e.target.value })}
                style={numInput}
              />
              <span style={{ fontSize: 12, opacity: 0.6 }}>$ USD</span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={loading} style={btnStyle}>
        {loading ? "Saving..." : "Save Travel Settings"}
      </button>
    </div>
  );
}

const zoneCard = {
  padding: "10px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)"
};

const numInput = {
  width: "60px",
  padding: "4px 8px",
  borderRadius: "6px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.2)",
  color: "white"
};

const btnStyle = {
  marginTop: "15px",
  padding: "12px",
  borderRadius: "10px",
  background: "#D4AF37",
  color: "black",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer",
  width: "100%"
};
