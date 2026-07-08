export type LocationCategory = "Liminal" | "Horror" | "Industrial" | "Nature" | "Urban";
export type SceneProfile = "claustrophobic" | "wide-open" | "street-clue" | "landmark";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type StreetViewConfig = {
  heading: number;
  pitch: number;
  fov: number;
  panoId?: string;
};

export type GameLocation = Coordinates & {
  id: string;
  country: string;
  region: string;
  label: string;
  category: LocationCategory;
  sceneProfile: SceneProfile;
  clueDensity: "low" | "medium" | "high";
  peoplePolicy: "verified-empty" | "needs-review";
  streetView: StreetViewConfig;
  status: "active" | "inactive";
};

export type RoundPublic = {
  roundId: string;
  imageUrl: string;
  category: LocationCategory;
};

export type GuessResult = {
  roundId: string;
  actual: Coordinates & {
    country: string;
    region: string;
    label: string;
    category: LocationCategory;
  };
  guess: Coordinates;
  distanceKm: number;
  displayDistance: string;
  points: number;
};

const EARTH_RADIUS_KM = 6371.0088;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineKm(a: Coordinates, b: Coordinates): number {
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const value = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function scoreForDistance(distanceKm: number): number {
  if (distanceKm <= 0.2) return 50;
  if (distanceKm <= 1) return 45;
  if (distanceKm <= 5) return 35;
  if (distanceKm <= 25) return 25;
  if (distanceKm <= 100) return 15;
  if (distanceKm <= 500) return 5;
  if (distanceKm <= 1000) return 2;
  if (distanceKm <= 3000) return 1;
  return 0;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 100) {
    return `${distanceKm.toFixed(1)} km`;
  }
  return `${Math.round(distanceKm).toLocaleString("en-US")} km`;
}

export function isValidCoordinate(value: unknown): value is Coordinates {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Coordinates;
  return (
    Number.isFinite(candidate.lat) &&
    Number.isFinite(candidate.lng) &&
    candidate.lat >= -90 &&
    candidate.lat <= 90 &&
    candidate.lng >= -180 &&
    candidate.lng <= 180
  );
}
