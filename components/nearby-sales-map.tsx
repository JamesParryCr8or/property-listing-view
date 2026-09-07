"use client";

import { useEffect, useRef, useState } from "react";
import { House, MapPin } from "lucide-react";

export type NearbySale = {
  id: string;
  label: string;
  price: number;
  year: number;
  distance: string;
  lat: number;
  lng: number;
};

let mapsLoader: Promise<void> | null = null;

type MapsWindow = Window & {
  google?: typeof google;
  __listwiseMapsReady?: () => void;
};

function loadMaps(apiKey: string) {
  const mapsWindow = window as MapsWindow;
  const loadedGoogle = mapsWindow.google;
  if (loadedGoogle?.maps) return Promise.resolve();
  if (mapsLoader) return mapsLoader;

  mapsLoader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    mapsWindow.__listwiseMapsReady = () => {
      delete mapsWindow.__listwiseMapsReady;
      resolve();
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&libraries=marker&callback=__listwiseMapsReady`;
    script.async = true;
    script.onerror = () => {
      delete mapsWindow.__listwiseMapsReady;
      mapsLoader = null;
      reject(new Error("Google Maps failed to load"));
    };
    document.head.appendChild(script);
  });

  return mapsLoader;
}

function markerContent(sale: NearbySale) {
  const element = document.createElement("button");
  element.className = "map-price-marker";
  element.type = "button";
  element.setAttribute("aria-label", `${sale.label}, sold for £${sale.price.toLocaleString()} in ${sale.year}`);
  const price = document.createElement("strong");
  price.textContent = `£${Math.round(sale.price / 1000)}k`;
  const year = document.createElement("span");
  year.textContent = String(sale.year);
  element.append(price, year);
  return element;
}

export function NearbySalesMap({ sales, center = { lat: 53.3279, lng: -2.2353 }, homeLabel = "Oakfield House" }: { sales: NearbySale[]; center?: { lat:number; lng:number }; homeLabel?: string }) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [selected, setSelected] = useState<NearbySale | null>(sales[0] ?? null);

  useEffect(() => {
    let cancelled = false;
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];

    async function initialise() {
      try {
        const response = await fetch("/api/maps-config");
        if (!response.ok) throw new Error("Map configuration unavailable");
        const { apiKey } = await response.json() as { apiKey: string };
        await loadMaps(apiKey);
        if (cancelled || !mapNode.current) return;

        const mapsApi = (window as MapsWindow).google?.maps;
        if (!mapsApi) throw new Error("Google Maps did not initialise");
        const { Map } = await mapsApi.importLibrary("maps") as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } = await mapsApi.importLibrary("marker") as google.maps.MarkerLibrary;
        const map = new Map(mapNode.current, {
          center,
          zoom: 15,
          mapId: "DEMO_MAP_ID",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: "cooperative",
        });

        const homeMarker = document.createElement("div");
        homeMarker.className = "map-home-marker";
        const homeLabelElement = document.createElement("span");
        homeLabelElement.textContent = homeLabel;
        homeMarker.append(homeLabelElement);
        markers.push(new AdvancedMarkerElement({
          map,
          position: center,
          title: homeLabel,
          content: homeMarker,
          zIndex: 10,
        }));

        sales.forEach((sale) => {
          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: sale.lat, lng: sale.lng },
            title: sale.label,
            content: markerContent(sale),
          });
          marker.addListener("click", () => setSelected(sale));
          markers.push(marker);
        });

        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    initialise();
    return () => {
      cancelled = true;
      markers.forEach((marker) => { marker.map = null; });
    };
  }, [sales, center.lat, center.lng, homeLabel]);

  useEffect(() => {
    if (selected && !sales.some((sale) => sale.id === selected.id)) {
      setSelected(sales[0] ?? null);
    }
  }, [sales, selected]);

  return (
    <div className="google-map-shell">
      <div ref={mapNode} className="google-map" aria-label="Interactive map of nearby sold homes" />
      {state === "loading" && <div className="map-status"><MapPin />Loading Google Maps…</div>}
      {state === "error" && <div className="map-status map-error"><MapPin /><b>Google Maps could not load.</b><span>Check that Maps JavaScript API is enabled for this key.</span></div>}
      {state === "ready" && selected && <div className="map-sale-card"><span className="map-sale-icon"><House /></span><div><small>Sold {selected.year} · {selected.distance} away</small><b>{selected.label}</b><strong>£{selected.price.toLocaleString()}</strong></div></div>}
      <div className="map-key">Google Maps · Illustrative sold-price data</div>
    </div>
  );
}
