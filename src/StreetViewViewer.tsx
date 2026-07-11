import { useEffect, useRef, useState } from "react";
import type { StreetViewViewerPublic } from "../shared/game";
import { loadGoogleMaps } from "./googleMapsLoader";

export type StreetViewCommand = {
  id: number;
  action: "reset" | "zoom-in" | "zoom-out";
};

type StreetViewViewerProps = {
  viewer: StreetViewViewerPublic;
  command: StreetViewCommand | null;
};

export function StreetViewViewer({ viewer, command }: StreetViewViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let statusListener: google.maps.MapsEventListener | undefined;
    setFallbackMessage(null);

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const panorama =
          panoramaRef.current ??
          new google.maps.StreetViewPanorama(containerRef.current, {
            addressControl: false,
            clickToGo: false,
            disableDefaultUI: true,
            enableCloseButton: false,
            fullscreenControl: false,
            linksControl: false,
            motionTracking: false,
            motionTrackingControl: false,
            panControl: false,
            showRoadLabels: false,
            visible: true,
            zoom: 1,
            zoomControl: true,
          });

        panoramaRef.current = panorama;
        panorama.setPov(viewer.pov);
        panorama.setZoom(1);
        panorama.setVisible(true);

        if (viewer.panoId) {
          panorama.setPano(viewer.panoId);
        } else if (viewer.position) {
          panorama.setPosition(viewer.position);
        } else {
          setFallbackMessage("No panorama location was provided for this round.");
        }

        statusListener = panorama.addListener("status_changed", () => {
          const status = panorama.getStatus();
          if (status === google.maps.StreetViewStatus.ZERO_RESULTS || status === google.maps.StreetViewStatus.UNKNOWN_ERROR) {
            setFallbackMessage("Street View panorama could not be loaded for this round.");
          }
        });
      })
      .catch(() => setFallbackMessage("Google Maps could not load. Showing the static clue instead."));

    return () => {
      cancelled = true;
      statusListener?.remove();
      panoramaRef.current?.setVisible(false);
      panoramaRef.current = null;
    };
  }, [viewer]);

  useEffect(() => {
    if (!command || !panoramaRef.current) return;

    const panorama = panoramaRef.current;
    if (command.action === "reset") {
      panorama.setPov(viewer.pov);
      panorama.setZoom(1);
      return;
    }

    const nextZoom = command.action === "zoom-in" ? panorama.getZoom() + 1 : panorama.getZoom() - 1;
    panorama.setZoom(Math.max(0, Math.min(4, nextZoom)));
  }, [command, viewer.pov]);

  if (fallbackMessage) {
    return (
      <div className="street-view-fallback">
        <img src={viewer.fallbackImageUrl} alt="Mystery street view location" />
        <div className="viewer-fallback-note">
          <p className="mono-label">STATIC VIEW FALLBACK</p>
          <p>{fallbackMessage}</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="street-view-panorama" aria-label="Interactive Street View clue" />;
}
