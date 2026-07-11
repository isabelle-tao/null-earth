import { Loader } from "@googlemaps/js-api-loader";

const browserKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;
let loadPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps() {
  if (!browserKey) {
    return Promise.reject(new Error("VITE_GOOGLE_MAPS_BROWSER_KEY is required."));
  }

  loadPromise ??= new Loader({
    apiKey: browserKey,
    version: "weekly",
  }).load();

  return loadPromise;
}
