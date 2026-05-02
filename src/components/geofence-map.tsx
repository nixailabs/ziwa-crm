"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  Marker,
  Polygon,
  useJsApiLoader,
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, MapPin, Plus, Save } from "lucide-react";
import { toast } from "sonner";

type Point = { lat: number; lng: number };

const containerStyle = { width: "100%", height: "440px", borderRadius: "8px" };
const defaultCenter: Point = { lat: 30.0444, lng: 31.2357 }; // Cairo

export function GeofenceMap({ plotId }: { plotId: number }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: "google-map-script",
  });

  const [points, setPoints] = useState<Point[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    fetch(`/api/plots/${plotId}/coordinates`)
      .then((r) => r.json())
      .then((rows: { lat: number; lng: number }[]) => {
        setPoints(rows.map((r) => ({ lat: Number(r.lat), lng: Number(r.lng) })));
      });
  }, [plotId]);

  const center = useMemo(() => {
    if (points.length === 0) return defaultCenter;
    const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
    return { lat, lng };
  }, [points]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    setPoints((prev) => [...prev, { lat: e.latLng!.lat(), lng: e.latLng!.lng() }]);
    setDirty(true);
  }, []);

  function removePoint(idx: number) {
    setPoints((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  }
  function clear() {
    if (!confirm("Clear all points?")) return;
    setPoints([]);
    setDirty(true);
  }
  function addManual() {
    const lat = Number(latInput);
    const lng = Number(lngInput);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      toast.error("Enter valid lat/lng");
      return;
    }
    setPoints((prev) => [...prev, { lat, lng }]);
    setLatInput("");
    setLngInput("");
    setDirty(true);
    if (mapRef.current) mapRef.current.panTo({ lat, lng });
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/plots/${plotId}/coordinates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Geofence saved");
      setDirty(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!apiKey) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border bg-amber-50 text-amber-900 p-3 text-sm">
          Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your <code>.env</code> to
          enable the interactive Google Map. You can still add coordinates manually
          below.
        </div>
        <ManualOnly
          points={points}
          onAdd={(p) => {
            setPoints([...points, p]);
            setDirty(true);
          }}
          onRemove={(i) => {
            setPoints(points.filter((_, idx) => idx !== i));
            setDirty(true);
          }}
          onClear={() => {
            setPoints([]);
            setDirty(true);
          }}
          onSave={save}
          saving={saving}
          dirty={dirty}
        />
      </div>
    );
  }

  if (loadError) return <div className="text-destructive text-sm">Failed to load map</div>;
  if (!isLoaded) return <div className="text-sm text-muted-foreground">Loading map...</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label>Latitude</Label>
          <Input
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            className="w-36"
            placeholder="30.0444"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Longitude</Label>
          <Input
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            className="w-36"
            placeholder="31.2357"
          />
        </div>
        <Button type="button" variant="outline" onClick={addManual}>
          <Plus className="h-4 w-4" /> Add point
        </Button>
        <Button type="button" variant="outline" onClick={clear} disabled={points.length === 0}>
          <Trash2 className="h-4 w-4" /> Clear
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {points.length} point{points.length !== 1 ? "s" : ""}
          </span>
          <Button onClick={save} disabled={!dirty || saving}>
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click anywhere on the map to add a point. Add at least 3 points to draw the
        geofence polygon.
      </p>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={points.length > 0 ? 16 : 6}
        onClick={onMapClick}
        onLoad={(m) => {
          mapRef.current = m;
        }}
        options={{
          mapTypeId: "hybrid",
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {points.map((p, i) => (
          <Marker
            key={i}
            position={p}
            label={String(i + 1)}
            onClick={() => removePoint(i)}
          />
        ))}
        {points.length >= 3 && (
          <Polygon
            paths={points}
            options={{
              fillColor: "#16a34a",
              fillOpacity: 0.25,
              strokeColor: "#15803d",
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>

      {points.length > 0 && (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-2 w-12">#</th>
                <th className="text-left p-2">Latitude</th>
                <th className="text-left p-2">Longitude</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{p.lat.toFixed(6)}</td>
                  <td className="p-2">{p.lng.toFixed(6)}</td>
                  <td className="p-2">
                    <Button size="icon" variant="ghost" onClick={() => removePoint(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ManualOnly({
  points,
  onAdd,
  onRemove,
  onClear,
  onSave,
  saving,
  dirty,
}: {
  points: Point[];
  onAdd: (p: Point) => void;
  onRemove: (i: number) => void;
  onClear: () => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label>Latitude</Label>
          <Input value={lat} onChange={(e) => setLat(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1.5">
          <Label>Longitude</Label>
          <Input value={lng} onChange={(e) => setLng(e.target.value)} className="w-36" />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const a = Number(lat), b = Number(lng);
            if (Number.isNaN(a) || Number.isNaN(b)) return;
            onAdd({ lat: a, lng: b });
            setLat("");
            setLng("");
          }}
        >
          <Plus className="h-4 w-4" /> Add point
        </Button>
        <Button type="button" variant="outline" onClick={onClear} disabled={points.length === 0}>
          <Trash2 className="h-4 w-4" /> Clear
        </Button>
        <Button onClick={onSave} disabled={!dirty || saving} className="ml-auto">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      {points.length > 0 ? (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-2 w-12">#</th>
                <th className="text-left p-2">Latitude</th>
                <th className="text-left p-2">Longitude</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{p.lat.toFixed(6)}</td>
                  <td className="p-2">{p.lng.toFixed(6)}</td>
                  <td className="p-2">
                    <Button size="icon" variant="ghost" onClick={() => onRemove(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <MapPin className="h-5 w-5" />
          No points yet
        </div>
      )}
    </div>
  );
}
