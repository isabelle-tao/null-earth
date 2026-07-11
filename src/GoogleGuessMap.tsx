import { useEffect, useRef, useState } from "react";
import type { Coordinates, GuessResult } from "../shared/game";
import { loadGoogleMaps } from "./googleMapsLoader";

type GoogleGuessMapProps = {
  selectedGuess: Coordinates | null;
  result: GuessResult | null;
  disabled: boolean;
  onGuessChange: (guess: Coordinates) => void;
};

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#171a1d" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#171a1d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#818b92" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#3a4148" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#252b30" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d161b" }] },
];

export function GoogleGuessMap({ selectedGuess, result, disabled, onGuessChange }: GoogleGuessMapProps) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const disabledRef = useRef(disabled);
  const guessMarkerRef = useRef<google.maps.Marker | null>(null);
  const actualMarkerRef = useRef<google.maps.Marker | null>(null);
  const lineRef = useRef<google.maps.Polyline | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapElement.current) return;
        const map = new google.maps.Map(mapElement.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          minZoom: 2,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          gestureHandling: "greedy",
          styles: darkMapStyles,
        });

        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (disabledRef.current || !event.latLng) return;
          onGuessChange({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        });

        mapRef.current = map;
      })
      .catch(() => setError("Google Maps could not load. Check the browser API key and referrer restrictions."));

    return () => {
      cancelled = true;
    };
  }, [onGuessChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!selectedGuess) {
      guessMarkerRef.current?.setMap(null);
      guessMarkerRef.current = null;
      return;
    }

    if (!guessMarkerRef.current) {
      guessMarkerRef.current = new google.maps.Marker({
        position: selectedGuess,
        map,
        draggable: !disabled,
        title: "Your guess",
        icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });

      guessMarkerRef.current.addListener("dragend", () => {
        const position = guessMarkerRef.current?.getPosition();
        if (!position || disabledRef.current) return;
        onGuessChange({ lat: position.lat(), lng: position.lng() });
      });
    } else {
      guessMarkerRef.current.setPosition(selectedGuess);
      guessMarkerRef.current.setDraggable(!disabled);
    }
  }, [disabled, onGuessChange, selectedGuess]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    actualMarkerRef.current?.setMap(null);
    lineRef.current?.setMap(null);
    actualMarkerRef.current = null;
    lineRef.current = null;

    if (!result) return;

    actualMarkerRef.current = new google.maps.Marker({
      position: result.actual,
      map,
      title: "Actual location",
      icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    });

    lineRef.current = new google.maps.Polyline({
      path: [result.guess, result.actual],
      map,
      strokeColor: "#d7ff5f",
      strokeOpacity: 0.9,
      strokeWeight: 2,
    });

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(result.guess);
    bounds.extend(result.actual);
    map.fitBounds(bounds, 72);
  }, [result]);

  if (error) {
    return (
      <div className="map-error">
        <div className="mono-label">MAP LINK FAILURE</div>
        <p>{error}</p>
      </div>
    );
  }

  return <div ref={mapElement} className="guess-map" aria-label="Interactive guess map" />;
}
